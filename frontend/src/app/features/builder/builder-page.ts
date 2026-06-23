import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { SiteStore } from '../../core/site-store';
import { ApiService } from '../../core/api.service';
import { ThemeService } from '../../shared/theme.service';
import { AdminI18n } from '../../core/admin-i18n';
import {
  SECTION_TYPES,
  groupLabel,
  sectionDescription,
  sectionLabel,
  sectionMeta,
} from '../../core/section-registry';
import { resolveText } from '../../core/i18n';
import { Section } from '../../core/models';
import { SectionRenderer } from '../public-site/section-renderer';
import { PagesPanel } from './pages-panel';
import { NavbarManager } from './navbar-manager';
import { FooterManager } from './footer-manager';
import { AdminLangSwitcher } from '../../shared/admin-lang-switcher';

/**
 * The builder workspace for one site: pages + an editable, drag-orderable list of
 * sections on the left and a live preview on the right. Bilingual (EN/AR) and
 * RTL-aware via {@link AdminI18n}.
 */
@Component({
  selector: 'app-builder-page',
  imports: [
    FormsModule,
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    SelectModule,
    ButtonModule,
    TooltipModule,
    SkeletonModule,
    BadgeModule,
    DialogModule,
    SectionRenderer,
    PagesPanel,
    NavbarManager,
    FooterManager,
    AdminLangSwitcher,
  ],
  template: `
    <div [attr.dir]="i18n.dir()">
      @if (store.site(); as site) {
        <!-- Top bar -->
        <header
          class="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-surface-200 bg-white px-4 py-3 sm:px-6"
        >
          <a routerLink="/" class="text-surface-400 hover:text-surface-600">
            <i class="pi pi-arrow-left" [class.rotate-180]="i18n.isAr()"></i>
          </a>
          <h1 class="truncate text-lg font-semibold text-surface-800">
            {{ site.name }}
          </h1>

          <div class="ms-auto flex flex-wrap items-center gap-2">
            <app-admin-lang-switcher />
            @if (store.isBilingual()) {
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500">{{
                  i18n.t('Editing', 'تحرير')
                }}</span>
                <p-select
                  [options]="languageOptions()"
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-36"
                  [ngModel]="store.editLanguage()"
                  (ngModelChange)="store.editLanguage.set($event)"
                />
              </div>
            }

            <!-- Publish status pill -->
            @if (store.dirty()) {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                <i class="pi pi-circle-fill text-[8px]"></i>
                {{ i18n.t('Unpublished changes', 'تغييرات غير منشورة') }}
              </span>
            } @else {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
              >
                <i class="pi pi-check-circle text-[10px]"></i>
                {{ i18n.t('Published', 'منشور') }}
              </span>
            }

            <!-- Undo / redo -->
            <p-button
              icon="pi pi-undo"
              styleClass="undo-flip"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              [disabled]="!store.canUndo()"
              (onClick)="undo()"
              [ariaLabel]="i18n.t('Undo', 'تراجع')"
              [pTooltip]="i18n.t('Undo', 'تراجع')"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-undo"
              styleClass="redo-flip"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              [disabled]="!store.canRedo()"
              (onClick)="redo()"
              [ariaLabel]="i18n.t('Redo', 'إعادة')"
              [pTooltip]="i18n.t('Redo', 'إعادة')"
              tooltipPosition="bottom"
            />

            <!-- Messages link with unread badge -->
            <a
              class="relative inline-flex items-center gap-1 rounded-md border border-surface-200 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              [routerLink]="['/sites', site.id, 'messages']"
            >
              <i class="pi pi-envelope text-xs"></i>
              <span class="hidden sm:inline">{{
                i18n.t('Messages', 'الرسائل')
              }}</span>
              @if (unreadCount() > 0) {
                <p-badge
                  [value]="unreadCount()"
                  severity="danger"
                  styleClass="ms-1"
                />
              }
            </a>

            <!-- Publish: the one dominant primary action. -->
            <span
              [pTooltip]="
                store.dirty()
                  ? ''
                  : i18n.t('Everything is published', 'كل شيء منشور')
              "
              tooltipPosition="bottom"
            >
              <p-button
                [label]="i18n.t('Publish', 'نشر')"
                icon="pi pi-cloud-upload"
                [loading]="store.publishing()"
                [disabled]="!store.dirty()"
                (onClick)="onPublish()"
              />
            </span>

            <a
              class="inline-flex items-center gap-1 rounded-md border border-surface-200 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              [href]="'/site/' + site.subdomain"
              target="_blank"
              rel="noopener"
            >
              <i class="pi pi-external-link text-xs"></i>
              <span class="hidden sm:inline">{{
                i18n.t('View site', 'عرض الموقع')
              }}</span>
            </a>

            <a
              class="inline-flex items-center gap-1 rounded-md border border-surface-200 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              [routerLink]="['/sites', site.id, 'settings']"
            >
              <i class="pi pi-cog text-xs"></i>
              <span class="hidden sm:inline">{{
                i18n.t('Settings', 'الإعدادات')
              }}</span>
            </a>
          </div>
        </header>

        <div class="grid grid-cols-1 items-start gap-6 p-6 lg:grid-cols-2">
          <!-- Left: editor column -->
          <div class="flex flex-col gap-5">
            <app-pages-panel />
            <app-navbar-manager />
            <app-footer-manager />

            <!-- Add section (opens a friendly picker with descriptions) -->
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-300 bg-white px-4 py-3.5 text-sm font-semibold text-surface-600 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
              [disabled]="adding()"
              (click)="openPicker()"
            >
              <i class="pi pi-plus"></i>
              {{ i18n.t('Add a section', 'إضافة قسم') }}
            </button>

            <!-- Section list (drag-drop) -->
            <div
              cdkDropList
              (cdkDropListDropped)="drop($event)"
              class="flex flex-col gap-3"
            >
              @for (s of store.sections(); track s.id) {
                <div
                  cdkDrag
                  class="flex flex-wrap items-center gap-3 rounded-lg border border-surface-200 bg-white p-3"
                >
                  <i
                    class="pi pi-bars cursor-move text-surface-400"
                    cdkDragHandle
                  ></i>
                  <i [class]="iconFor(s) + ' text-surface-500'"></i>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-surface-800">
                      {{ titleFor(s) }}
                    </div>
                    <div class="text-xs text-surface-400">
                      {{ sectionLabel(s.type, i18n.isAr()) }}
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-1">
                    <!-- Keyboard reorder -->
                    <p-button
                      icon="pi pi-chevron-up"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      [disabled]="$first"
                      (onClick)="moveUp($index)"
                      [ariaLabel]="i18n.t('Move up', 'تحريك لأعلى')"
                    />
                    <p-button
                      icon="pi pi-chevron-down"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      [disabled]="$last"
                      (onClick)="moveDown($index)"
                      [ariaLabel]="i18n.t('Move down', 'تحريك لأسفل')"
                    />
                    <p-button
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      (onClick)="openEditor(s)"
                      [ariaLabel]="i18n.t('Edit section', 'تحرير القسم')"
                    />
                    <p-button
                      icon="pi pi-plus"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      (onClick)="openPicker($index + 1)"
                      [ariaLabel]="i18n.t('Insert section below', 'إدراج قسم بالأسفل')"
                      [pTooltip]="i18n.t('Insert section below', 'إدراج قسم بالأسفل')"
                      tooltipPosition="top"
                    />
                    <p-button
                      icon="pi pi-copy"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      (onClick)="duplicate(s)"
                      [ariaLabel]="i18n.t('Duplicate section', 'تكرار القسم')"
                    />
                    <p-button
                      [icon]="s.showInNav ? 'pi pi-eye' : 'pi pi-eye-slash'"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      (onClick)="toggleNav(s)"
                      [ariaLabel]="i18n.t('Toggle in menu', 'إظهار في القائمة')"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [text]="true"
                      [rounded]="true"
                      severity="danger"
                      (onClick)="remove(s)"
                      [ariaLabel]="i18n.t('Delete section', 'حذف القسم')"
                    />
                  </div>
                </div>
              } @empty {
                <div
                  class="flex flex-col items-center gap-4 rounded-xl border border-dashed border-surface-300 bg-white p-8 text-center"
                >
                  <span
                    class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600"
                  >
                    <i class="pi pi-objects-column text-xl"></i>
                  </span>
                  <div>
                    <h3 class="text-base font-semibold text-surface-800">
                      {{ i18n.t('Let’s build your page', 'لنُنشئ صفحتك') }}
                    </h3>
                    <p class="mt-1 text-sm text-surface-500">
                      {{
                        i18n.t(
                          'Start with a ready layout, or add your first section.',
                          'ابدأ بتخطيط جاهز، أو أضف أول قسم.'
                        )
                      }}
                    </p>
                  </div>
                  <p-button
                    [label]="i18n.t('Apply a starter layout', 'تطبيق تخطيط جاهز')"
                    icon="pi pi-bolt"
                    [loading]="adding()"
                    (onClick)="applyStarterLayout()"
                  />
                  <div class="flex flex-wrap items-center justify-center gap-2">
                    <p-button
                      [label]="i18n.t('Add Hero', 'إضافة بانر')"
                      icon="pi pi-plus"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      [disabled]="adding()"
                      (onClick)="onAdd('hero')"
                    />
                    <p-button
                      [label]="i18n.t('Add Features', 'إضافة مميزات')"
                      icon="pi pi-plus"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      [disabled]="adding()"
                      (onClick)="onAdd('features')"
                    />
                    <p-button
                      [label]="i18n.t('Add Contact', 'إضافة تواصل')"
                      icon="pi pi-plus"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      [disabled]="adding()"
                      (onClick)="onAdd('contact')"
                    />
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right: live preview -->
          <div class="lg:sticky lg:top-20">
            <div class="mb-2 flex items-center justify-between gap-2">
              <div class="text-xs font-semibold uppercase text-surface-500">
                {{ i18n.t('Live preview', 'معاينة مباشرة') }}
              </div>
              <!-- Device preview toggle -->
              <div
                class="flex items-center gap-1"
                role="group"
                [attr.aria-label]="i18n.t('Preview device', 'جهاز المعاينة')"
              >
                <p-button
                  icon="pi pi-mobile"
                  [text]="preview() !== 'mobile'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="preview.set('mobile')"
                  [ariaLabel]="i18n.t('Mobile', 'هاتف')"
                  [pTooltip]="i18n.t('Mobile', 'هاتف')"
                  tooltipPosition="bottom"
                />
                <p-button
                  icon="pi pi-tablet"
                  [text]="preview() !== 'tablet'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="preview.set('tablet')"
                  [ariaLabel]="i18n.t('Tablet', 'لوحي')"
                  [pTooltip]="i18n.t('Tablet', 'لوحي')"
                  tooltipPosition="bottom"
                />
                <p-button
                  icon="pi pi-desktop"
                  [text]="preview() !== 'desktop'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="preview.set('desktop')"
                  [ariaLabel]="i18n.t('Desktop', 'سطح المكتب')"
                  [pTooltip]="i18n.t('Desktop', 'سطح المكتب')"
                  tooltipPosition="bottom"
                />
              </div>
            </div>
            <div
              class="site-font mx-auto overflow-hidden rounded-lg border border-surface-200 bg-white transition-[max-width] duration-300"
              [style.max-width]="previewMaxWidth()"
            >
              @if (preview() === 'desktop') {
                <!-- Desktop: interactive inline preview (click a section to edit). -->
                @for (s of store.sections(); track s.id) {
                  <div
                    role="button"
                    tabindex="0"
                    class="group relative cursor-pointer outline-none transition hover:ring-2 hover:ring-inset hover:ring-primary-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                    [attr.aria-label]="
                      i18n.t('Edit', 'تحرير') + ': ' + titleFor(s)
                    "
                    (click)="openEditor(s)"
                    (keydown.enter)="openEditor(s)"
                  >
                    <span
                      class="pointer-events-none absolute top-2 z-10 inline-flex items-center gap-1 rounded-full bg-surface-900/85 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 ltr:right-2 rtl:left-2"
                    >
                      <i class="pi pi-pencil text-[10px]"></i>
                      {{ i18n.t('Edit', 'تحرير') }}
                    </span>
                    <app-section-renderer
                      [section]="s"
                      [lang]="store.editLanguage()"
                      [index]="$index"
                      [subdomain]="site.subdomain"
                      [socialLinks]="site.socialLinks ?? []"
                    />
                  </div>
                } @empty {
                  <div class="p-10 text-center text-sm text-surface-400">
                    {{
                      i18n.t(
                        'Your page preview will appear here.',
                        'ستظهر معاينة صفحتك هنا.'
                      )
                    }}
                  </div>
                }
              } @else {
                <!-- Mobile/tablet: an iframe so responsive breakpoints are real. -->
                <iframe
                  [src]="previewUrl()"
                  class="block h-[78vh] w-full border-0"
                  [title]="i18n.t('Live preview', 'معاينة مباشرة')"
                ></iframe>
              }
            </div>
          </div>
        </div>

        <!-- Section picker (used for both append and insert-at-position) -->
        <p-dialog
          [(visible)]="pickerOpen"
          [modal]="true"
          [draggable]="false"
          [dismissableMask]="true"
          [style]="{ width: '52rem', maxWidth: '95vw' }"
          [header]="i18n.t('Add a section', 'إضافة قسم')"
          [dir]="i18n.dir()"
        >
          <div class="flex flex-col gap-5 py-1">
            @for (grp of sectionGroups; track grp.group) {
              <div>
                <div
                  class="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-400"
                >
                  {{ groupLabel(grp.group, i18n.isAr()) }}
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  @for (meta of grp.items; track meta.type) {
                    <button
                      type="button"
                      class="flex items-start gap-3 rounded-xl border border-surface-200 p-3 text-start transition hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50"
                      [disabled]="adding()"
                      (click)="chooseSection(meta.type)"
                    >
                      <span
                        class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-600"
                      >
                        <i [class]="meta.icon"></i>
                      </span>
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold text-surface-800">
                          {{ sectionLabel(meta.type, i18n.isAr()) }}
                        </span>
                        <span class="block text-xs leading-snug text-surface-500">
                          {{ sectionDescription(meta.type, i18n.isAr()) }}
                        </span>
                      </span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </p-dialog>
      } @else if (store.loading()) {
        <!-- Skeleton -->
        <div class="p-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="flex flex-col gap-3">
              <p-skeleton height="9rem" />
              <p-skeleton height="11rem" />
              <p-skeleton height="4rem" />
              <p-skeleton height="4rem" />
            </div>
            <p-skeleton height="22rem" />
          </div>
        </div>
      } @else {
        <div class="p-10 text-center text-surface-400">
          {{ i18n.t('Site not found.', 'الموقع غير موجود.') }}
        </div>
      }
    </div>
  `,
})
export class BuilderPage {
  protected readonly store = inject(SiteStore);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly messages = inject(MessageService);
  protected readonly i18n = inject(AdminI18n);

