import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { SiteStore } from '../../core/site-store';
import { AdminI18n } from '../../core/admin-i18n';
import { resolveText } from '../../core/i18n';
import {
  LocalizedText,
  NavItem,
  Page,
  Section,
} from '../../core/models';
import { LocalizedTextInputComponent } from '../../shared/localized-text-input';

type NavItemType = NavItem['type'];

/** A page option for the target picker. */
interface PageOption {
  value: string;
  label: string;
}
/** A section option for the target picker (label may be page-prefixed). */
interface SectionOption {
  value: string;
  label: string;
}

/**
 * Builder panel for editing the site navbar. Keeps a local editable copy of
 * {@link SiteStore.navItems} (seeded via an effect) and persists every change
 * through {@link SiteStore.saveNavItems}. Supports reorderable items, inline
 * editing of type/label/target, dropdowns with one level of children, an
 * "Add item" action, and an "Auto-fill from pages" action. Bilingual (EN/AR)
 * via {@link AdminI18n} and {@link resolveText}.
 */
@Component({
  selector: 'app-navbar-manager',
  imports: [
    FormsModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    TooltipModule,
    LocalizedTextInputComponent,
  ],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-gray-600">
          {{ i18n.t('Navbar', 'شريط التنقل') }}
        </h2>
        <div class="flex flex-wrap items-center gap-1">
          <p-button
            [label]="i18n.t('Auto-fill from pages', 'تعبئة تلقائية من الصفحات')"
            icon="pi pi-bolt"
            size="small"
            [text]="true"
            severity="secondary"
            (onClick)="autoFill()"
            [pTooltip]="
              i18n.t(
                'Replace items with one link per page',
                'استبدال العناصر برابط واحد لكل صفحة'
              )
            "
          />
          <p-button
            [label]="i18n.t('Add item', 'إضافة عنصر')"
            icon="pi pi-plus"
            size="small"
            [text]="true"
            (onClick)="addItem()"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        @for (item of items(); track item.id; let i = $index) {
          <div class="rounded-md border border-gray-200">
            <!-- Row header -->
            <div class="flex items-center gap-2 px-2 py-2">
              <i class="pi pi-bars text-gray-300"></i>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm text-gray-800">
                  {{ labelOf(item) }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ typeLabel(item.type) }}
                </div>
              </div>
              <div class="flex items-center gap-0.5">
                <p-button
                  icon="pi pi-chevron-up"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  [disabled]="$first"
                  (onClick)="move(i, -1)"
                  [ariaLabel]="i18n.t('Move up', 'تحريك لأعلى')"
                />
                <p-button
                  icon="pi pi-chevron-down"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  [disabled]="$last"
                  (onClick)="move(i, 1)"
                  [ariaLabel]="i18n.t('Move down', 'تحريك لأسفل')"
                />
                <p-button
                  [icon]="expandedId() === item.id ? 'pi pi-chevron-up' : 'pi pi-pencil'"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="toggleExpand(item.id)"
                  [ariaLabel]="i18n.t('Edit item', 'تحرير العنصر')"
                />
                <p-button
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="danger"
                  (onClick)="removeItem(i)"
                  [ariaLabel]="i18n.t('Remove item', 'حذف العنصر')"
                />
              </div>
            </div>

            <!-- Inline editor -->
            @if (expandedId() === item.id) {
              <div class="flex flex-col gap-3 border-t border-gray-100 px-3 py-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-600">
                    {{ i18n.t('Type', 'النوع') }}
                  </label>
                  <p-select
                    [options]="typeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full"
                    [ngModel]="item.type"
                    (ngModelChange)="setType(i, $event)"
                  />
                </div>

                <app-localized-text-input
                  [label]="i18n.t('Label', 'التسمية')"
                  [languages]="store.languages()"
                  [placeholder]="derivedLabel(item)"
                  [value]="item.label"
                  (valueChange)="setLabel(i, $event)"
                />

                @switch (item.type) {
                  @case ('page') {
                    <div>
                      <label class="mb-1 block text-xs font-medium text-gray-600">
                        {{ i18n.t('Page', 'الصفحة') }}
                      </label>
                      <p-select
                        [options]="pageOptions()"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full"
                        [placeholder]="i18n.t('Select a page', 'اختر صفحة')"
                        [ngModel]="item.pageId ?? null"
                        (ngModelChange)="setPage(i, $event)"
                      />
                    </div>
                  }
                  @case ('section') {
                    <div>
                      <label class="mb-1 block text-xs font-medium text-gray-600">
                        {{ i18n.t('Section', 'القسم') }}
                      </label>
                      <p-select
                        [options]="sectionOptions()"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full"
                        [filter]="true"
                        [placeholder]="i18n.t('Select a section', 'اختر قسماً')"
                        [ngModel]="item.sectionId ?? null"
                        (ngModelChange)="setSection(i, $event)"
                      />
                    </div>
                  }
                  @case ('link') {
                    <div>
                      <label class="mb-1 block text-xs font-medium text-gray-600">
                        {{ i18n.t('URL', 'الرابط') }}
                      </label>
                      <input
                        pInputText
                        class="w-full"
                        [attr.dir]="'ltr'"
                        [placeholder]="'https://example.com'"
                        [ngModel]="item.url ?? ''"
                        (ngModelChange)="setUrl(i, $event)"
                      />
                      <div class="mt-2 flex items-center gap-2">
                        <p-checkbox
                          [binary]="true"
                          [inputId]="'newtab-' + item.id"
                          [ngModel]="item.newTab ?? false"
                          (ngModelChange)="setNewTab(i, $event)"
                        />
                        <label
                          [for]="'newtab-' + item.id"
                          class="text-sm text-gray-700"
                        >
                          {{ i18n.t('Open in a new tab', 'فتح في تبويب جديد') }}
                        </label>
                      </div>
                    </div>
                  }
                  @case ('dropdown') {
                    <div>
                      <div class="mb-1 flex items-center justify-between">
                        <label class="text-xs font-medium text-gray-600">
                          {{ i18n.t('Menu items', 'عناصر القائمة') }}
                        </label>
                        <p-button
                          [label]="i18n.t('Add child', 'إضافة عنصر فرعي')"
                          icon="pi pi-plus"
                          size="small"
                          [text]="true"
                          (onClick)="addChild(i)"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        @for (
                          child of item.children ?? [];
                          track child.id;
                          let ci = $index
                        ) {
                          <div
                            class="flex flex-col gap-2 rounded-md border border-gray-100 bg-gray-50 p-2"
                          >
                            <div class="flex items-center gap-1">
                              <span class="flex-1 truncate text-xs text-gray-600">
                                {{ labelOf(child) }}
                              </span>
                              <p-button
                                icon="pi pi-chevron-up"
                                [text]="true"
                                [rounded]="true"
                                size="small"
                                severity="secondary"
                                [disabled]="ci === 0"
                                (onClick)="moveChild(i, ci, -1)"
                                [ariaLabel]="i18n.t('Move up', 'تحريك لأعلى')"
                              />
                              <p-button
                                icon="pi pi-chevron-down"
                                [text]="true"
                                [rounded]="true"
                                size="small"
                                severity="secondary"
                                [disabled]="ci === (item.children ?? []).length - 1"
                                (onClick)="moveChild(i, ci, 1)"
                                [ariaLabel]="i18n.t('Move down', 'تحريك لأسفل')"
                              />
                              <p-button
                                icon="pi pi-trash"
                                [text]="true"
                                [rounded]="true"
                                size="small"
                                severity="danger"
                                (onClick)="removeChild(i, ci)"
                                [ariaLabel]="i18n.t('Remove', 'حذف')"
                              />
                            </div>

                            <p-select
                              [options]="childTypeOptions()"
                              optionLabel="label"
                              optionValue="value"
                              styleClass="w-full"
                              [ngModel]="child.type"
                              (ngModelChange)="setChildType(i, ci, $event)"
                            />

                            <app-localized-text-input
                              [languages]="store.languages()"
                              [placeholder]="derivedLabel(child)"
                              [value]="child.label"
                              (valueChange)="setChildLabel(i, ci, $event)"
                            />

                            @switch (child.type) {
                              @case ('page') {
                                <p-select
                                  [options]="pageOptions()"
                                  optionLabel="label"
                                  optionValue="value"
                                  styleClass="w-full"
                                  [placeholder]="i18n.t('Select a page', 'اختر صفحة')"
                                  [ngModel]="child.pageId ?? null"
                                  (ngModelChange)="setChildPage(i, ci, $event)"
                                />
                              }
                              @case ('section') {
                                <p-select
                                  [options]="sectionOptions()"
                                  optionLabel="label"
                                  optionValue="value"
                                  styleClass="w-full"
                                  [filter]="true"
                                  [placeholder]="i18n.t('Select a section', 'اختر قسماً')"
                                  [ngModel]="child.sectionId ?? null"
                                  (ngModelChange)="setChildSection(i, ci, $event)"
                                />
                              }
                              @case ('link') {
                                <input
                                  pInputText
                                  class="w-full"
                                  [attr.dir]="'ltr'"
                                  [placeholder]="'https://example.com'"
                                  [ngModel]="child.url ?? ''"
                                  (ngModelChange)="setChildUrl(i, ci, $event)"
                                />
                                <div class="flex items-center gap-2">
                                  <p-checkbox
                                    [binary]="true"
                                    [inputId]="'newtab-' + child.id"
                                    [ngModel]="child.newTab ?? false"
                                    (ngModelChange)="setChildNewTab(i, ci, $event)"
                                  />
                                  <label
                                    [for]="'newtab-' + child.id"
                                    class="text-xs text-gray-700"
                                  >
                                    {{
                                      i18n.t('Open in a new tab', 'فتح في تبويب جديد')
                                    }}
                                  </label>
                                </div>
                              }
                            }
                          </div>
                        } @empty {
                          <div
                            class="rounded-md border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400"
                          >
                            {{
                              i18n.t(
                                'No menu items yet.',
                                'لا توجد عناصر بعد.'
                              )
                            }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            }
          </div>
        } @empty {
          <div
            class="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400"
          >
            {{
              i18n.t(
                'No navbar items yet. Add one or auto-fill from your pages.',
                'لا توجد عناصر تنقل بعد. أضف عنصراً أو عبّئ تلقائياً من صفحاتك.'
              )
            }}
          </div>
        }
      </div>
    </div>
  `,
})
export class NavbarManager {
  protected readonly store = inject(SiteStore);
  protected readonly i18n = inject(AdminI18n);
  private readonly messages = inject(MessageService);

  /** Local editable copy of the navbar; seeded from the store via an effect. */
  protected readonly items = signal<NavItem[]>([]);
  protected readonly expandedId = signal<string | null>(null);

  /** Guards the seeding effect from clobbering local edits we just saved. */
  private suppressSeed = false;

  protected readonly typeOptions = computed(() => [
    { value: 'page' as NavItemType, label: this.i18n.t('Page', 'صفحة') },
    { value: 'section' as NavItemType, label: this.i18n.t('Section', 'قسم') },
    {
      value: 'dropdown' as NavItemType,
      label: this.i18n.t('Dropdown', 'قائمة منسدلة'),
    },
    { value: 'link' as NavItemType, label: this.i18n.t('Link', 'رابط') },
  ]);

  /** Child items go one level deep: no nested dropdowns. */
  protected readonly childTypeOptions = computed(() =>
    this.typeOptions().filter((o) => o.value !== 'dropdown'),
  );

  protected readonly pageOptions = computed<PageOption[]>(() =>
    this.store.pages().map((p) => ({
      value: p.id,
      label: this.pageTitle(p),
    })),
  );

  protected readonly sectionOptions = computed<SectionOption[]>(() => {
    const pages = this.store.pages();
    return this.store.allSections().map((s) => {
      const page = pages.find((p) => p.id === s.pageId);
      const base = this.sectionTitle(s);
      const prefix = page ? this.pageTitle(page) + ' / ' : '';
      return { value: s.id, label: prefix + base };
    });
  });

  constructor() {
    // Seed the editable copy whenever the stored navbar changes (initial load
    // and external updates), unless the change came from our own save.
    effect(() => {
      const stored = this.store.navItems();
      if (this.suppressSeed) {
        this.suppressSeed = false;
        return;
      }
      this.items.set(stored.map((it) => this.cloneItem(it)));
    });
  }

  // --- display helpers ---
  private pageTitle(p: Page): string {
    return resolveText(p.title, this.store.editLanguage()) || p.slug;
  }

  private sectionTitle(s: Section): string {
    return resolveText(s.title, this.store.editLanguage()) || s.type;
  }

  /** A sensible fallback label derived from the item target. */
  protected derivedLabel(item: NavItem): string {
    switch (item.type) {
      case 'page': {
        const p = this.store.pages().find((x) => x.id === item.pageId);
        return p ? this.pageTitle(p) : this.i18n.t('Page', 'صفحة');
      }
      case 'section': {
        const s = this.store.allSections().find((x) => x.id === item.sectionId);
        return s ? this.sectionTitle(s) : this.i18n.t('Section', 'قسم');
      }
      case 'link':
        return item.url || this.i18n.t('Link', 'رابط');
      case 'dropdown':
        return this.i18n.t('Menu', 'قائمة');
      default:
        return '';
    }
  }

  /** The resolved label, falling back to the derived one. */
  protected labelOf(item: NavItem): string {
    return resolveText(item.label, this.store.editLanguage()) || this.derivedLabel(item);
  }

  protected typeLabel(type: NavItemType): string {
    return this.typeOptions().find((o) => o.value === type)?.label ?? type;
  }

  protected toggleExpand(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  // --- mutations (each persists) ---
  protected addItem(): void {
    const item: NavItem = {
      id: crypto.randomUUID(),
      type: 'page',
      label: {},
    };
    const next = [...this.items(), item];
    this.expandedId.set(item.id);
    this.commit(next);
  }

  protected removeItem(index: number): void {
    const next = this.items().filter((_, i) => i !== index);
    this.commit(next);
  }

  protected move(index: number, delta: number): void {
    const next = [...this.items()];
    const to = index + delta;
    if (to < 0 || to >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    this.commit(next);
  }

  protected autoFill(): void {
    const next: NavItem[] = this.store.pages().map((p) => ({
      id: crypto.randomUUID(),
      type: 'page',
      label: {},
      pageId: p.id,
    }));
    this.expandedId.set(null);
    this.commit(next);
    this.messages.add({
      severity: 'success',
      summary: this.i18n.t('Navbar updated', 'تم تحديث شريط التنقل'),
    });
  }

  protected setType(index: number, type: NavItemType): void {
    this.patch(index, (it) => {
      // Reset target fields not relevant to the new type.
      const base: NavItem = { id: it.id, type, label: it.label };
      if (type === 'dropdown') base.children = it.children ?? [];
      if (type === 'link') base.newTab = it.newTab ?? false;
      return base;
    });
  }

  protected setLabel(index: number, label: LocalizedText): void {
    this.patch(index, (it) => ({ ...it, label }));
  }

  protected setPage(index: number, pageId: string): void {
    this.patch(index, (it) => ({ ...it, pageId }));
  }

  protected setSection(index: number, sectionId: string): void {
    this.patch(index, (it) => ({ ...it, sectionId }));
  }

  protected setUrl(index: number, url: string): void {
    this.patch(index, (it) => ({ ...it, url }));
  }

  protected setNewTab(index: number, newTab: boolean): void {
    this.patch(index, (it) => ({ ...it, newTab }));
  }

  // --- child mutations ---
  protected addChild(index: number): void {
    this.patch(index, (it) => ({
      ...it,
      children: [
        ...(it.children ?? []),
        { id: crypto.randomUUID(), type: 'page', label: {} },
      ],
    }));
  }

  protected removeChild(index: number, childIndex: number): void {
    this.patch(index, (it) => ({
      ...it,
      children: (it.children ?? []).filter((_, i) => i !== childIndex),
    }));
  }

  protected moveChild(index: number, childIndex: number, delta: number): void {
    this.patch(index, (it) => {
      const children = [...(it.children ?? [])];
      const to = childIndex + delta;
      if (to < 0 || to >= children.length) return it;
      const [moved] = children.splice(childIndex, 1);
      children.splice(to, 0, moved);
      return { ...it, children };
    });
  }

  protected setChildType(
    index: number,
    childIndex: number,
    type: NavItemType,
  ): void {
    this.patchChild(index, childIndex, (c) => {
      const base: NavItem = { id: c.id, type, label: c.label };
      if (type === 'link') base.newTab = c.newTab ?? false;
      return base;
    });
  }

  protected setChildLabel(
    index: number,
    childIndex: number,
    label: LocalizedText,
  ): void {
    this.patchChild(index, childIndex, (c) => ({ ...c, label }));
  }

  protected setChildPage(
    index: number,
    childIndex: number,
    pageId: string,
  ): void {
    this.patchChild(index, childIndex, (c) => ({ ...c, pageId }));
  }

  protected setChildSection(
    index: number,
    childIndex: number,
    sectionId: string,
  ): void {
    this.patchChild(index, childIndex, (c) => ({ ...c, sectionId }));
  }

  protected setChildUrl(index: number, childIndex: number, url: string): void {
    this.patchChild(index, childIndex, (c) => ({ ...c, url }));
  }

  protected setChildNewTab(
    index: number,
    childIndex: number,
    newTab: boolean,
  ): void {
    this.patchChild(index, childIndex, (c) => ({ ...c, newTab }));
  }

  // --- internals ---
  private patch(index: number, updater: (it: NavItem) => NavItem): void {
    const next = this.items().map((it, i) => (i === index ? updater(it) : it));
    this.commit(next);
  }

  private patchChild(
    index: number,
    childIndex: number,
    updater: (c: NavItem) => NavItem,
  ): void {
    this.patch(index, (it) => ({
      ...it,
      children: (it.children ?? []).map((c, i) =>
        i === childIndex ? updater(c) : c,
      ),
    }));
  }

  /** Update local state and persist to the store. */
  private commit(next: NavItem[]): void {
    this.items.set(next);
    this.suppressSeed = true;
    void this.store
      .saveNavItems(next.map((it) => this.cloneItem(it)))
      .catch(() => {
        this.suppressSeed = false;
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Save failed', 'فشل الحفظ'),
        });
      });
  }

  private cloneItem(it: NavItem): NavItem {
    return {
      ...it,
      label: { ...it.label },
      children: it.children?.map((c) => ({ ...c, label: { ...c.label } })),
    };
  }
}
