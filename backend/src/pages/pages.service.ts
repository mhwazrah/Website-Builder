import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Page } from '../entities/page.entity';
import { Site } from '../entities/site.entity';
import { Section } from '../entities/section.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page) private pages: Repository<Page>,
    @InjectRepository(Site) private sites: Repository<Site>,
    @InjectRepository(Section) private sections: Repository<Section>,
  ) {}

  private markDirty(siteId: string): Promise<unknown> {
    return this.sites.update(siteId, { hasUnpublishedChanges: true });
  }

  async create(siteId: string, dto: CreatePageDto): Promise<Page> {
    const site = await this.sites.findOne({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException(`Site ${siteId} not found`);
    }
    const order = await this.pages.count({ where: { siteId } });
    const page = this.pages.create({
      siteId,
      title: dto.title ?? {},
      slug: dto.slug,
      showInNav: dto.showInNav ?? true,
      isHome: dto.isHome ?? false,
      order,
    });
    const saved = await this.pages.save(page);
    await this.markDirty(siteId);
    return saved;
  }

  async update(id: string, dto: UpdatePageDto): Promise<Page> {
    const page = await this.pages.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    Object.assign(page, dto);
    const saved = await this.pages.save(page);
    await this.markDirty(page.siteId);
    return saved;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const page = await this.pages.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    const siteId = page.siteId;
    await this.pages.remove(page);
    await this.markDirty(siteId);
    return { deleted: true };
  }

  /** Deep-clone a page and all its sections (regenerating ids), appended last. */
  async duplicate(id: string): Promise<Page> {
    const original = await this.pages.findOne({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    const order = await this.pages.count({ where: { siteId: original.siteId } });
    const copy = await this.pages.save(
      this.pages.create({
        siteId: original.siteId,
        title: clone(original.title),
        slug: `${original.slug}-copy`,
        showInNav: original.showInNav,
        isHome: false,
        order,
      }),
    );

    const originalSections = await this.sections.find({
      where: { pageId: original.id },
      order: { order: 'ASC' },
    });
    if (originalSections.length) {
      const rows = originalSections.map((s) =>
        this.sections.create({
          pageId: copy.id,
          type: s.type,
          title: clone(s.title),
          subtitle: clone(s.subtitle),
          anchor: s.anchor,
          showInNav: s.showInNav,
          order: s.order,
          content: regenerateIds(clone(s.content)),
          settings: clone(s.settings),
        }),
      );
      await this.sections.save(rows);
    }

    await this.markDirty(original.siteId);
    return (await this.pages.findOne({
      where: { id: copy.id },
      relations: { sections: true },
    }))!;
  }

  async reorder(siteId: string, ids: string[]): Promise<Page[]> {
    const pages = await this.pages.find({ where: { siteId } });
    const byId = new Map(pages.map((p) => [p.id, p]));
    const updated: Page[] = [];
    ids.forEach((id, index) => {
      const page = byId.get(id);
      if (page) {
        page.order = index;
        updated.push(page);
      }
    });
    if (updated.length) {
      await this.pages.save(updated);
    }
    await this.markDirty(siteId);
    return this.pages.find({ where: { siteId }, order: { order: 'ASC' } });
  }
}

function clone<T>(v: T): T {
  return v == null ? v : (JSON.parse(JSON.stringify(v)) as T);
}

/** Regenerate `id` props on objects inside arrays (duplicated section items). */
function regenerateIds<T>(value: T): T {
  walkRegen(value);
  return value;
}

function walkRegen(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if (typeof obj.id === 'string') obj.id = randomUUID();
      }
      walkRegen(item);
    }
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const k of Object.keys(obj)) walkRegen(obj[k]);
  }
}
