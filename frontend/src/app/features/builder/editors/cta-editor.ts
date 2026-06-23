import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CtaButton,
  CtaContent,
  Language,
  LocalizedText,
} from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `cta` section’s content. */
@Component({
  selector: 'app-cta-editor',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    LocalizedTextInputComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <app-localized-text-input
        [label]="i18n.t('Heading', 'العنوان الرئيسي')"
        [hint]="
          i18n.t(
            'The big call-to-action headline that grabs attention, like “Ready to get started?”',
            'العنوان الرئيسي اللافت للحث على اتخاذ إجراء، مثل «هل أنت مستعد للبدء؟»'
          )
        "
        [languages]="languages()"
        [value]="content().heading"
        (valueChange)="patch({ heading: $event })"
      />

      <app-localized-text-input
        [label]="i18n.t('Text', 'النص')"
        [hint]="
          i18n.t(
            'A short supporting line under the headline that encourages people to take the next step.',
            'سطر داعم قصير أسفل العنوان يشجع الأشخاص على اتخاذ الخطوة التالية.'
          )
        "
        [languages]="languages()"
        [value]="content().text"
        (valueChange)="patch({ text: $event })"
      />

      <!-- Button -->
      <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
        <span class="text-sm font-semibold text-gray-600">{{
          i18n.t('Button', 'الزر')
        }}</span>

        <app-localized-text-input
          [label]="i18n.t('Label', 'التسمية')"
          [hint]="
            i18n.t(
              'The text shown on the button itself, like “Get started” or “Contact us”.',
              'النص الظاهر على الزر نفسه، مثل «ابدأ الآن» أو «اتصل بنا».'
            )
          "
          [languages]="languages()"
          [value]="content().button.label"
          (valueChange)="patchButton({ label: $event })"
        />

        <div>
          <app-field-label
            [text]="i18n.t('URL', 'الرابط')"
            [hint]="
              i18n.t(
                'Where the button goes: a full web address starting with https://, or an on-page anchor like #contact.',
                'وجهة الزر: عنوان ويب كامل يبدأ بـ https://، أو رابط داخل الصفحة مثل ‎#contact.'
              )
            "
          />
          <input
            pInputText
            class="w-full"
            [placeholder]="i18n.t('https://… or #anchor', 'https://… أو ‎#anchor')"
            [ngModel]="content().button.url"
            (ngModelChange)="patchButton({ url: $event })"
          />
        </div>

        <div>
          <app-field-label
            [text]="i18n.t('Style', 'النمط')"
            [hint]="
              i18n.t(
                'Pick how the button looks: Primary for the main bold action, Secondary for a softer look, or Outline for just a border.',
                'اختر مظهر الزر: أساسي للإجراء الرئيسي البارز، ثانوي لمظهر أهدأ، أو محدد لإطار فقط.'
              )
            "
          />
          <p-select
            [options]="styleOptions"
            optionLabel="label"
            optionValue="value"
            [ngModel]="content().button.style"
            (ngModelChange)="patchButton({ style: $event })"
            styleClass="w-48"
          />
        </div>
      </div>
    </div>
  `,
})
export class CtaEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<CtaContent>();
  readonly languages = input.required<Language[]>();

  protected get styleOptions() {
    return [
      { label: this.i18n.t('Primary', 'أساسي'), value: 'primary' },
      { label: this.i18n.t('Secondary', 'ثانوي'), value: 'secondary' },
      { label: this.i18n.t('Outline', 'محدد'), value: 'outline' },
    ];
  }

  /** Immutably patch top-level heading / text fields. */
  protected patch(
    patch: Partial<{ heading: LocalizedText; text: LocalizedText }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }

  /** Immutably patch fields on the single CTA button. */
  protected patchButton(patch: Partial<CtaButton>): void {
    this.content.update((c) => ({
      ...c,
      button: {
        id: c.button?.id || crypto.randomUUID(),
        label: c.button?.label ?? {},
        url: c.button?.url ?? '',
        style: c.button?.style ?? 'primary',
        ...patch,
      },
    }));
  }
}
