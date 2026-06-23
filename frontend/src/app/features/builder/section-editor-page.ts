import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { SiteStore } from '../../core/site-store';
import { ThemeService } from '../../shared/theme.service';
import { AdminI18n } from '../../core/admin-i18n';
import { sectionLabel } from '../../core/section-registry';
import { Section } from '../../core/models';
import { SectionRenderer } from '../public-site/section-renderer';
import { AdminLangSwitcher } from '../../shared/admin-lang-switcher';
import { SectionForm, SectionDraft } from './section-form';

type Device = 'mobile' | 'tablet' | 'desktop';

/**
 * Full-page section editor mounted at
 * `/sites/:id/sections/:sectionId/edit`. Split layout: the editing form on one
 * side and a live device preview on the other that updates as the user types.
 * Replaces the old modal editor. Bilingual + RTL via {@link AdminI18n}.
 */
@Component({
  selector: 'app-section-editor-page',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    SkeletonModule,
    TooltipModule,
    NgScrollbarModule,
    SectionRenderer,
    AdminLangSwitcher,
    SectionForm,
  ],
  template: `
    <div [attr.dir]="i18n.dir()" class="flex min-h-screen flex-col bg-white lg:h-screen">
      @if (section(); as sec) {
        <!-- Top bar -->
        <header
          class="flex flex-wrap items-center gap-3 border-b border-surface-200 bg-white px-4 py-3 sm:px-5"
        >
          <button
            type="button"
            class="text-surface-400 hover:text-surface-700"
            (click)="back()"
            [attr.aria-label]="i18n.t('Back to builder', 'العودة إلى المُنشئ')"
          >
            <i class="pi pi-arrow-left" [class.rotate-180]="i18n.isAr()"></i>
          </button>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold text-surface-800">
              {{ headerTitle(sec) }}
            </div>
            <div class="text-xs text-surface-400">
              {{ sectionLabel(sec.type, i18n.isAr()) }}
            </div>
          </div>

          <div class="ms-auto flex flex-wrap items-center justify-end gap-2">
            <app-admin-lang-switcher />
            @if (store.isBilingual()) {
              <p-select
                [options]="languageOptions()"
                optionLabel="label"
                optionValue="value"
                styleClass="w-28"
                [ngModel]="store.editLanguage()"
                (ngModelChange)="store.editLanguage.set($event)"
              />
            }
            <p-button
              [label]="i18n.t('Cancel', 'إلغاء')"
              [text]="true"
              severity="secondary"
              (onClick)="back()"
            />
            <p-button
              [label]="i18n.t('Save & close', 'حفظ وإغلاق')"
              icon="pi pi-check"
              [loading]="store.saving()"
              (onClick)="save()"
            />
          </div>
        </header>

        <div class="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-2">
          <!-- Form pane -->
          <ng-scrollbar class="lg:h-full lg:border-e lg:border-surface-200" appearance="compact">
            <div class="mx-auto max-w-2xl px-6 py-6">
              <app-section-form
                [section]="sec"
                [languages]="store.languages()"
                (draftChange)="draft.set($event)"
              />
            </div>
          </ng-scrollbar>

          <!-- Live preview pane -->
          <div class="flex flex-col bg-surface-50 lg:min-h-0">
            <div
              class="flex items-center justify-between gap-2 border-b border-surface-200 px-5 py-2.5"
            >
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">
                {{ i18n.t('Live preview', 'معاينة مباشرة') }}
              </span>
              <div
                class="flex items-center gap-1"
                role="group"
                [attr.aria-label]="i18n.t('Preview device', 'جهاز المعاينة')"
              >
                <p-button
                  icon="pi pi-mobile"
                  [text]="device() !== 'mobile'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="device.set('mobile')"
                  [ariaLabel]="i18n.t('Mobile', 'هاتف')"
                  [pTooltip]="i18n.t('Mobile', 'هاتف')"
                />
                <p-button
                  icon="pi pi-tablet"
                  [text]="device() !== 'tablet'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="device.set('tablet')"
                  [ariaLabel]="i18n.t('Tablet', 'لوحي')"
                  [pTooltip]="i18n.t('Tablet', 'لوحي')"
                />
                <p-button
                  icon="pi pi-desktop"
                  [text]="device() !== 'desktop'"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="device.set('desktop')"
                  [ariaLabel]="i18n.t('Desktop', 'سطح المكتب')"
                  [pTooltip]="i18n.t('Desktop', 'سطح المكتب')"
                />
              </div>
            </div>

            <ng-scrollbar class="lg:min-h-0 lg:flex-1" appearance="compact">
              <div class="p-5">
                <div
                  class="site-font mx-auto overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-[max-width] duration-300"
                  [style.max-width]="previewMaxWidth()"
                >
                  <app-section-renderer
                    [section]="previewSection()"
                    [lang]="store.editLanguage()"
                    [subdomain]="store.site()?.subdomain ?? ''"
                    [socialLinks]="store.site()?.socialLinks ?? []"
                  />
                </div>
              </div>
            </ng-scrollbar>
          </div>
        </div>
      } @else if (store.loading()) {
        <!-- Loading skeleton -->
        <div class="grid h-screen grid-cols-1 lg:grid-cols-2">
          <div class="flex flex-col gap-4 border-e border-surface-200 p-6">
            <p-skeleton width="10rem" height="1.5rem" />
            <p-skeleton height="3rem" />
            <p-skeleton height="3rem" />
            <p-skeleton height="8rem" />
            <p-skeleton height="12rem" />
          </div>
          <div class="bg-surface-50 p-6">
            <p-skeleton height="22rem" borderRadius="0.75rem" />
          </div>
        </div>
      } @else {
        <div class="flex h-screen flex-col items-center justify-center gap-3 text-surface-400">
          <i class="pi pi-exclamation-circle text-4xl"></i>
          <p>{{ i18n.t('Section not found.', 'القسم غير موجود.') }}</p>
          <p-button
            [label]="i18n.t('Back to builder', 'العودة إلى المُنشئ')"
            [text]="true"
            (onClick)="back()"
          />
        </div>
      }
    </div>
  `,
})
export class SectionEditorPage {
  protected readonly store = inject(SiteStore);
  protected readonly i18n = inject(AdminI18n);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly messages = inject(MessageService);

