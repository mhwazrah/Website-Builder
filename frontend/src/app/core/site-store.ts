import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { languagesFor } from './i18n';
import {
  CreatePageDto,
  CreateSectionDto,
  Language,
  NavItem,
  Page,
  Section,
  SectionType,
  Site,
  UpdatePageDto,
  UpdateSectionDto,
  UpdateSiteDto,
} from './models';
import { defaultSectionTitle, sectionMeta } from './section-registry';

/** An undoable command: both directions persist + update local state. */
interface HistoryCommand {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

const HISTORY_LIMIT = 50;

/**
 * Builder-side state for a single site being edited. Holds the loaded (draft)
 * tree as signals and mediates every mutation through ApiService, tracking
 * unpublished changes and an undo/redo history for section edits + reorders.
 */
@Injectable({ providedIn: 'root' })
export class SiteStore {
  private readonly api = inject(ApiService);

  private readonly _site = signal<Site | null>(null);
  readonly site = this._site.asReadonly();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly activePageId = signal<string | null>(null);
  readonly editLanguage = signal<Language>('en');

  /** True when the draft has edits not yet published. */
  readonly dirty = signal(false);

  // --- Undo/redo (section update + reorder) ---
  private undoStack: HistoryCommand[] = [];
  private redoStack: HistoryCommand[] = [];
  private readonly undoDepth = signal(0);
  private readonly redoDepth = signal(0);
  readonly canUndo = computed(() => this.undoDepth() > 0);
  readonly canRedo = computed(() => this.redoDepth() > 0);

  readonly pages = computed<Page[]>(() =>
    [...(this._site()?.pages ?? [])].sort((a, b) => a.order - b.order),
  );
  readonly languages = computed<Language[]>(() =>
    languagesFor(this._site()?.languageMode ?? 'en'),
  );
  readonly isBilingual = computed(() => this.languages().length > 1);

  /** Authored navbar items for the current site. */
  readonly navItems = computed<NavItem[]>(() => this._site()?.navItems ?? []);

  /** All sections across every page (for the navbar "jump to section" picker). */
  readonly allSections = computed<Section[]>(() =>
    this.pages().flatMap((p) =>
      [...p.sections].sort((a, b) => a.order - b.order),
    ),
  );

  readonly activePage = computed<Page | null>(() => {
    const s = this._site();
    if (!s) return null;
    const id = this.activePageId();
    return (
      s.pages.find((p) => p.id === id) ??
      s.pages.find((p) => p.isHome) ??
      s.pages[0] ??
      null
    );
  });

  readonly sections = computed<Section[]>(() => {
    const p = this.activePage();
    return p ? [...p.sections].sort((a, b) => a.order - b.order) : [];
  });

  // --- Loading ---
  async load(siteId: string): Promise<void> {
    this.loading.set(true);
    try {
      const site = await firstValueFrom(this.api.getSite(siteId));
      this._site.set(site);
      const home = site.pages.find((p) => p.isHome) ?? site.pages[0];
      this.activePageId.set(home?.id ?? null);
      this.editLanguage.set(site.defaultLanguage);
      this.dirty.set(site.hasUnpublishedChanges ?? false);
      this.clearHistory();
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    const id = this._site()?.id;
    if (id) await this.load(id);
  }

  setActivePage(id: string): void {
    this.activePageId.set(id);
  }

  private markDirty(): void {
    this.dirty.set(true);
  }

  // --- Publish ---
  async publish(): Promise<void> {
    const id = this._site()?.id;
    if (!id) return;
    this.publishing.set(true);
    try {
      const updated = await firstValueFrom(this.api.publishSite(id));
      this.mergeSite({
        published: updated.published,
        publishedAt: updated.publishedAt,
        hasUnpublishedChanges: false,
      });
      this.dirty.set(false);
    } finally {
      this.publishing.set(false);
    }
  }

  // --- Site ---
  async saveSite(dto: UpdateSiteDto): Promise<void> {
    const id = this._site()?.id;
    if (!id) return;
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(this.api.updateSite(id, dto));
      const current = this._site();
      this._site.set({ ...updated, pages: current?.pages ?? updated.pages });
      this.markDirty();
    } finally {
      this.saving.set(false);
    }
  }

