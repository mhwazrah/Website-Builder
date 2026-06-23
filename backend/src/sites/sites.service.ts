import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Site } from '../entities/site.entity';
import { Page } from '../entities/page.entity';
import { Section } from '../entities/section.entity';
import { ColorPalette, SiteSnapshot } from '../common/types';
import { UploadService } from '../upload/upload.service';
import { ColorExtractionService } from '../upload/color-extraction.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { isValidSubdomain, normalizeSubdomain } from './util/subdomain.util';
import { buildTemplateSections } from '../templates/templates.catalog';

/** The factory-default brand color seeded on new sites. */
const DEFAULT_PRIMARY_COLOR = '#2563eb';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site) private readonly sites: Repository<Site>,
    @InjectRepository(Page) private readonly pages: Repository<Page>,
    @InjectRepository(Section) private readonly sections: Repository<Section>,
    private readonly upload: UploadService,
    private readonly colors: ColorExtractionService,
  ) {}

  /** Flag the draft as having changes not yet published. Cheap, fire-and-forget. */
  async markDirty(siteId: string): Promise<void> {
    await this.sites.update(siteId, { hasUnpublishedChanges: true });
  }

  /** List view — no relations needed. */
  async findAll(): Promise<Site[]> {
    return this.sites.find({ order: { createdAt: 'ASC' } });
  }

  /**
   * Create a site (validating/normalizing the subdomain) and seed a single
   * home page, then reload the full aggregate.
   */
  async create(dto: CreateSiteDto): Promise<Site> {
    const subdomain = normalizeSubdomain(dto.subdomain);
    if (!isValidSubdomain(subdomain)) {
      throw new BadRequestException('Invalid subdomain');
    }

    const taken = await this.sites.exists({ where: { subdomain } });
    if (taken) {
      throw new ConflictException('Subdomain is already taken');
    }

    const site = this.sites.create({
      name: dto.name,
      subdomain,
      languageMode: dto.languageMode,
      defaultLanguage: dto.defaultLanguage,
    });
    const saved = await this.sites.save(site);

    // Seed the mandatory home page.
    const home = this.pages.create({
      siteId: saved.id,
      slug: 'home',
      isHome: true,
      order: 0,
      showInNav: true,
      title: { en: 'Home', ar: 'الرئيسية' },
    });
    const savedHome = await this.pages.save(home);

    // Seed sections from the chosen starter template (empty for 'blank').
    const templateSections = buildTemplateSections(dto.templateId);
    if (templateSections.length) {
      const rows = templateSections.map((s, i) =>
        this.sections.create({
          pageId: savedHome.id,
          type: s.type,
          title: s.title,
          subtitle: s.subtitle,
          anchor: s.anchor,
          showInNav: s.showInNav,
          order: i,
          content: s.content,
          settings: s.settings,
        }),
      );
      await this.sections.save(rows);
    }

    // Publish the initial state so the site is immediately viewable and starts
    // with a clean draft baseline (no unpublished changes).
    await this.publish(saved.id);
    return this.findOne(saved.id);
  }

  /**
   * Fetch a single site with its pages and each page's sections, all ordered by
   * `order` ascending.
   */
  async findOne(id: string): Promise<Site> {
    const site = await this.sites.findOne({
      where: { id },
      relations: { pages: { sections: true } },
      order: { pages: { order: 'ASC', sections: { order: 'ASC' } } },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    return site;
  }

  /** Update mutable fields; re-check subdomain uniqueness when it changes. */
  async update(id: string, dto: UpdateSiteDto): Promise<Site> {
    const site = await this.sites.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (dto.subdomain !== undefined) {
      const subdomain = normalizeSubdomain(dto.subdomain);
      if (!isValidSubdomain(subdomain)) {
        throw new BadRequestException('Invalid subdomain');
      }
      const taken = await this.sites.exists({
        where: { subdomain, id: Not(id) },
      });
      if (taken) {
        throw new ConflictException('Subdomain is already taken');
      }
      site.subdomain = subdomain;
    }

    if (dto.name !== undefined) site.name = dto.name;
    if (dto.languageMode !== undefined) site.languageMode = dto.languageMode;
    if (dto.defaultLanguage !== undefined)
      site.defaultLanguage = dto.defaultLanguage;
    if (dto.primaryColor !== undefined) site.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined)
      site.secondaryColor = dto.secondaryColor;
    if (dto.published !== undefined) site.published = dto.published;
    if (dto.metaTitle !== undefined) site.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined)
      site.metaDescription = dto.metaDescription;
    if (dto.faviconUrl !== undefined) site.faviconUrl = dto.faviconUrl;
    if (dto.logoLightUrl !== undefined) site.logoLightUrl = dto.logoLightUrl;
    if (dto.logoDarkUrl !== undefined) site.logoDarkUrl = dto.logoDarkUrl;
    if (dto.navItems !== undefined) site.navItems = dto.navItems;
    if (dto.fontFamily !== undefined) site.fontFamily = dto.fontFamily;
    if (dto.footer !== undefined) site.footer = dto.footer;
    if (dto.socialLinks !== undefined) site.socialLinks = dto.socialLinks;
    if (dto.lightBackground !== undefined)
      site.lightBackground = dto.lightBackground;
    if (dto.darkBackground !== undefined)
      site.darkBackground = dto.darkBackground;
    if (dto.borderRadius !== undefined) site.borderRadius = dto.borderRadius;
    if (dto.navAlign !== undefined) site.navAlign = dto.navAlign;
    if (dto.themeMode !== undefined) site.themeMode = dto.themeMode;

    // Settings/branding changes are draft changes until published.
    site.hasUnpublishedChanges = true;
    await this.sites.save(site);
    // Return without relations (PATCH contract).
    return (await this.sites.findOne({ where: { id } }))!;
  }

  /**
   * Promote the live (draft) tree to the published snapshot served to visitors.
   * Freezes pages + sections into `publishedData` and clears the dirty flag.
   */
  async publish(id: string): Promise<Site> {
    const site = await this.sites.findOne({
      where: { id },
      relations: { pages: { sections: true } },
      order: { pages: { order: 'ASC', sections: { order: 'ASC' } } },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    const now = new Date();
    const snapshot: SiteSnapshot = {
      publishedAt: now.toISOString(),
      navItems: site.navItems ?? [],
      pages: (site.pages ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        order: p.order,
        showInNav: p.showInNav,
        isHome: p.isHome,
        sections: (p.sections ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            subtitle: s.subtitle,
            anchor: s.anchor,
            showInNav: s.showInNav,
            order: s.order,
            content: s.content,
            settings: s.settings,
          })),
      })),
    };
    site.publishedData = snapshot;
    site.publishedAt = now;
    site.published = true;
    site.hasUnpublishedChanges = false;
    await this.sites.save(site);
    return (await this.sites.findOne({ where: { id } }))!;
  }

  /** Delete a site (cascades to its pages/sections via the entity relations). */
  async remove(id: string): Promise<void> {
    const result = await this.sites.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Site not found');
    }
  }

  /**
   * Availability check for a subdomain. Invalid values are reported as
   * unavailable. An optional `excludeId` lets the current site keep its own
   * subdomain during edits.
   */
  async checkSubdomain(
    value: string,
    excludeId?: string,
  ): Promise<{ available: boolean }> {
    const subdomain = normalizeSubdomain(value);
    if (!isValidSubdomain(subdomain)) {
      return { available: false };
    }
    const exists = await this.sites.exists({
      where: excludeId
        ? { subdomain, id: Not(excludeId) }
        : { subdomain },
    });
    return { available: !exists };
  }

  /**
   * Persist a logo (light or dark), derive a palette from it, and store the
   * URL. On the first upload to a still-default site, seed the brand colors
   * from the palette. `extractedColors` is always refreshed.
   */
  async setLogo(
    id: string,
    mode: 'light' | 'dark',
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<{ url: string; mode: 'light' | 'dark'; palette: ColorPalette; site: Site }> {
    const site = await this.sites.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    const url = await this.upload.saveImage(buffer, filename || `logo-${mode}`);
    const palette = await this.colors.extractFromBuffer(buffer);

    if (mode === 'dark') {
      site.logoDarkUrl = url;
    } else {
      site.logoLightUrl = url;
    }

    // Auto-generate a square favicon from the uploaded logo (prefer the light
    // logo; fall back to whatever was just uploaded if there is no favicon yet).
    if (mode === 'light' || !site.faviconUrl) {
      const favicon = await this.upload.saveFavicon(buffer);
      if (favicon) site.faviconUrl = favicon;
    }

    // Seed brand colors only while the site still carries the factory default.
    if (site.primaryColor === DEFAULT_PRIMARY_COLOR) {
      site.primaryColor = palette.primary;
      site.secondaryColor = palette.secondary;
    }
    // Always refresh the suggested palette.
    site.extractedColors = palette.colors;
    site.hasUnpublishedChanges = true;

    const saved = await this.sites.save(site);
    return { url, mode, palette, site: saved };
  }
}