  protected readonly sectionLabel = sectionLabel;

  private readonly siteId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly sectionId =
    this.route.snapshot.paramMap.get('sectionId') ?? '';

  /** Live editing buffer emitted by the form (drives the preview). */
  protected readonly draft = signal<SectionDraft | null>(null);

  /** Selected preview device. */
  protected readonly device = signal<Device>('desktop');

  protected readonly section = computed<Section | null>(
    () => this.store.allSections().find((s) => s.id === this.sectionId) ?? null,
  );

  /** The section merged with the live draft, for the preview renderer. */
  protected readonly previewSection = computed<Section>(() => {
    const sec = this.section();
    const d = this.draft();
    if (!sec) return {} as Section;
    if (!d) return sec;
    return {
      ...sec,
      title: d.title,
      subtitle: d.subtitle,
      settings: d.settings,
      content: d.content,
    };
  });

  protected readonly previewMaxWidth = computed(() => {
    switch (this.device()) {
      case 'mobile':
        return '390px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  });

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

    // Load the site if we arrived here directly (e.g. on refresh).
    if (this.store.site()?.id !== this.siteId && this.siteId) {
      void this.store.load(this.siteId);
    }

    // Apply brand theme + focus the owning page once data is available.
    effect(() => {
      const site = this.store.site();
      if (site) {
        this.theme.apply(site.primaryColor, site.secondaryColor);
        this.theme.applyFont(site.fontFamily);
        this.theme.applyRadius(site.borderRadius);
      }
      const sec = this.section();
      if (sec) {
        const owner = this.store
          .pages()
          .find((p) => p.sections.some((s) => s.id === sec.id));
        if (owner && this.store.activePageId() !== owner.id) {
          this.store.setActivePage(owner.id);
        }
      }
    });
  }

  protected headerTitle(sec: Section): string {
    const t = sec.title?.[this.store.editLanguage()] || sec.title?.en;
    return t || sectionLabel(sec.type, this.i18n.isAr());
  }

  protected async save(): Promise<void> {
    const sec = this.section();
    const d = this.draft();
    if (!sec || !d) {
      this.back();
      return;
    }
    try {
      await this.store.updateSection(sec.id, d);
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Section saved', 'تم حفظ القسم'),
      });
      this.back();
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Save failed', 'فشل الحفظ'),
      });
    }
  }

  protected back(): void {
    void this.router.navigate(['/sites', this.siteId, 'builder']);
  }
}