  /** Unread contact-message count for the Messages link badge. */
  protected readonly unreadCount = signal(0);

  /** Active device preview width. */
  protected readonly preview = signal<'mobile' | 'tablet' | 'desktop'>(
    'desktop',
  );

  /** Max-width applied to the live-preview container per device. */
  protected readonly previewMaxWidth = computed(() => {
    switch (this.preview()) {
      case 'mobile':
        return '390px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  });

  private readonly sanitizer = inject(DomSanitizer);
  /** Bumped to force the mobile/tablet preview iframe to reload after edits. */
  private readonly previewRev = signal(0);

  /** URL for the responsive (iframe) preview at the current page + language. */
  protected readonly previewUrl = computed<SafeResourceUrl>(() => {
    const id = this.store.site()?.id ?? '';
    const page = this.store.activePageId() ?? '';
    const lang = this.store.editLanguage();
    const v = this.previewRev();
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `/sites/${id}/preview?page=${page}&lang=${lang}&v=${v}`,
    );
  });

  // Expose registry/i18n helpers to the template.
  protected readonly sectionLabel = sectionLabel;
  protected readonly sectionDescription = sectionDescription;
  protected readonly groupLabel = groupLabel;

  /** Implemented section types, grouped by category for the "Add" palette. */
  protected readonly sectionGroups = (() => {
    const order = ['Headers', 'Content', 'Media', 'Social', 'Contact'] as const;
    const impl = SECTION_TYPES.filter((m) => m.implemented);
    return order
      .map((group) => ({
        group,
        items: impl.filter((m) => m.group === group),
      }))
      .filter((g) => g.items.length);
  })();

  protected readonly adding = signal(false);

  /** Section picker dialog state. `insertIndex` is the target position (null = append). */
  protected readonly pickerOpen = signal(false);
  private insertIndex: number | null = null;

  protected readonly languageOptions = computed(() =>
    this.store.languages().map((l) => ({
      label: l === 'ar' ? 'العربية' : 'English',
      value: l,
    })),
  );

  constructor() {
    effect(() => {
      document.documentElement.dir = this.i18n.dir();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.store.load(id);
      void this.loadUnreadCount(id);
    }

    effect(() => {
      const site = this.store.site();
      if (site) {
        this.theme.apply(site.primaryColor, site.secondaryColor);
        this.theme.applyFont(site.fontFamily);
        this.theme.applyRadius(site.borderRadius);
      }
    });

    // Reload the responsive (iframe) preview whenever the section list changes.
    let firstRun = true;
    effect(() => {
      this.store.sections();
      this.store.editLanguage();
      this.store.activePageId();
      if (firstRun) {
        firstRun = false;
        return;
      }
      this.previewRev.update((v) => v + 1);
    });
  }

  private async loadUnreadCount(siteId: string): Promise<void> {
    try {
      const { count } = await firstValueFrom(this.api.unreadCount(siteId));
      this.unreadCount.set(count);
    } catch {
      /* non-critical; leave the badge hidden */
    }
  }

  protected iconFor(s: Section): string {
    return sectionMeta(s.type).icon;
  }

  protected titleFor(s: Section): string {
    const t = resolveText(s.title, this.store.editLanguage());
    return t || sectionLabel(s.type, this.i18n.isAr());
  }

  /** Open the section picker; `index` inserts at a position (omit to append). */
  protected openPicker(index?: number): void {
    this.insertIndex = index ?? null;
    this.pickerOpen.set(true);
  }

  /** A type was chosen in the picker: add it (at the target index) and edit it. */
  protected async chooseSection(type: Section['type']): Promise<void> {
    this.pickerOpen.set(false);
    await this.onAdd(type, this.insertIndex ?? undefined);
    this.insertIndex = null;
  }

  protected async onAdd(type: Section['type'], index?: number): Promise<void> {
    this.adding.set(true);
    try {
      const created = await this.store.addSection(type, index);
      // Jump straight into the split editor for the new section.
      if (created) this.openEditor(created);
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Could not add section', 'تعذّرت إضافة القسم'),
      });
    } finally {
      this.adding.set(false);
    }
  }

  /** One-click starter layout for an empty page (hero → features → cta → contact). */
  protected async applyStarterLayout(): Promise<void> {
    if (this.adding()) return;
    this.adding.set(true);
    try {
      for (const type of ['hero', 'features', 'cta', 'contact'] as const) {
        await this.store.addSection(type);
      }
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Starter layout added', 'تمت إضافة التخطيط الجاهز'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Could not add sections', 'تعذّرت إضافة الأقسام'),
      });
    } finally {
      this.adding.set(false);
    }
  }

  protected openEditor(s: Section): void {
    const siteId = this.store.site()?.id;
    if (!siteId) return;
    void this.router.navigate(['/sites', siteId, 'sections', s.id, 'edit']);
  }

  protected async toggleNav(s: Section): Promise<void> {
    try {
      await this.store.updateSection(s.id, { showInNav: !s.showInNav });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Update failed', 'فشل التحديث'),
      });
    }
  }

  protected async remove(s: Section): Promise<void> {
    const label = this.titleFor(s);
    const msg = this.i18n.t(
      `Delete the "${label}" section? This cannot be undone.`,
      `حذف قسم "${label}"؟ لا يمكن التراجع عن ذلك.`,
    );
    if (!confirm(msg)) return;
    try {
      await this.store.deleteSection(s.id);
      this.messages.add({
        severity: 'info',
        summary: this.i18n.t('Section deleted', 'تم حذف القسم'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Delete failed', 'فشل الحذف'),
      });
    }
  }

  protected drop(e: CdkDragDrop<Section[]>): void {
    const ids = this.store.sections().map((s) => s.id);
    moveItemInArray(ids, e.previousIndex, e.currentIndex);
    void this.store
      .reorderSections(ids)
      .catch(() =>
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Reorder failed', 'فشلت إعادة الترتيب'),
        }),
      );
  }

  /** Keyboard reorder: move the section at index one slot earlier. */
  protected moveUp(index: number): void {
    if (index <= 0) return;
    this.reorderBySwap(index, index - 1);
  }

  /** Keyboard reorder: move the section at index one slot later. */
  protected moveDown(index: number): void {
    const ids = this.store.sections().map((s) => s.id);
    if (index >= ids.length - 1) return;
    this.reorderBySwap(index, index + 1);
  }

  private reorderBySwap(from: number, to: number): void {
    const ids = this.store.sections().map((s) => s.id);
    moveItemInArray(ids, from, to);
    void this.store
      .reorderSections(ids)
      .catch(() =>
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Reorder failed', 'فشلت إعادة الترتيب'),
        }),
      );
  }

  /** Duplicate a section (appended) and toast on success. */
  protected async duplicate(s: Section): Promise<void> {
    try {
      await this.store.duplicateSection(s.id);
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Section duplicated', 'تم تكرار القسم'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Duplicate failed', 'فشل التكرار'),
      });
    }
  }

  protected async onPublish(): Promise<void> {
    try {
      await this.store.publish();
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Published', 'تم النشر'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Publish failed', 'فشل النشر'),
      });
    }
  }

  protected async undo(): Promise<void> {
    try {
      await this.store.undo();
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Undo failed', 'فشل التراجع'),
      });
    }
  }

  protected async redo(): Promise<void> {
    try {
      await this.store.redo();
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Redo failed', 'فشلت الإعادة'),
      });
    }
  }

}
