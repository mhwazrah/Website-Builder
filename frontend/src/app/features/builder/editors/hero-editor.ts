import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { CtaButton, HeroContent, Language } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `hero` section’s content. */
@Component({
  selector: 'app-hero-editor',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    LocalizedTextInputComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Headline -->
      <app-localized-text-input
        [label]="i18n.t('Headline', 'العنوان الرئيسي')"
        [hint]="i18n.t('The big main title at the top of your hero banner.', 'العنوان الرئيسي الكبير في أعلى لافتة البطل.')"
        [languages]="languages()"
        [value]="content().headline"
        (valueChange)="patch({ headline: $event })"
      />

      <!-- Subheadline -->
      <app-localized-text-input
        [label]="i18n.t('Subheadline', 'العنوان الفرعي')"
        [hint]="i18n.t('A short supporting line shown under the headline.', 'سطر داعم قصير يظهر أسفل العنوان الرئيسي.')"
        [languages]="languages()"
        [value]="content().subheadline"
        (valueChange)="patch({ subheadline: $event })"
      />

      <!-- Background image -->
      <app-image-picker
        [aspectRatio]="16 / 9"
        [label]="i18n.t('Background image', 'صورة الخلفية')"
        [hint]="i18n.t('The full-width photo shown behind the hero text.', 'الصورة بعرض كامل التي تظهر خلف نص البطل.')"
        [value]="content().imageUrl ?? ''"
        (valueChange)="patch({ imageUrl: $event })"
      />

      <div class="flex flex-wrap items-end gap-6">
        <!-- Overlay -->
        <div class="flex items-center gap-2 pb-1">
          <p-checkbox
            inputId="hero-overlay"
            [binary]="true"
            [ngModel]="content().overlay"
            (ngModelChange)="patch({ overlay: $event })"
          />
          <app-field-label
            for="hero-overlay"
            [text]="i18n.t('Dark overlay over image', 'تراكب داكن فوق الصورة')"
            [hint]="i18n.t('Adds a dark tint over the background image so the text stays easy to read.', 'يضيف تظليلاً داكناً فوق صورة الخلفية لتبقى قراءة النص سهلة.')"
          />
        </div>

        <!-- Alignment -->
        <div>
          <app-field-label
            [text]="i18n.t('Alignment', 'المحاذاة')"
            [hint]="i18n.t('Choose whether the hero text sits to the left or in the center.', 'اختر ما إذا كان نص البطل يظهر على اليسار أو في المنتصف.')"
          />
          <p-select
            [options]="alignOptions"
            optionLabel="label"
            optionValue="value"
            [ngModel]="content().align"
            (ngModelChange)="patch({ align: $event })"
            styleClass="w-44"
          />
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex flex-col gap-3">
        <app-field-label
          [text]="i18n.t('Buttons', 'الأزرار')"
          [hint]="i18n.t('The call-to-action buttons shown in the hero, e.g. Get started or Contact us.', 'أزرار الحث على اتخاذ إجراء التي تظهر في البطل، مثل ابدأ الآن أو اتصل بنا.')"
        />
        @for (btn of content().buttons; track btn.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Button', 'زر') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeButton(btn.id)"
                [ariaLabel]="i18n.t('Remove button', 'إزالة الزر')"
              />
            </div>

            <app-localized-text-input
              [label]="i18n.t('Label', 'التسمية')"
              [hint]="i18n.t('The clickable text shown on this button, e.g. Get started.', 'النص القابل للنقر الذي يظهر على هذا الزر، مثل ابدأ الآن.')"
              [languages]="languages()"
              [value]="btn.label"
              (valueChange)="patchButton(btn.id, { label: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('URL', 'الرابط')"
                [hint]="i18n.t('Where this button goes: a full web address like https://example.com or a #anchor on this page.', 'وجهة هذا الزر: عنوان ويب كامل مثل https://example.com أو #مرساة في هذه الصفحة.')"
              />
              <input
                pInputText
                class="w-full"
                [placeholder]="i18n.t('https://… or #anchor', 'https://… أو #مرساة')"
                [ngModel]="btn.url"
                (ngModelChange)="patchButton(btn.id, { url: $event })"
              />
            </div>

            <div>
              <app-field-label
                [text]="i18n.t('Style', 'النمط')"
                [hint]="i18n.t('The look of the button: Primary is the bold main action, Secondary and Outline are lighter.', 'مظهر الزر: الأساسي هو الإجراء الرئيسي البارز، والثانوي والمحدد أخف.')"
              />
              <p-select
                [options]="styleOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="btn.style"
                (ngModelChange)="patchButton(btn.id, { style: $event })"
                styleClass="w-44"
              />
            </div>
          </div>
        }

        <div>
          <p-button
            [label]="i18n.t('Add button', 'إضافة زر')"
            icon="pi pi-plus"
            [outlined]="true"
            (onClick)="addButton()"
          />
        </div>
      </div>
    </div>
  `,
})
export class HeroEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<HeroContent>();
  readonly languages = input.required<Language[]>();

  protected get alignOptions() {
    return [
      { label: this.i18n.t('Left', 'يسار'), value: 'left' },
      { label: this.i18n.t('Center', 'وسط'), value: 'center' },
    ];
  }

  protected get styleOptions() {
    return [
      { label: this.i18n.t('Primary', 'أساسي'), value: 'primary' },
      { label: this.i18n.t('Secondary', 'ثانوي'), value: 'secondary' },
      { label: this.i18n.t('Outline', 'محدد'), value: 'outline' },
    ];
  }

  /** Immutably patch top-level content fields. */
  protected patch(patch: Partial<HeroContent>): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }

  /** Immutably patch a single button by id. */
  protected patchButton(id: string, patch: Partial<CtaButton>): void {
    this.content.update((c) => ({
      ...c,
      buttons: c.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }

  protected removeButton(id: string): void {
    this.content.update((c) => ({
      ...c,
      buttons: c.buttons.filter((b) => b.id !== id),
    }));
  }

  protected addButton(): void {
    const button: CtaButton = {
      id: crypto.randomUUID(),
      label: {},
      url: '',
      style: 'primary',
    };
    this.content.update((c) => ({ ...c, buttons: [...c.buttons, button] }));
  }
}
