import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Section } from '../entities/section.entity';
import { Page } from '../entities/page.entity';
import { SitesService } from '../sites/sites.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

/**
 * CRUD + ordering + duplication for the sections that make up a page. Sections
 * are scoped to a page and ordered by `order` (0-based). Any mutation flags the
 * owning site's draft as having unpublished changes.
 */
@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sections: Repository<Section>,
    @InjectRepository(Page)
    private readonly pages: Repository<Page>,
    private readonly sites: SitesService,
  ) {}

  async create(pageId: string, dto: CreateSectionDto): Promise<Section> {
    const page = await this.requirePage(pageId);
    const order = await this.sections.count({ where: { pageId } });
    const section = this.sections.create({
      pageId,
      type: dto.type,
      title: dto.title ?? {},
      subtitle: dto.subtitle ?? {},
      // Anchors are managed behind the scenes; auto-generate a stable, unique
      // one when the client doesn't supply it (the editor no longer exposes it).
      anchor: dto.anchor || `sec-${randomUUID().slice(0, 8)}`,
      showInNav: dto.showInNav ?? true,
      order,
      content: dto.content ?? {},
      settings: dto.settings ?? {},
    });
    const saved = await this.sections.save(section);
    await this.sites.markDirty(page.siteId);
    return saved;
  }

  async update(id: string, dto: UpdateSectionDto): Promise<Section> {
    const section = await this.sections.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Section ${id} not found`);
    }
    if (dto.type !== undefined) section.type = dto.type;
    if (dto.title !== undefined) section.title = dto.title;
    if (dto.subtitle !== undefined) section.subtitle = dto.subtitle;
    if (dto.anchor !== undefined) section.anchor = dto.anchor;
    if (dto.showInNav !== undefined) section.showInNav = dto.showInNav;
    if (dto.content !== undefined) section.content = dto.content;
    if (dto.settings !== undefined) section.settings = dto.settings;
    const saved = await this.sections.save(section);
    await this.markDirtyByPage(section.pageId);
    return saved;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const section = await this.sections.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Section ${id} not found`);
    }
    const pageId = section.pageId;
    await this.sections.remove(section);
    await this.markDirtyByPage(pageId);
    return { deleted: true };
  }

  /** Deep-clone a section (regenerating inner item ids), appended to its page. */
  async duplicate(id: string): Promise<Section> {
    const original = await this.sections.findOne({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Section ${id} not found`);
    }
    const order = await this.sections.count({ where: { pageId: original.pageId } });
    const copy = this.sections.create({
      pageId: original.pageId,
      type: original.type,
      title: this.clone(original.title),
      subtitle: this.clone(original.subtitle),
      anchor: original.anchor ? `${original.anchor}-copy` : null,
      showInNav: original.showInNav,
      order,
      content: regenerateIds(this.clone(original.content)),
      settings: this.clone(original.settings),
    });
    const saved = await this.sections.save(copy);
    await this.markDirtyByPage(original.pageId);
    return saved;
  }

  async reorder(pageId: string, ids: string[]): Promise<Section[]> {
    await this.requirePage(pageId);
    if (ids.length > 0) {
      const owned = await this.sections.find({ where: { pageId, id: In(ids) } });
      const byId = new Map(owned.map((s) => [s.id, s]));
      const updated: Section[] = [];
      ids.forEach((id, index) => {
        const section = byId.get(id);
        if (section) {
          section.order = index;
          updated.push(section);
        }
      });
      if (updated.length > 0) {
        await this.sections.save(updated);
      }
    }
    await this.markDirtyByPage(pageId);
    return this.sections.find({ where: { pageId }, order: { order: 'ASC' } });
  }

  // --- helpers ---
  private async requirePage(pageId: string): Promise<Page> {
    const page = await this.pages.findOne({ where: { id: pageId } });
    if (!page) {
      throw new NotFoundException(`Page ${pageId} not found`);
    }
    return page;
  }

  private async markDirtyByPage(pageId: string): Promise<void> {
    const page = await this.pages.findOne({ where: { id: pageId } });
    if (page) await this.sites.markDirty(page.siteId);
  }

  private clone<T>(v: T): T {
    return v == null ? v : (JSON.parse(JSON.stringify(v)) as T);
  }
}

/**
 * Recursively regenerate any `id` property found on objects inside arrays, so a
 * duplicated section's repeated items (cards/slides/links/...) get fresh ids.
 * Mutates in place (the caller passes a clone) and returns the same value.
 */
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
