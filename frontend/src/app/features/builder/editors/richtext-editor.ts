import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Language, RichTextContent } from '../../../core/models';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `richtext` section’s content. */
@Component({
  selector: 'app-richtext-editor',
  imports: [FormsModule, SelectModule, LocalizedQuillComponent, FieldLabel],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Body (bilingual rich text) -->
      <app-localized-quill
        [label]="i18n.t('Body', 'المحتوى')"
        [hint]="
          i18n.t(
            'The main formatted text for this section, with separate content per language.',
            'النص المنسّق الرئيسي لهذا القسم، مع محتوى منفصل لكل لغة.'
          )
        "
        [languages]="languages()"
        [value]="content().body"
        (valueChange)="setBody($event)"
      />

      <!-- Content width -->
      <div>
        <app-field-label
          [text]="i18n.t('Content width', 'عرض المحتوى')"
          [hint]="
            i18n.t(
              'How wide the text column is: Narrow keeps lines short and easy to read, Wide spreads text across more of the page.',
              'مدى عرض عمود النص: الضيّق يبقي الأسطر قصيرة وسهلة القراءة، والعريض ينشر النص عبر مساحة أكبر من الصفحة.'
            )
          "
        />
        <p-select
          [options]="widthOptions"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().maxWidth"
          (ngModelChange)="setMaxWidth($event)"
          styleClass="w-56"
        />
      </div>
    </div>
  `,
})
export class RichTextEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<RichTextContent>();
  readonly languages = input.required<Language[]>();

  protected get widthOptions(): {
    label: string;
    value: RichTextContent['maxWidth'];
  }[] {
    return [
      { label: this.i18n.t('Narrow', 'ضيّق'), value: 'narrow' },
      { label: this.i18n.t('Normal', 'عادي'), value: 'normal' },
      { label: this.i18n.t('Wide', 'عريض'), value: 'wide' },
    ];
  }

  protected setBody(body: RichTextContent['body']): void {
    this.content.update((c) => ({ ...c, body }));
  }

  protected setMaxWidth(maxWidth: RichTextContent['maxWidth']): void {
    this.content.update((c) => ({ ...c, maxWidth }));
  }
}