  /** Persist the authored navbar; updates local state + marks the draft dirty. */
  async saveNavItems(items: NavItem[]): Promise<void> {
    await this.saveSite({ navItems: items });
  }

  mergeSite(partial: Partial<Site>): void {
    const current = this._site();
    if (!current) return;
    const { pages: _ignore, ...rest } = partial;
    this._site.set({ ...current, ...rest });
  }

  // --- Pages ---
  async addPage(dto: CreatePageDto): Promise<Page> {
    const siteId = this._site()!.id;
    const page = await firstValueFrom(this.api.createPage(siteId, dto));
    this._site.update((s) => (s ? { ...s, pages: [...s.pages, page] } : s));
    this.markDirty();
    return page;
  }

  async updatePage(id: string, dto: UpdatePageDto): Promise<void> {
    const updated = await firstValueFrom(this.api.updatePage(id, dto));
    this.patchPage(id, (p) => ({ ...updated, sections: p.sections }));
    this.markDirty();
  }

  async deletePage(id: string): Promise<void> {
    await firstValueFrom(this.api.deletePage(id));
    this._site.update((s) =>
      s ? { ...s, pages: s.pages.filter((p) => p.id !== id) } : s,
    );
    if (this.activePageId() === id) {
      this.activePageId.set(this._site()?.pages[0]?.id ?? null);
    }
    this.markDirty();
  }

  /** Deep-clone a page (with its sections) and switch to it. */
  async duplicatePage(id: string): Promise<Page> {
    const page = await firstValueFrom(this.api.duplicatePage(id));
    this._site.update((s) => (s ? { ...s, pages: [...s.pages, page] } : s));
    this.setActivePage(page.id);
    this.markDirty();
    return page;
  }

  async reorderPages(orderedIds: string[]): Promise<void> {
    const siteId = this._site()?.id;
    if (!siteId) return;
    this._site.update((s) =>
      s
        ? {
            ...s,
            pages: orderedIds.map((id, i) => {
              const p = s.pages.find((x) => x.id === id)!;
              return { ...p, order: i };
            }),
          }
        : s,
    );
    this.markDirty();
    try {
      await firstValueFrom(this.api.reorderPages(siteId, orderedIds));
    } catch (err) {
      await this.refresh();
      throw err;
    }
  }

  async setHomePage(id: string): Promise<void> {
    const s = this._site();
    if (!s) return;
    const toUnset = s.pages.filter((p) => p.isHome && p.id !== id);
    await firstValueFrom(this.api.updatePage(id, { isHome: true }));
    for (const p of toUnset) {
      await firstValueFrom(this.api.updatePage(p.id, { isHome: false }));
    }
    this._site.update((st) =>
      st
        ? { ...st, pages: st.pages.map((p) => ({ ...p, isHome: p.id === id })) }
        : st,
    );
    this.markDirty();
  }

  // --- Sections ---
  /**
   * Add a section to the active page. Starts with a professional bilingual
   * sample heading (not the palette label). When `index` is provided the new
   * section is inserted at that position (order persisted); otherwise appended.
   */
  async addSection(
    type: SectionType,
    index?: number,
  ): Promise<Section | null> {
    const page = this.activePage();
    if (!page) return null;
    const meta = sectionMeta(type);
    const dto: CreateSectionDto = {
      type,
      title: defaultSectionTitle(type),
      subtitle: {},
      content: meta.defaultContent(),
      settings: { background: 'none', paddingY: 'lg', align: 'center' },
      showInNav: true,
      // Anchor is auto-generated server-side (managed behind the scenes).
    };
    const orderedBefore = [...page.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id);
    const created = await firstValueFrom(this.api.createSection(page.id, dto));
    this.patchPage(page.id, (p) => ({
      ...p,
      sections: [...p.sections, created],
    }));
    this.markDirty();
    // Insert at a specific position by persisting a reordered id list.
    if (index !== undefined && index < orderedBefore.length) {
      const ids = [...orderedBefore];
      ids.splice(Math.max(0, index), 0, created.id);
      await this.applyReorderSections(page.id, ids);
    }
    return created;
  }

