import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { Language, LogoItem, LogosContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `logos` section’s content. */
@Component({
  selector: 'app-logos-editor',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    LocalizedTextInputComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Display settings -->
      <div class="flex items-center gap-2">
        <p-checkbox
          inputId="logos-grayscale"
          [binary]="true"
          [ngModel]="content().grayscale"
          (ngModelChange)="setGrayscale($event)"
        />
        <app-field-label
          for="logos-grayscale"
          [text]="i18n.t('Grayscale logos', 'شعارات بالأبيض والأسود')"
          [hint]="i18n.t('When on, logos appear muted in grayscale and turn to full colour when a visitor hovers over them. A tidy look for partner or client strips.', 'عند التفعيل، تظهر الشعارات باهتة بالأبيض والأسود وتتحول إلى ألوانها الكاملة عند مرور الزائر فوقها. مظهر أنيق لشريط الشركاء أو العملاء.')"
        />
      </div>

      <!-- Logo items -->
      <div class="flex flex-col gap-4">
        @for (logo of content().logos; track logo.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Logo', 'شعار') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeLogo(logo.id)"
                [ariaLabel]="i18n.t('Remove logo', 'إزالة الشعار')"
              />
            </div>

            <app-image-picker
              [label]="i18n.t('Logo image', 'صورة الشعار')"
              [hint]="i18n.t('The logo picture. A transparent PNG or SVG works best so it sits cleanly on the page background.', 'صورة الشعار. يُفضل استخدام صورة PNG أو SVG بخلفية شفافة لتظهر بشكل أنيق على خلفية الصفحة.')"
              [value]="logo.imageUrl"
              (valueChange)="patchLogo(logo.id, { imageUrl: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Alt text', 'النص البديل')"
              [hint]="i18n.t('A short description of the logo (such as the company name). Shown to screen readers and if the image fails to load.', 'وصف قصير للشعار (مثل اسم الشركة). يظهر لقارئات الشاشة وإذا تعذّر تحميل الصورة.')"
              [languages]="languages()"
              [value]="logo.alt"
              (valueChange)="patchLogo(logo.id, { alt: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('Link', 'الرابط')"
                [hint]="i18n.t('Optional web address (like https://example.com) that this logo opens in a new tab when clicked. Leave blank for no link.', 'عنوان ويب اختياري (مثل https://example.com) يفتحه هذا الشعار في علامة تبويب جديدة عند النقر عليه. اتركه فارغًا لعدم وجود رابط.')"
              />
              <input
                pInputText
                class="w-full"
                [placeholder]="i18n.t('https://… (optional, opens in new tab)', 'https://… (اختياري، يفتح في علامة تبويب جديدة)')"
                [ngModel]="logo.url ?? ''"
                (ngModelChange)="patchLogo(logo.id, { url: $event })"
              />
            </div>
          </div>
        }

        @if (!content().logos.length) {
          <p class="text-sm text-gray-400">
            {{
              i18n.t(
                'No logos yet — add your first one.',
                'لا توجد شعارات بعد — أضف أول شعار لك.'
              )
            }}
          </p>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add logo', 'إضافة شعار')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addLogo()"
        />
      </div>
    </div>
  `,
})
export class LogosEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<LogosContent>();
  readonly languages = input.required<Language[]>();

  protected setGrayscale(grayscale: boolean): void {
    this.content.update((c) => ({ ...c, grayscale }));
  }

  /** Immutably patch a single logo by id. */
  protected patchLogo(id: string, patch: Partial<LogoItem>): void {
    this.content.update((c) => ({
      ...c,
      logos: c.logos.map((logo) =>
        logo.id === id ? { ...logo, ...patch } : logo,
      ),
    }));
  }

  protected removeLogo(id: string): void {
    this.content.update((c) => ({
      ...c,
      logos: c.logos.filter((logo) => logo.id !== id),
    }));
  }

  protected addLogo(): void {
    const logo: LogoItem = {
      id: crypto.randomUUID(),
      imageUrl: '',
      alt: {},
      url: '',
    };
    this.content.update((c) => ({ ...c, logos: [...c.logos, logo] }));
  }
}
