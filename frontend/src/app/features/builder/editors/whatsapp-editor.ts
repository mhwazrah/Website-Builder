import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { Language, LocalizedText, WhatsappContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `whatsapp` section’s content. */
@Component({
  selector: 'app-whatsapp-editor',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    LocalizedTextInputComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <div>
        <app-field-label
          [text]="i18n.t('WhatsApp number', 'رقم واتساب')"
          [hint]="
            i18n.t(
              'The phone number chats open to. Enter country code + number with digits only, e.g. 15551234567.',
              'رقم الهاتف الذي تُفتح المحادثات عليه. أدخل رمز الدولة + الرقم بالأرقام فقط، مثل 15551234567.'
            )
          "
        />
        <input
          pInputText
          inputmode="tel"
          class="w-full"
          placeholder="15551234567"
          [ngModel]="content().phone"
          (ngModelChange)="patch({ phone: $event })"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{
            i18n.t(
              'Country code + number, digits only (no +, spaces or dashes).',
              'رمز الدولة + الرقم، بالأرقام فقط (بدون + أو مسافات أو شرطات).'
            )
          }}
        </p>
      </div>

      <app-localized-text-input
        [label]="i18n.t('Prefilled message', 'رسالة مُعبّأة مسبقًا')"
        [hint]="
          i18n.t(
            'Text already typed into the chat when a visitor taps the button, so they can send right away.',
            'نص مكتوب مسبقًا في المحادثة عند نقر الزائر على الزر، حتى يتمكن من الإرسال فورًا.'
          )
        "
        placeholder="Hi! I’d like to know more…"
        [languages]="languages()"
        [value]="content().message"
        (valueChange)="patch({ message: $event })"
      />

      <app-localized-text-input
        [label]="i18n.t('Button label', 'نص الزر')"
        [hint]="
          i18n.t(
            'The clickable text shown on the WhatsApp button, e.g. Chat on WhatsApp.',
            'النص القابل للنقر الظاهر على زر واتساب، مثل: تحدث على واتساب.'
          )
        "
        placeholder="Chat on WhatsApp"
        [languages]="languages()"
        [value]="content().label"
        (valueChange)="patch({ label: $event })"
      />

      <div class="flex items-start gap-2">
        <p-checkbox
          inputId="whatsapp-floating"
          [binary]="true"
          [ngModel]="content().floating"
          (ngModelChange)="patch({ floating: $event })"
        />
        <app-field-label
          for="whatsapp-floating"
          [text]="i18n.t('Floating button', 'زر عائم')"
          [hint]="
            i18n.t(
              'When on, pins a round chat button to the bottom corner of every page instead of showing an inline button here.',
              'عند التفعيل، يُثبّت زر محادثة دائري في الزاوية السفلية لكل صفحة بدلاً من عرض زر مضمّن هنا.'
            )
          "
        />
      </div>
    </div>
  `,
})
export class WhatsappEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<WhatsappContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch one or more whatsapp-content fields. */
  protected patch(
    patch: Partial<{
      phone: string;
      message: LocalizedText;
      label: LocalizedText;
      floating: boolean;
    }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }
}
