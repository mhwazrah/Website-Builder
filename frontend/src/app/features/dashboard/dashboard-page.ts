import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';

import { ApiService } from '../../core/api.service';
import { AdminI18n } from '../../core/admin-i18n';
import { resolveText } from '../../core/i18n';
import {
  CreateSiteDto,
  Language,
  LanguageMode,
  Site,
  Template,
} from '../../core/models';
import { AdminLangSwitcher } from '../../shared/admin-lang-switcher';

/**
 * Dashboard: lists the user’s sites and creates new ones. Bilingual (EN/AR) and
 * RTL-aware; shows skeleton cards while the list loads.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    AdminLangSwitcher,
  ],
  template: `
    <div [attr.dir]="i18n.dir()">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-white/80 px-6 py-4 backdrop-blur"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-900 text-white"
          >
            <i class="pi pi-bolt text-sm"></i>
          </span>
          <span class="text-lg font-semibold tracking-tight text-surface-900">
            {{ i18n.t('Site Builder', 'منشئ المواقع') }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <app-admin-lang-switcher />
          <p-button
            [label]="i18n.t('New site', 'موقع جديد')"
            icon="pi pi-plus"
            (onClick)="openDialog()"
          />
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 py-8">
        <div class="mb-6">
          <h1 class="text-2xl font-bold tracking-tight text-surface-900">
            {{ i18n.t('Your sites', 'مواقعك') }}
          </h1>
          <p class="mt-1 text-sm text-surface-500">
            {{
              i18n.t(
                'Manage, edit and publish the websites you have built.',
                'أدر وحرّر وانشر المواقع التي أنشأتها.'
              )
            }}
          </p>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="rounded-2xl border border-surface-200 bg-white p-5">
                <p-skeleton width="60%" height="1.25rem" styleClass="mb-2" />
                <p-skeleton width="40%" height="0.9rem" styleClass="mb-5" />
                <p-skeleton height="2rem" />
              </div>
            }
          </div>
        } @else if (sites().length === 0) {
          <div
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-6 py-16 text-center"
          >
            <span
              class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-200 text-surface-500"
            >
              <i class="pi pi-globe text-2xl"></i>
            </span>
            <h2 class="text-lg font-semibold text-surface-900">
              {{ i18n.t('No sites yet', 'لا توجد مواقع بعد') }}
            </h2>
            <p class="mt-1 max-w-sm text-sm text-surface-500">
              {{
                i18n.t(
                  'Create your first website to get started. It only takes a few seconds.',
                  'أنشئ موقعك الأول للبدء. لن يستغرق سوى ثوانٍ.'
                )
              }}
            </p>
            <div class="mt-6">
              <p-button
                [label]="i18n.t('Create your first site', 'أنشئ موقعك الأول')"
                icon="pi pi-plus"
                (onClick)="openDialog()"
              />
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (site of sites(); track site.id) {
              <div
                class="flex flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3
                      class="truncate text-base font-semibold text-surface-900"
                      [title]="site.name"
                    >
                      {{ site.name }}
                    </h3>
                    <p class="mt-0.5 truncate text-sm text-surface-500" dir="ltr">
                      /site/{{ site.subdomain }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600"
                  >
                    {{ languageLabel(site.languageMode) }}
                  </span>
                </div>

                <div class="mt-2 flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 text-xs font-medium"
                    [class.text-emerald-600]="site.published"
                    [class.text-surface-400]="!site.published"
                  >
                    <i
                      class="pi"
                      [class.pi-check-circle]="site.published"
                      [class.pi-circle]="!site.published"
                    ></i>
                    {{
                      site.published
                        ? i18n.t('Published', 'منشور')
                        : i18n.t('Draft', 'مسودة')
                    }}
                  </span>
                </div>

                <div class="mt-5 flex flex-wrap items-center gap-2">
                  <a
                    [routerLink]="['/sites', site.id, 'builder']"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-surface-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-surface-700"
                  >
                    <i class="pi pi-pencil text-xs"></i>
                    {{ i18n.t('Builder', 'المحرّر') }}
                  </a>
                  <a
                    [routerLink]="['/sites', site.id, 'settings']"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition hover:bg-surface-50"
                  >
                    <i class="pi pi-cog text-xs"></i>
                    {{ i18n.t('Settings', 'الإعدادات') }}
                  </a>
                  <a
                    [href]="'/site/' + site.subdomain"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition hover:bg-surface-50"
                  >
                    <i class="pi pi-external-link text-xs"></i>
                    {{ i18n.t('View', 'عرض') }}
                  </a>
                  <button
                    type="button"
                    (click)="remove(site)"
                    class="ms-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <i class="pi pi-trash text-xs"></i>
                    {{ i18n.t('Delete', 'حذف') }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Create dialog -->
      <p-dialog
        [header]="i18n.t('Create a new site', 'إنشاء موقع جديد')"
        [(visible)]="dialogOpen"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '32rem' }"
        [breakpoints]="{ '640px': '95vw' }"
      >
        <div class="flex flex-col gap-5 pt-1">
          <div class="flex flex-col gap-1.5">
            <label for="site-name" class="text-sm font-medium text-surface-700">
              {{ i18n.t('Site name', 'اسم الموقع') }}
            </label>
            <input
              id="site-name"
              pInputText
              class="w-full"
              [(ngModel)]="formName"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              for="site-subdomain"
              class="text-sm font-medium text-surface-700"
            >
              {{ i18n.t('Subdomain', 'النطاق الفرعي') }}
            </label>
            <input
              id="site-subdomain"
              pInputText
              class="w-full"
              dir="ltr"
              placeholder="my-business"
              [(ngModel)]="formSubdomain"
            />
            <small class="text-xs text-surface-500">
              {{
                i18n.t(
                  'Lowercase letters, digits, “-” and “.” only. Your site will live at /site/' +
                    (formSubdomain || 'subdomain'),
                  'أحرف صغيرة وأرقام و«-» و«.» فقط. سيكون موقعك على /site/' +
                    (formSubdomain || 'subdomain')
                )
              }}
            </small>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-surface-700">{{
              i18n.t('Languages', 'اللغات')
            }}</label>
            <p-select
              [options]="languageModeOptions()"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="formLanguageMode"
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700">
              {{ i18n.t('Start from a template', 'ابدأ من قالب') }}
            </label>
            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              @for (tpl of orderedTemplates(); track tpl.id) {
                <button
                  type="button"
                  (click)="formTemplateId.set(tpl.id)"
                  [attr.aria-pressed]="formTemplateId() === tpl.id"
                  class="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition"
                  [class.border-surface-900]="formTemplateId() === tpl.id"
                  [class.bg-surface-50]="formTemplateId() === tpl.id"
                  [class.ring-1]="formTemplateId() === tpl.id"
                  [class.ring-surface-900]="formTemplateId() === tpl.id"
                  [class.border-surface-200]="formTemplateId() !== tpl.id"
                  [class.hover:border-surface-300]="formTemplateId() !== tpl.id"
                  [class.hover:bg-surface-50]="formTemplateId() !== tpl.id"
                >
                  <span
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-surface-700"
                  >
                    <i class="pi text-base" [class]="tpl.icon"></i>
                  </span>
                  <span class="text-sm font-medium text-surface-900">
                    {{ templateName(tpl) }}
                  </span>
                  <span class="text-xs leading-snug text-surface-500">
                    {{ templateDescription(tpl) }}
                  </span>
                </button>
              }
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button
            [label]="i18n.t('Cancel', 'إلغاء')"
            [text]="true"
            severity="secondary"
            (onClick)="dialogOpen.set(false)"
            [disabled]="creating()"
          />
          <p-button
            [label]="i18n.t('Create site', 'إنشاء الموقع')"
            icon="pi pi-check"
            (onClick)="create()"
            [loading]="creating()"
            [disabled]="!canCreate()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  protected readonly i18n = inject(AdminI18n);

  readonly sites = signal<Site[]>([]);
  readonly loading = signal(true);

  readonly dialogOpen = signal(false);
  readonly creating = signal(false);
  formName = '';
  formSubdomain = '';
  formLanguageMode: LanguageMode = 'en';

  readonly templates = signal<Template[]>([]);
  readonly formTemplateId = signal('business');
  /** Templates for display with Blank pushed to the end. */
  readonly orderedTemplates = computed(() =>
    [...this.templates()].sort(
      (a, b) => (a.id === 'blank' ? 1 : 0) - (b.id === 'blank' ? 1 : 0),
    ),
  );

  readonly languageModeOptions = computed(() => [
    { label: this.i18n.t('English', 'الإنجليزية'), value: 'en' as LanguageMode },
    { label: this.i18n.t('Arabic', 'العربية'), value: 'ar' as LanguageMode },
    { label: this.i18n.t('Both', 'كلاهما'), value: 'both' as LanguageMode },
  ]);

  constructor() {
    effect(() => {
      document.documentElement.dir = this.i18n.dir();
    });

    this.api.listSites().subscribe({
      next: (sites) => {
        this.sites.set(sites);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Failed to load sites', 'فشل تحميل المواقع'),
        });
      },
    });

    this.api.listTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        // Pre-select a real (non-blank) template so a new site is never empty.
        this.formTemplateId.set(this.preferredTemplateId());
      },
      error: () => {
        /* template picker is optional; fall back to the blank default */
      },
    });
  }

  /** The default template selection: the first non-blank template, if any. */
  private preferredTemplateId(): string {
    return this.templates().find((t) => t.id !== 'blank')?.id ?? 'blank';
  }

  templateName(tpl: Template): string {
    return resolveText(tpl.name, this.i18n.lang());
  }

  templateDescription(tpl: Template): string {
    return resolveText(tpl.description, this.i18n.lang());
  }

  languageLabel(mode: LanguageMode): string {
    switch (mode) {
      case 'en':
        return this.i18n.t('English', 'الإنجليزية');
      case 'ar':
        return this.i18n.t('Arabic', 'العربية');
      case 'both':
        return this.i18n.t('English + Arabic', 'إنجليزي + عربي');
      default:
        return mode;
    }
  }

  openDialog(): void {
    this.formName = '';
    this.formSubdomain = '';
    this.formLanguageMode = 'en';
    this.formTemplateId.set(this.preferredTemplateId());
    this.dialogOpen.set(true);
  }

  canCreate(): boolean {
    return (
      this.formName.trim().length >= 2 &&
      this.formSubdomain.trim().length >= 2 &&
      !this.creating()
    );
  }

  private defaultLanguageFor(mode: LanguageMode): Language {
    return mode === 'ar' ? 'ar' : 'en';
  }

  create(): void {
    if (!this.canCreate()) return;
    this.creating.set(true);
    const dto: CreateSiteDto = {
      name: this.formName.trim(),
      subdomain: this.formSubdomain.trim().toLowerCase(),
      languageMode: this.formLanguageMode,
      defaultLanguage: this.defaultLanguageFor(this.formLanguageMode),
      templateId: this.formTemplateId(),
    };
    this.api.createSite(dto).subscribe({
      next: (site) => {
        this.sites.update((list) => [...list, site]);
        this.creating.set(false);
        this.dialogOpen.set(false);
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('Site created', 'تم إنشاء الموقع'),
        });
        this.router.navigate(['/sites', site.id, 'builder']);
      },
      error: (err) => {
        this.creating.set(false);
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Could not create site', 'تعذّر إنشاء الموقع'),
          detail:
            err?.error?.message ??
            this.i18n.t(
              'The subdomain may already be taken.',
              'قد يكون النطاق الفرعي مستخدماً بالفعل.',
            ),
        });
      },
    });
  }

  remove(site: Site): void {
    const ok = window.confirm(
      this.i18n.t(
        `Delete "${site.name}"? This permanently removes the site and all its pages.`,
        `حذف "${site.name}"؟ سيؤدي ذلك إلى إزالة الموقع وكل صفحاته نهائياً.`,
      ),
    );
    if (!ok) return;
    this.api.deleteSite(site.id).subscribe({
      next: () => {
        this.sites.update((list) => list.filter((s) => s.id !== site.id));
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('Site deleted', 'تم حذف الموقع'),
        });
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Delete failed', 'فشل الحذف'),
        }),
    });
  }
}
