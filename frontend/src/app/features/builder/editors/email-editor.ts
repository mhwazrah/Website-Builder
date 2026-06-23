import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { EmailContent, Language, LocalizedText } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for an `email` section’s content. */
@Component({
  selector: 'app-email-editor',
  imports: [
    FormsModule,
    InputTextModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <div>
        <app-field-label
          [text]="i18n.t('Email address', 'عنوان البريد الإلكتروني')"
          [hint]="
            i18n.t(
              'The inbox that receives messages, e.g. hello@yourbusiness.com.',
              'صندوق الوارد الذي يستقبل الرسائل، مثل hello@yourbusiness.com.'
            )
          "
        />
        <input
          pInputText
          type="email"
          class="w-full"
          placeholder="hello@example.com"
          [ngModel]="content().email"
          (ngModelChange)="patch({ email: $event })"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{
            i18n.t(
              "The button opens the visitor’s email app addressed to this inbox.",
              'يفتح الزر تطبيق البريد الإلكتروني لدى الزائر موجَّهًا إلى صندوق الوارد هذا.'
            )
          }}
        </p>
      </div>

      <app-localized-text-input
        [label]="i18n.t('Subject', 'الموضوع')"
        [hint]="
          i18n.t(
            'Pre-fills the email\\'s subject line when a visitor clicks.',
            'يملأ سطر موضوع البريد الإلكتروني مسبقًا عند نقر الزائر.'
          )
        "
        [languages]="languages()"
        [value]="content().subject"
        (valueChange)="patch({ subject: $event })"
      />

      <app-localized-quill
        [label]="i18n.t('Description', 'الوصف')"
        [hint]="
          i18n.t(
            'Optional text shown above the email button to invite visitors to get in touch.',
            'نص اختياري يظهر فوق زر البريد الإلكتروني لدعوة الزوار إلى التواصل.'
          )
        "
        [languages]="languages()"
        [value]="content().description"
        (valueChange)="patch({ description: $event })"
      />

      <app-localized-text-input
        [label]="i18n.t('Button label', 'تسمية الزر')"
        [hint]="
          i18n.t(
            'The clickable button text, e.g. \\'Email us\\' or \\'Get in touch\\'.',
            'نص الزر القابل للنقر، مثل ”راسلنا“ أو ”تواصل معنا“.'
          )
        "
        [languages]="languages()"
        [value]="content().label"
        (valueChange)="patch({ label: $event })"
      />
    </div>
  `,
})
export class EmailEditor {
  protected readonly i18n = inject(AdminI18n);
  readonly content = model.required<EmailContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch one or more email-content fields. */
  protected patch(
    patch: Partial<{
      email: string;
      subject: LocalizedText;
      description: LocalizedText;
      label: LocalizedText;
    }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }
}