  /** Duplicate a section in place (appended), with fresh inner item ids. */
  async duplicateSection(id: string): Promise<Section | null> {
    const page = this.activePage();
    if (!page) return null;
    const created = await firstValueFrom(this.api.duplicateSection(id));
    this.patchPage(page.id, (p) => ({
      ...p,
      sections: [...p.sections, created],
    }));
    this.markDirty();
    return created;
  }

  /** Public update: records an undo entry capturing the section's prior state. */
  async updateSection(id: string, dto: UpdateSectionDto): Promise<void> {
    const prev = this.sectionDtoSnapshot(id);
    await this.applyUpdateSection(id, dto);
    if (prev) {
      this.record({
        undo: () => this.applyUpdateSection(id, prev),
        redo: () => this.applyUpdateSection(id, dto),
      });
    }
  }

  async deleteSection(id: string): Promise<void> {
    await firstValueFrom(this.api.deleteSection(id));
    const page = this.activePage();
    if (page) {
      this.patchPage(page.id, (p) => ({
        ...p,
        sections: p.sections.filter((s) => s.id !== id),
      }));
    }
    this.markDirty();
  }

  /** Public reorder: records an undo entry capturing the prior order. */
  async reorderSections(orderedIds: string[]): Promise<void> {
    const page = this.activePage();
    if (!page) return;
    const prevIds = [...page.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id);
    await this.applyReorderSections(page.id, orderedIds);
    this.record({
      undo: () => this.applyReorderSections(page.id, prevIds),
      redo: () => this.applyReorderSections(page.id, orderedIds),
    });
  }

  // --- Undo / redo ---
  async undo(): Promise<void> {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    await cmd.undo();
    this.redoStack.push(cmd);
    this.syncDepths();
    this.markDirty();
  }

  async redo(): Promise<void> {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    await cmd.redo();
    this.undoStack.push(cmd);
    this.syncDepths();
    this.markDirty();
  }

  // --- low-level (no history) ---
  private async applyUpdateSection(
    id: string,
    dto: UpdateSectionDto,
  ): Promise<void> {
    const updated = await firstValueFrom(this.api.updateSection(id, dto));
    const page = this.activePage();
    if (page) {
      this.patchPage(page.id, (p) => ({
        ...p,
        sections: p.sections.map((s) => (s.id === id ? updated : s)),
      }));
    }
    this.markDirty();
  }

  private async applyReorderSections(
    pageId: string,
    orderedIds: string[],
  ): Promise<void> {
    this.patchPage(pageId, (p) => ({
      ...p,
      sections: orderedIds.map((id, i) => {
        const sec = p.sections.find((s) => s.id === id)!;
        return { ...sec, order: i };
      }),
    }));
    this.markDirty();
    try {
      await firstValueFrom(this.api.reorderSections(pageId, orderedIds));
    } catch (err) {
      await this.refresh();
      throw err;
    }
  }

  // --- helpers ---
  private sectionDtoSnapshot(id: string): UpdateSectionDto | null {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return null;
    return {
      title: structuredClone(sec.title),
      subtitle: structuredClone(sec.subtitle),
      anchor: sec.anchor,
      showInNav: sec.showInNav,
      content: structuredClone(sec.content),
      settings: structuredClone(sec.settings),
    };
  }

  private record(cmd: HistoryCommand): void {
    this.undoStack.push(cmd);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    this.syncDepths();
  }

  private clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.syncDepths();
  }

  private syncDepths(): void {
    this.undoDepth.set(this.undoStack.length);
    this.redoDepth.set(this.redoStack.length);
  }

  private patchPage(pageId: string, updater: (p: Page) => Page): void {
    this._site.update((s) =>
      s
        ? { ...s, pages: s.pages.map((p) => (p.id === pageId ? updater(p) : p)) }
        : s,
    );
  }
}
