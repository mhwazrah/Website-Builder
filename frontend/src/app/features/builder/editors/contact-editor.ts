import { Component, input, model, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ContactContent, Language, LocalizedText } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `contact` section’s content. */
@Component({
  selector: 'app-contact-editor',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <app-localized-quill
        [label]="i18n.t('Description', 'الوصف')"
        [hint]="
          i18n.t(
            'Intro text shown above the contact form, inviting visitors to get in touch.',
            'نص تمهيدي يظهر أعلى نموذج التواصل لدعوة الزوار للتواصل معك.'
          )
        "
        [languages]="languages()"
        [value]="content().description"
        (valueChange)="patch({ description: $event })"
      />

      <div>
        <app-field-label
          [text]="i18n.t('Recipient email', 'البريد الإلكتروني للمستلم')"
          [hint]="
            i18n.t(
              'The inbox that receives every form submission, e.g. owner@example.com.',
              'صندوق البريد الذي يستقبل كل إرسال للنموذج، مثل owner@example.com.'
            )
          "
        />
        <input
          pInputText
          type="email"
          class="w-full"
          placeholder="owner@example.com"
          [ngModel]="content().recipientEmail"
          (ngModelChange)="patch({ recipientEmail: $event })"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{
            i18n.t(
              'Form submissions are delivered to this address.',
              'يتم إرسال نتائج النموذج إلى هذا العنوان.'
            )
          }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <p-checkbox
          inputId="contact-show-phone"
          [binary]="true"
          [ngModel]="content().showPhone"
          (ngModelChange)="patch({ showPhone: $event })"
        />
        <app-field-label
          for="contact-show-phone"
          [text]="i18n.t('Show a phone field on the form', 'إظهار حقل الهاتف في النموذج')"
          [hint]="
            i18n.t(
              'Turn on to let visitors add a phone number when they message you.',
              'فعّل الخيار للسماح للزوار بإضافة رقم هاتف عند مراسلتك.'
            )
          "
        />
      </div>

      <div>
        <app-field-label
          [text]="i18n.t('WhatsApp number', 'رقم واتساب')"
          [hint]="
            i18n.t(
              'Adds a WhatsApp chat button; enter digits with country code only, e.g. 15551234567.',
              'يضيف زر محادثة واتساب؛ أدخل الأرقام مع رمز الدولة فقط، مثل 15551234567.'
            )
          "
        />
        <input
          pInputText
          class="w-full"
          placeholder="15551234567"
          [ngModel]="content().whatsappNumber ?? ''"
          (ngModelChange)="patch({ whatsappNumber: $event })"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{
            i18n.t(
              'Digits only, including country code (no +, spaces or dashes).',
              'أرقام فقط، مع رمز الدولة (بدون + أو مسافات أو شرطات).'
            )
          }}
        </p>
      </div>

      <app-localized-text-input
        [label]="i18n.t('Success message', 'رسالة النجاح')"
        [hint]="
          i18n.t(
            'Confirmation shown to visitors right after they send the form, e.g. “Thanks, we’ll reply soon!”',
            'تأكيد يظهر للزوار مباشرة بعد إرسال النموذج، مثل ”شكرًا، سنرد عليك قريبًا!“'
          )
        "
        [languages]="languages()"
        [value]="content().successMessage"
        (valueChange)="patch({ successMessage: $event })"
      />
    </div>
  `,
})
export class ContactEditor {
  protected readonly i18n = inject(AdminI18n);
  readonly content = model.required<ContactContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch one or more contact-content fields. */
  protected patch(
    patch: Partial<{
      description: LocalizedText;
      recipientEmail: string;
      showPhone: boolean;
      whatsappNumber: string;
      successMessage: LocalizedText;
    }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }
}
