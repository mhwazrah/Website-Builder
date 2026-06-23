import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { SliderModule } from 'primeng/slider';

import { ApiService } from '../../core/api.service';
import { assetUrl, SERVER_ORIGIN } from '../../core/config';
import { languagesFor } from '../../core/i18n';
import { AdminI18n } from '../../core/admin-i18n';
import { Language, LanguageMode, LocalizedText } from '../../core/models';
import { ARABIC_LATIN_FONTS } from '../../core/fonts';
import { CanComponentDeactivate } from '../../core/unsaved-changes.guard';
import { SiteStore } from '../../core/site-store';
import { ThemeService } from '../../shared/theme.service';
import { LocalizedTextInputComponent } from '../../shared/localized-text-input';
import { ImagePickerComponent } from '../../shared/image-picker';
import { FieldLabel } from '../../shared/field-label';
import { AdminLangSwitcher } from '../../shared/admin-lang-switcher';

type SubdomainState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * Site settings: identity, languages, branding (logos — the favicon is generated
 * automatically), brand colours, SEO and visibility. Fully bilingual (EN/AR) and
 * RTL-aware via {@link AdminI18n}; shows skeletons while the site loads.
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    ColorPickerModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    SliderModule,
    LocalizedTextInputComponent,
    ImagePickerComponent,
    FieldLabel,
    AdminLangSwitcher,
  ],
  template: `
    <div class="min-h-screen bg-surface-50" [attr.dir]="i18n.dir()">
      <!-- Sticky header -->
      <header
        class="sticky top-0 z-20 border-b border-surface-200 bg-white/90 backdrop-blur"
      >
        <div
          class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3"
        >
          <a
            routerLink="/"
            class="text-surface-400 hover:text-surface-700"
            [attr.aria-label]="i18n.t('All sites', 'كل المواقع')"
          >
            <i class="pi pi-arrow-left" [class.rotate-180]="i18n.isAr()"></i>
          </a>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-semibold text-surface-900">
              {{ i18n.t('Site settings', 'إعدادات الموقع') }}
            </h1>
            @if (site(); as s) {
              <p class="truncate text-xs text-surface-500">{{ s.name }}</p>
            }
          </div>
          <div class="ms-auto flex items-center gap-2">
            <app-admin-lang-switcher />
            <p-button
              [label]="i18n.t('Builder', 'المحرّر')"
              icon="pi pi-pencil"
              size="small"
              [outlined]="true"
              [routerLink]="['/sites', siteId(), 'builder']"
            />
            @if (viewUrl(); as url) {
              <a [href]="url" target="_blank" rel="noopener">
                <p-button
                  [label]="i18n.t('View', 'عرض')"
                  icon="pi pi-external-link"
                  size="small"
                  [outlined]="true"
                />
              </a>
            }
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-5xl px-4 py-6 pb-28">
        @if (store.loading()) {
          <!-- Skeletons -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="rounded-xl border border-surface-200 bg-white p-5">
                <p-skeleton width="8rem" height="1.25rem" styleClass="mb-4" />
                <p-skeleton height="2.5rem" styleClass="mb-3" />
                <p-skeleton height="2.5rem" width="70%" />
              </div>
            }
          </div>
        } @else if (!site()) {
          <div class="py-20 text-center text-surface-500">
            {{ i18n.t('Site not found.', 'الموقع غير موجود.') }}
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- General -->
            <section class="rounded-xl border border-surface-200 bg-white p-5">
              <h2 class="mb-4 text-base font-semibold text-surface-900">
                {{ i18n.t('General', 'عام') }}
              </h2>
              <app-field-label
                [text]="i18n.t('Site name', 'اسم الموقع')"
                [hint]="
                  i18n.t(
                    'Your business or site name. Shown in the navbar and as the default page title.',
                    'اسم نشاطك أو موقعك. يظهر في شريط التنقل وكعنوان افتراضي للصفحة.'
                  )
                "
              />
              <input pInputText class="w-full" [(ngModel)]="name" />

              <div class="mt-4">
                <app-field-label
                  [text]="i18n.t('Subdomain', 'النطاق الفرعي')"
                  [hint]="
                    i18n.t(
                      'The public address of your site. Lowercase letters, digits and dashes; must be unique.',
                      'العنوان العام لموقعك. أحرف صغيرة وأرقام وشرطات؛ ويجب أن يكون فريداً.'
                    )
                  "
                />
              </div>
              <div class="flex items-stretch" [dir]="'ltr'">
                <span
                  class="inline-flex items-center rounded-s-md border border-e-0 border-surface-300 bg-surface-50 px-3 text-sm text-surface-500"
                >
                  /site/
                </span>
                <input
                  pInputText
                  class="w-full rounded-s-none"
                  [(ngModel)]="subdomain"
                  (ngModelChange)="onSubdomainChange($event)"
                  autocapitalize="off"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
              <div class="mt-1 min-h-5 text-sm">
                @switch (subdomainState()) {
                  @case ('checking') {
                    <span class="text-surface-500"
                      ><i class="pi pi-spin pi-spinner me-1 text-xs"></i
                      >{{ i18n.t('Checking…', 'جارٍ التحقق…') }}</span
                    >
                  }
                  @case ('available') {
                    <span class="text-green-600"
                      ><i class="pi pi-check-circle me-1 text-xs"></i
                      >{{ i18n.t('Available', 'متاح') }}</span
                    >
                  }
                  @case ('taken') {
                    <span class="text-red-600"
                      ><i class="pi pi-times-circle me-1 text-xs"></i
                      >{{ i18n.t('Already taken', 'مستخدم بالفعل') }}</span
                    >
                  }
                  @case ('invalid') {
                    <span class="text-red-600"
                      ><i class="pi pi-exclamation-circle me-1 text-xs"></i
                      >{{ i18n.t('Invalid subdomain', 'نطاق غير صالح') }}</span
                    >
                  }
                }
              </div>
            </section>

            <!-- Languages -->
            <section class="rounded-xl border border-surface-200 bg-white p-5">
              <h2 class="mb-4 text-base font-semibold text-surface-900">
                {{ i18n.t('Languages', 'اللغات') }}
              </h2>
              <app-field-label
                [text]="i18n.t('Language mode', 'وضع اللغة')"
                [hint]="
                  i18n.t(
                    'Which languages your site offers visitors. “Both” adds EN + AR inputs and an RTL toggle on the live site.',
                    'اللغات التي يقدمها موقعك للزوار. «كلاهما» يضيف حقول إنجليزية وعربية وزر تبديل للاتجاه على الموقع.'
                  )
                "
              />
              <p-select
                styleClass="w-full"
                [options]="languageModeOptions()"
                optionLabel="label"
                optionValue="value"
                [(ngModel)]="languageMode"
                (ngModelChange)="onLanguageModeChange($event)"
              />
              @if (languageMode() === 'both') {
                <div class="mt-4">
                  <app-field-label
                    [text]="i18n.t('Default language', 'اللغة الافتراضية')"
                    [hint]="
                      i18n.t(
                        'Which language the site shows first. Visitors can switch.',
                        'اللغة التي يظهر بها الموقع أولاً. يمكن للزوار التبديل.'
                      )
                    "
                  />
                  <p-select
                    styleClass="w-full"
                    [options]="defaultLanguageOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [(ngModel)]="defaultLanguage"
                  />
                </div>
              }
            </section>

            <!-- Visibility & theme -->
            <section class="rounded-xl border border-surface-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-surface-900">
                {{ i18n.t('Visibility & theme', 'الظهور والنمط') }}
              </h2>
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <p-checkbox inputId="pub" [(ngModel)]="published" [binary]="true" />
                  <label for="pub" class="text-sm text-surface-700">
                    {{
                      i18n.t(
                        'Published — visible to the public',
                        'منشور — مرئي للجمهور'
                      )
                    }}
                  </label>
                </div>

                <div>
                  <app-field-label
                    [text]="i18n.t('Theme', 'النمط')"
                    [hint]="
                      i18n.t(
                        '“Both” shows visitors a light/dark switch.',
                        '«كلاهما» يعرض للزوار زر تبديل فاتح/داكن.'
                      )
                    "
                  />
                  <p-select
                    [options]="themeModeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full"
                    [ngModel]="themeMode()"
                    (ngModelChange)="themeMode.set($event)"
                  />
                </div>

                @if (themeMode() === 'both') {
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <app-field-label
                        [text]="i18n.t('Light background', 'خلفية الوضع الفاتح')"
                      />
                      <div class="flex items-center gap-2">
                        <p-colorpicker
                          [ngModel]="lightBackground()"
                          (ngModelChange)="onBgHex('light', $event)"
                          format="hex"
                        />
                        <input
                          pInputText
                          class="w-full min-w-0 font-mono"
                          [dir]="'ltr'"
                          [ngModel]="lightBackground()"
                          (ngModelChange)="onBgHex('light', $event)"
                          maxlength="7"
                        />
                      </div>
                    </div>
                    <div>
                      <app-field-label
                        [text]="i18n.t('Dark background', 'خلفية الوضع الداكن')"
                      />
                      <div class="flex items-center gap-2">
                        <p-colorpicker
                          [ngModel]="darkBackground()"
                          (ngModelChange)="onBgHex('dark', $event)"
                          format="hex"
                        />
                        <input
                          pInputText
                          class="w-full min-w-0 font-mono"
                          [dir]="'ltr'"
                          [ngModel]="darkBackground()"
                          (ngModelChange)="onBgHex('dark', $event)"
                          maxlength="7"
                        />
                      </div>
                    </div>
                  </div>
                } @else {
                  <div>
                    <app-field-label
                      [text]="i18n.t('Background colour', 'لون الخلفية')"
                    />
                    <div class="flex items-center gap-2">
                      <p-colorpicker
                        [ngModel]="activeBg()"
                        (ngModelChange)="onBgHex('both', $event)"
                        format="hex"
                      />
                      <input
                        pInputText
                        class="w-full min-w-0 font-mono"
                        [dir]="'ltr'"
                        [ngModel]="activeBg()"
                        (ngModelChange)="onBgHex('both', $event)"
                        maxlength="7"
                      />
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Branding / Logos -->
            <section
              class="rounded-xl border border-surface-200 bg-white p-5 lg:col-span-3"
            >
              <h2 class="text-base font-semibold text-surface-900">
                {{ i18n.t('Logo & favicon', 'الشعار والأيقونة') }}
              </h2>
              <p class="mb-4 text-sm text-surface-500">
                {{
                  i18n.t(
                    'Upload your logo — brand colours are extracted automatically and the browser-tab favicon is generated from it.',
                    'ارفع شعارك — تُستخرج ألوان العلامة تلقائياً وتُنشأ أيقونة المتصفح منه.'
                  )
                }}
              </p>
              @if (themeMode() === 'both') {
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <app-image-picker
                    [label]="i18n.t('Logo (light background)', 'الشعار (خلفية فاتحة)')"
                    [hint]="
                      i18n.t(
                        'Shown in the navigation bar. Upload and crop; brand colours are extracted automatically.',
                        'يظهر في شريط التنقل. ارفع واقتص؛ تُستخرج ألوان العلامة تلقائياً.'
                      )
                    "
                    [value]="logoLight()"
                    (valueChange)="onLogoChange('light', $event)"
                    [uploadFn]="logoUploadLight"
                  />
                  <app-image-picker
                    [label]="i18n.t('Logo (dark background)', 'الشعار (خلفية داكنة)')"
                    [hint]="
                      i18n.t(
                        'Optional alternate logo for dark backgrounds.',
                        'شعار بديل اختياري للخلفيات الداكنة.'
                      )
                    "
                    [value]="logoDark()"
                    (valueChange)="onLogoChange('dark', $event)"
                    [uploadFn]="logoUploadDark"
                  />
                </div>
              } @else {
                <div class="max-w-sm">
                  <app-image-picker
                    [label]="i18n.t('Logo', 'الشعار')"
                    [hint]="
                      i18n.t(
                        'Shown in the navigation bar. Upload and crop; brand colours are extracted automatically.',
                        'يظهر في شريط التنقل. ارفع واقتص؛ تُستخرج ألوان العلامة تلقائياً.'
                      )
                    "
                    [value]="logoLight()"
                    (valueChange)="onLogoChange('both', $event)"
                    [uploadFn]="logoUploadLight"
                  />
                </div>
              }

              @if (faviconUrl(); as fav) {
                <div class="mt-4 flex items-center gap-2 text-sm text-surface-500">
                  <span>{{ i18n.t('Auto favicon:', 'الأيقونة التلقائية:') }}</span>
                  <img
                    [src]="fav"
                    alt="favicon"
                    class="h-6 w-6 rounded border border-surface-200 bg-white object-contain"
                  />
                </div>
              }
            </section>

            <!-- Colors -->
            <section
              class="rounded-xl border border-surface-200 bg-white p-5 lg:col-span-3"
            >
              <h2 class="text-base font-semibold text-surface-900">
                {{ i18n.t('Brand colours', 'ألوان العلامة') }}
              </h2>
              <p class="mb-4 text-sm text-surface-500">
                {{
                  i18n.t(
                    'Pick from extracted swatches or set exact values — the preview updates live.',
                    'اختر من العينات المستخرجة أو حدّد قيماً دقيقة — تتحدث المعاينة مباشرةً.'
                  )
                }}
              </p>
              @if (extractedColors().length) {
                <div class="mb-5 flex flex-wrap gap-3">
                  @for (c of extractedColors(); track c) {
                    <div class="flex flex-col items-center gap-1">
                      <div
                        class="h-12 w-12 rounded-lg border border-surface-200 shadow-sm"
                        [style.background]="c"
                        [title]="c"
                      ></div>
                      <div class="flex gap-1">
                        <button
                          type="button"
                          class="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-700 hover:bg-surface-200"
                          (click)="setPrimary(c)"
                        >
                          {{ i18n.t('Primary', 'أساسي') }}
                        </button>
                        <button
                          type="button"
                          class="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-700 hover:bg-surface-200"
                          (click)="setSecondary(c)"
                        >
                          {{ i18n.t('Accent', 'ثانوي') }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <app-field-label
                    [text]="i18n.t('Primary colour', 'اللون الأساسي')"
                    [hint]="
                      i18n.t(
                        'Main brand colour — buttons, links and accents.',
                        'اللون الأساسي للعلامة — الأزرار والروابط واللمسات.'
                      )
                    "
                  />
                  <div class="flex items-center gap-2">
                    <p-colorpicker
                      [(ngModel)]="primaryColor"
                      format="hex"
                      (ngModelChange)="onColorChange()"
                    />
                    <input
                      pInputText
                      class="w-full min-w-0 max-w-[8rem] font-mono"
                      [dir]="'ltr'"
                      [ngModel]="primaryColor()"
                      (ngModelChange)="onHexInput('primary', $event)"
                      maxlength="7"
                    />
                  </div>
                </div>
                <div>
                  <app-field-label
                    [text]="i18n.t('Accent colour', 'اللون الثانوي')"
                    [hint]="
                      i18n.t(
                        'Complementary colour — gradients and secondary buttons.',
                        'لون مكمّل — التدرجات والأزرار الثانوية.'
                      )
                    "
                  />
                  <div class="flex items-center gap-2">
                    <p-colorpicker
                      [(ngModel)]="secondaryColor"
                      format="hex"
                      (ngModelChange)="onColorChange()"
                    />
                    <input
                      pInputText
                      class="w-full min-w-0 max-w-[8rem] font-mono"
                      [dir]="'ltr'"
                      [ngModel]="secondaryColor()"
                      (ngModelChange)="onHexInput('secondary', $event)"
                      maxlength="7"
                    />
                  </div>
                </div>
              </div>
            </section>

            <!-- Typography -->
            <section
              class="rounded-xl border border-surface-200 bg-white p-5 lg:col-span-3"
            >
              <h2 class="text-base font-semibold text-surface-900">
                {{ i18n.t('Font', 'الخط') }}
              </h2>
              <p class="mb-4 text-sm text-surface-500">
                {{
                  i18n.t(
                    'A Google Font that supports both Arabic and English.',
                    'خط من Google يدعم العربية والإنجليزية معاً.'
                  )
                }}
              </p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-field-label
                    [text]="i18n.t('Font family', 'عائلة الخط')"
                  />
                  <p-select
                    [options]="fontOptions"
                    optionLabel="label"
                    optionValue="family"
                    styleClass="w-full"
                    [showClear]="true"
                    [placeholder]="i18n.t('Default (system)', 'افتراضي (النظام)')"
                    [ngModel]="fontFamily()"
                    (ngModelChange)="onFontChange($event)"
                  />
                </div>
                <div
                  class="rounded-lg border border-surface-200 bg-surface-50 p-4"
                  [style.font-family]="fontPreviewFamily()"
                >
                  <div class="text-lg font-semibold text-surface-900">
                    Aa Bb Cc 123
                  </div>
                  <div class="text-lg text-surface-700" dir="rtl">
                    أبجد هوّز ١٢٣
                  </div>
                </div>
              </div>
            </section>

            <!-- Layout: corner radius + navbar alignment -->
            <section
              class="rounded-xl border border-surface-200 bg-white p-5 lg:col-span-3"
            >
              <h2 class="text-base font-semibold text-surface-900">
                {{ i18n.t('Layout', 'التخطيط') }}
              </h2>
              <p class="mb-4 text-sm text-surface-500">
                {{
                  i18n.t(
                    'One corner radius shared by all buttons, cards and inputs across your site — from sharp (0%) to fully rounded (100%).',
                    'زاوية واحدة مشتركة بين كل الأزرار والبطاقات والحقول في موقعك — من حادة (0%) إلى دائرية بالكامل (100%).'
                  )
                }}
              </p>
              <div class="mb-5 max-w-xs">
                <app-field-label
                  [text]="i18n.t('Navbar alignment', 'محاذاة الشريط')"
                  [hint]="
                    i18n.t(
                      'Align the whole navbar — logo, links and the language/theme controls — to the start, center or end.',
                      'محاذاة الشريط بالكامل — الشعار والروابط وأزرار اللغة/النمط — إلى البداية أو الوسط أو النهاية.'
                    )
                  "
                />
                <p-select
                  [options]="navAlignOptions()"
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-full"
                  [ngModel]="navAlign()"
                  (ngModelChange)="navAlign.set($event)"
                />
              </div>
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div class="flex-1">
                  <div class="mb-2 flex items-center justify-between">
                    <app-field-label
                      [text]="i18n.t('Corner radius', 'نصف قطر الزاوية')"
                    />
                    <span
                      class="text-sm font-semibold tabular-nums text-surface-700"
                    >
                      {{ borderRadius() }}%
                    </span>
                  </div>
                  <p-slider
                    [min]="0"
                    [max]="100"
                    [ngModel]="borderRadius()"
                    (ngModelChange)="onRadiusChange($event)"
                    styleClass="w-full"
                  />
                </div>
                <!-- Live preview: a sample card + button using the chosen radius. -->
                <div
                  class="flex w-full shrink-0 items-center gap-3 border border-surface-200 bg-surface-50 p-4 sm:w-64"
                  [style.border-radius]="radiusPx()"
                >
                  <div
                    class="h-12 w-12 shrink-0 border border-surface-300 bg-white"
                    [style.border-radius]="radiusPx()"
                  ></div>
                  <span
                    class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white"
                    [style.background-color]="primaryColor()"
                    [style.border-radius]="radiusPx()"
                  >
                    {{ i18n.t('Button', 'زر') }}
                  </span>
                </div>
              </div>
            </section>

            <!-- SEO -->
            <section
              class="rounded-xl border border-surface-200 bg-white p-5 lg:col-span-3"
            >
              <h2 class="mb-4 text-base font-semibold text-surface-900">
                {{ i18n.t('SEO', 'تحسين محركات البحث') }}
              </h2>
              <div class="flex flex-col gap-4">
                <app-localized-text-input
                  [label]="i18n.t('Meta title', 'عنوان الميتا')"
                  [hint]="
                    i18n.t(
                      'Shown in the browser tab and as the headline in search results.',
                      'يظهر في تبويب المتصفح وكعنوان في نتائج البحث.'
                    )
                  "
                  [languages]="seoLanguages()"
                  [value]="metaTitle()"
                  (valueChange)="metaTitle.set($event)"
                />
                <app-localized-text-input
                  [label]="i18n.t('Meta description', 'وصف الميتا')"
                  [hint]="
                    i18n.t(
                      'A 1–2 sentence summary shown under the title in search results.',
                      'ملخص من جملة أو جملتين يظهر تحت العنوان في نتائج البحث.'
                    )
                  "
                  [languages]="seoLanguages()"
                  [value]="metaDescription()"
                  (valueChange)="metaDescription.set($event)"
                />
              </div>
            </section>
          </div>
        }
      </div>

      <!-- Sticky save bar -->
      @if (site()) {
        <div
          class="fixed inset-x-0 bottom-0 z-20 border-t border-surface-200 bg-white/95 backdrop-blur"
        >
          <div
            class="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3"
          >
            <p-button
              [label]="i18n.t('Save changes', 'حفظ التغييرات')"
              icon="pi pi-check"
              [loading]="store.saving()"
              [disabled]="store.saving() || !canSave()"
              (onClick)="save()"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class SettingsPage implements CanComponentDeactivate {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(SiteStore);
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly messages = inject(MessageService);
  protected readonly i18n = inject(AdminI18n);

  readonly site = this.store.site;
  readonly siteId = signal<string>('');

  readonly name = signal('');
  readonly subdomain = signal('');
  readonly languageMode = signal<LanguageMode>('en');
  readonly defaultLanguage = signal<Language>('en');
  readonly primaryColor = signal('#2563eb');
  readonly secondaryColor = signal('#9333ea');
  readonly lightBackground = signal('#ffffff');
  readonly darkBackground = signal('#111827');
  readonly borderRadius = signal(50);
  readonly navAlign = signal<'start' | 'center' | 'end'>('start');
  readonly themeMode = signal<'light' | 'dark' | 'both'>('light');
  readonly fontFamily = signal<string | null>(null);

  /** Live px value for the radius preview (mirrors ThemeService mapping). */
  protected readonly radiusPx = computed(
    () => `${Math.round((this.borderRadius() / 100) * 32)}px`,
  );
  /** The single background shown when the site uses one theme. */
  protected readonly activeBg = computed(() =>
    this.themeMode() === 'dark' ? this.darkBackground() : this.lightBackground(),
  );
  readonly published = signal(false);

  /** Curated Google Fonts that support both Arabic and Latin. */
  protected readonly fontOptions = ARABIC_LATIN_FONTS;
  protected readonly fontPreviewFamily = computed(() =>
    this.fontFamily() ? `'${this.fontFamily()}', sans-serif` : 'inherit',
  );
  readonly metaTitle = signal<LocalizedText>({});
  readonly metaDescription = signal<LocalizedText>({});
  /** Logo URLs bound to the ImagePickers (local so paste/clear don't flicker). */
  readonly logoLight = signal<string>('');
  readonly logoDark = signal<string>('');

  readonly seoLanguages = computed(() => languagesFor(this.languageMode()));

  readonly extractedColors = computed<string[]>(
    () => this.site()?.extractedColors ?? [],
  );
  readonly faviconUrl = computed(() => assetUrl(this.site()?.faviconUrl));

  /** Stable custom uploaders for the logo ImagePickers (dedicated endpoint that
   *  also extracts brand colours + generates the favicon). */
  readonly logoUploadLight = (file: File): Promise<string> =>
    this.uploadLogoFile('light', file);
  readonly logoUploadDark = (file: File): Promise<string> =>
    this.uploadLogoFile('dark', file);

  readonly subdomainState = signal<SubdomainState>('idle');
  private subdomainTimer: ReturnType<typeof setTimeout> | null = null;

  readonly languageModeOptions = computed(() => [
    { label: this.i18n.t('English', 'الإنجليزية'), value: 'en' as LanguageMode },
    { label: this.i18n.t('Arabic', 'العربية'), value: 'ar' as LanguageMode },
    { label: this.i18n.t('Both', 'كلاهما'), value: 'both' as LanguageMode },
  ]);
  readonly defaultLanguageOptions = computed(() => [
    { label: this.i18n.t('English', 'الإنجليزية'), value: 'en' as Language },
    { label: this.i18n.t('Arabic', 'العربية'), value: 'ar' as Language },
  ]);
  readonly themeModeOptions = computed(() => [
    { label: this.i18n.t('Light', 'فاتح'), value: 'light' as const },
    { label: this.i18n.t('Dark', 'داكن'), value: 'dark' as const },
    { label: this.i18n.t('Both (visitor can switch)', 'كلاهما (يمكن للزائر التبديل)'), value: 'both' as const },
  ]);
  readonly navAlignOptions = computed(() => [
    { label: this.i18n.t('Start', 'البداية'), value: 'start' as const },
    { label: this.i18n.t('Center', 'الوسط'), value: 'center' as const },
    { label: this.i18n.t('End', 'النهاية'), value: 'end' as const },
  ]);

  readonly viewUrl = computed(() => {
    const sub = this.site()?.subdomain;
    return sub
      ? this.router.serializeUrl(this.router.createUrlTree(['/site', sub]))
      : null;
  });

  private readonly subdomainPattern = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

  readonly canSave = computed(() => {
    const sub = this.subdomain().trim();
    if (sub.length < 2 || sub.length > 63) return false;
    if (!this.subdomainPattern.test(sub)) return false;
    if (this.subdomainState() === 'taken' || this.subdomainState() === 'invalid')
      return false;
    return this.name().trim().length >= 2;
  });

  /**
   * Whether the in-progress form differs from the loaded site. Drives the
   * {@link canDeactivate} guard and the `beforeunload` warning so visitors are
   * not silently navigated away from unsaved edits.
   */
  readonly dirty = computed(() => {
    const s = this.site();
    if (!s) return false;
    return (
      this.name() !== s.name ||
      this.subdomain() !== s.subdomain ||
      this.languageMode() !== s.languageMode ||
      this.defaultLanguage() !== s.defaultLanguage ||
      this.primaryColor() !== s.primaryColor ||
      this.secondaryColor() !== s.secondaryColor ||
      this.lightBackground() !== (s.lightBackground ?? '#ffffff') ||
      this.darkBackground() !== (s.darkBackground ?? '#111827') ||
      this.borderRadius() !== (s.borderRadius ?? 50) ||
      this.navAlign() !== (s.navAlign ?? 'start') ||
      this.themeMode() !== (s.themeMode ?? 'light') ||
      (this.fontFamily() ?? null) !== (s.fontFamily ?? null) ||
      this.published() !== s.published ||
      !this.sameText(this.metaTitle(), s.metaTitle) ||
      !this.sameText(this.metaDescription(), s.metaDescription)
    );
  });

  private sameText(a: LocalizedText, b: LocalizedText | undefined): boolean {
    const x = b ?? {};
    return (a.en ?? '') === (x.en ?? '') && (a.ar ?? '') === (x.ar ?? '');
  }

  /** Router guard hook: safe to leave only when there are no unsaved changes. */
  canDeactivate(): boolean {
    return !this.dirty();
  }

  /** Warn on full-page navigation / tab close while edits are unsaved. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private seededFor: string | null = null;

  constructor() {
    // Keep the document direction in sync so PrimeNG overlays are RTL too.
    effect(() => {
      document.documentElement.dir = this.i18n.dir();
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== this.siteId()) {
        this.siteId.set(id);
        this.seededFor = null;
        void this.loadSite(id);
      }
    });

    effect(() => {
      const s = this.site();
      if (!s || s.id !== this.siteId() || this.seededFor === s.id) return;
      this.seededFor = s.id;
      this.name.set(s.name);
      this.subdomain.set(s.subdomain);
      this.languageMode.set(s.languageMode);
      this.defaultLanguage.set(s.defaultLanguage);
      this.primaryColor.set(s.primaryColor);
      this.secondaryColor.set(s.secondaryColor);
      this.lightBackground.set(s.lightBackground ?? '#ffffff');
      this.darkBackground.set(s.darkBackground ?? '#111827');
      this.borderRadius.set(s.borderRadius ?? 50);
      this.theme.applyRadius(s.borderRadius);
      this.navAlign.set(s.navAlign ?? 'start');
      this.themeMode.set(s.themeMode ?? 'light');
      this.fontFamily.set(s.fontFamily ?? null);
      this.published.set(s.published);
      this.metaTitle.set({ ...(s.metaTitle ?? {}) });
      this.metaDescription.set({ ...(s.metaDescription ?? {}) });
      this.logoLight.set(s.logoLightUrl ?? '');
      this.logoDark.set(s.logoDarkUrl ?? '');
      this.subdomainState.set('idle');
      this.theme.apply(s.primaryColor, s.secondaryColor);
      this.theme.applyFont(s.fontFamily);
    });
  }

  private async loadSite(id: string): Promise<void> {
    try {
      await this.store.load(id);
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Load failed', 'فشل التحميل'),
      });
    }
  }

  onSubdomainChange(value: string): void {
    const normalized = (value ?? '').toLowerCase().trim();
    if (normalized !== value) this.subdomain.set(normalized);
    if (this.subdomainTimer) clearTimeout(this.subdomainTimer);

    if (normalized === this.site()?.subdomain) {
      this.subdomainState.set('idle');
      return;
    }
    if (
      normalized.length < 2 ||
      normalized.length > 63 ||
      !this.subdomainPattern.test(normalized)
    ) {
      this.subdomainState.set('invalid');
      return;
    }
    this.subdomainState.set('checking');
    this.subdomainTimer = setTimeout(
      () => void this.runSubdomainCheck(normalized),
      400,
    );
  }

  private async runSubdomainCheck(value: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.api.checkSubdomain(value, this.siteId()),
      );
      if (this.subdomain() !== value) return;
      this.subdomainState.set(res.available ? 'available' : 'taken');
    } catch {
      if (this.subdomain() === value) this.subdomainState.set('idle');
    }
  }

  onLanguageModeChange(mode: LanguageMode): void {
    if (mode === 'en') this.defaultLanguage.set('en');
    else if (mode === 'ar') this.defaultLanguage.set('ar');
  }

  /**
   * Upload a logo through the dedicated endpoint (which extracts brand colours
   * and, for the light logo, generates the favicon). Used as the ImagePicker's
   * custom uploader; returns the stored URL the picker then shows.
   */
  private async uploadLogoFile(
    mode: 'light' | 'dark',
    file: File,
  ): Promise<string> {
    const result = await firstValueFrom(
      this.api.uploadLogo(this.siteId(), mode, file),
    );
    this.store.mergeSite(result.site);
    this.primaryColor.set(result.site.primaryColor);
    this.secondaryColor.set(result.site.secondaryColor);
    this.theme.apply(result.site.primaryColor, result.site.secondaryColor);
    return result.url;
  }

  /**
   * Persist a logo chosen via paste/library or cleared via the picker's ✕.
   * Uploads are already persisted by {@link uploadLogoFile} (so a no-op here).
   */
  onLogoChange(mode: 'light' | 'dark' | 'both', url: string): void {
    if (mode === 'light' || mode === 'both') this.logoLight.set(url);
    if (mode === 'dark' || mode === 'both') this.logoDark.set(url);
    const s = this.site();
    const next = url || null;
    const lightSame = next === (s?.logoLightUrl ?? null);
    const darkSame = next === (s?.logoDarkUrl ?? null);
    // Clearing the light logo also clears the auto-generated favicon.
    const favicon = url ? {} : { faviconUrl: null };
    if (mode === 'light') {
      if (!lightSame) void this.store.saveSite({ logoLightUrl: next, ...favicon });
    } else if (mode === 'dark') {
      if (!darkSame) void this.store.saveSite({ logoDarkUrl: next });
    } else if (!lightSame || !darkSame) {
      // Single-theme site: store the one logo on BOTH variants so enabling
      // "both" later already has a value for each.
      void this.store.saveSite({
        logoLightUrl: next,
        logoDarkUrl: next,
        ...favicon,
      });
    }
  }

  setPrimary(hex: string): void {
    this.primaryColor.set(hex);
    this.applyTheme();
  }
  setSecondary(hex: string): void {
    this.secondaryColor.set(hex);
    this.applyTheme();
  }
  onColorChange(): void {
    this.applyTheme();
  }
  onHexInput(which: 'primary' | 'secondary', value: string): void {
    let v = (value ?? '').trim();
    if (v && !v.startsWith('#')) v = `#${v}`;
    if (which === 'primary') this.primaryColor.set(v);
    else this.secondaryColor.set(v);
    if (/^#([0-9a-fA-F]{6})$/.test(v)) this.applyTheme();
  }
  private applyTheme(): void {
    this.theme.apply(this.primaryColor(), this.secondaryColor());
  }

  /** Pick a Google Font (loads + previews it live; persisted on Save). */
  onFontChange(family: string | null): void {
    this.fontFamily.set(family ?? null);
    this.theme.applyFont(family);
  }

  /** Normalize a hex value (ensure a leading #) for a theme background field. */
  onBgHex(which: 'light' | 'dark' | 'both', value: string): void {
    let v = (value ?? '').trim();
    if (v && !v.startsWith('#')) v = '#' + v;
    if (which === 'light' || which === 'both') this.lightBackground.set(v);
    if (which === 'dark' || which === 'both') this.darkBackground.set(v);
  }

  /** Update the global corner radius (0–100%) and preview it live. */
  onRadiusChange(percent: number): void {
    const pct = Math.min(100, Math.max(0, Math.round(percent ?? 0)));
    this.borderRadius.set(pct);
    this.theme.applyRadius(pct);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    try {
      await this.store.saveSite({
        name: this.name().trim(),
        subdomain: this.subdomain().trim(),
        languageMode: this.languageMode(),
        defaultLanguage: this.defaultLanguage(),
        primaryColor: this.primaryColor(),
        secondaryColor: this.secondaryColor(),
        lightBackground: this.lightBackground(),
        darkBackground: this.darkBackground(),
        borderRadius: this.borderRadius(),
        navAlign: this.navAlign(),
        themeMode: this.themeMode(),
        fontFamily: this.fontFamily(),
        published: this.published(),
        metaTitle: this.metaTitle(),
        metaDescription: this.metaDescription(),
      });
      this.applyTheme();
      this.subdomainState.set('idle');
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Saved', 'تم الحفظ'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Save failed', 'فشل الحفظ'),
      });
    }
  }
}
