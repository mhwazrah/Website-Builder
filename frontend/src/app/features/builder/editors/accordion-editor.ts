import { Component, input, model, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import {
  AccordionContent,
  AccordionItem,
  Language,
} from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for an `accordion` / FAQ section’s content. */
@Component({
  selector: 'app-accordion-editor',
  imports: [
    FormsModule,
    CheckboxModule,
    ButtonModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Allow multiple panels open at once -->
      <div class="flex items-center gap-2">
        <p-checkbox
          inputId="acc-multiple"
          [binary]="true"
          [ngModel]="content().multiple"
          (ngModelChange)="setMultiple($event)"
        />
        <app-field-label
          for="acc-multiple"
          [text]="i18n.t('Allow multiple panels open at once', 'السماح بفتح عدة لوحات في وقت واحد')"
          [hint]="
            i18n.t(
              'When on, visitors can expand several FAQ cards together; when off, opening one closes the others.',
              'عند التفعيل، يمكن للزوار توسيع عدة بطاقات أسئلة معًا؛ وعند الإيقاف، يؤدي فتح إحداها إلى إغلاق الباقي.'
            )
          "
        />
      </div>

      <!-- Accordion items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Item', 'عنصر') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove item', 'إزالة العنصر')"
              />
            </div>

            <app-localized-text-input
              [label]="i18n.t('Header', 'العنوان')"
              [hint]="
                i18n.t(
                  'The question or title shown on the FAQ card that visitors click to expand.',
                  'السؤال أو العنوان الظاهر على بطاقة الأسئلة الذي ينقر عليه الزوار للتوسيع.'
                )
              "
              [languages]="languages()"
              [value]="item.header"
              (valueChange)="patchItem(item.id, { header: $event })"
            />

            <app-localized-quill
              [label]="i18n.t('Body', 'المحتوى')"
              [hint]="
                i18n.t(
                  'The answer that appears when the card is expanded; you can format it with bold, lists, and links.',
                  'الإجابة التي تظهر عند توسيع البطاقة؛ يمكنك تنسيقها بالخط العريض والقوائم والروابط.'
                )
              "
              [languages]="languages()"
              [value]="item.body"
              (valueChange)="patchItem(item.id, { body: $event })"
            />
          </div>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add item', 'إضافة عنصر')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class AccordionEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<AccordionContent>();
  readonly languages = input.required<Language[]>();

  protected setMultiple(multiple: boolean): void {
    this.content.update((c) => ({ ...c, multiple }));
  }

  /** Immutably patch a single accordion item by id. */
  protected patchItem(id: string, patch: Partial<AccordionItem>): void {
    this.content.update((c) => ({
      ...c,
      items: c.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  protected removeItem(id: string): void {
    this.content.update((c) => ({
      ...c,
      items: c.items.filter((it) => it.id !== id),
    }));
  }

  protected addItem(): void {
    const item: AccordionItem = {
      id: crypto.randomUUID(),
      header: {},
      body: {},
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
