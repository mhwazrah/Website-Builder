import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardItem, CardsContent, Language } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `cards` section’s content. */
@Component({
  selector: 'app-cards-editor',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Column count -->
      <div>
        <app-field-label
          [text]="i18n.t('Columns', 'الأعمدة')"
          [hint]="i18n.t('How many cards sit side by side in each row on wide screens.', 'عدد البطاقات التي تظهر جنباً إلى جنب في كل صف على الشاشات العريضة.')"
        />
        <p-select
          [options]="columnOptions()"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().columns"
          (ngModelChange)="setColumns($event)"
          styleClass="w-40"
        />
      </div>

      <!-- Card items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Card', 'بطاقة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove card', 'إزالة البطاقة')"
              />
            </div>

            <app-image-picker
              [aspectRatio]="4 / 3"
              [label]="i18n.t('Image', 'الصورة')"
              [hint]="i18n.t('The picture shown at the top of this card.', 'الصورة التي تظهر في أعلى هذه البطاقة.')"
              [value]="item.imageUrl ?? ''"
              (valueChange)="patchItem(item.id, { imageUrl: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Title', 'العنوان')"
              [hint]="i18n.t('The card\\'s heading, shown in bold above the body text.', 'عنوان البطاقة، يظهر بخط عريض فوق نص المحتوى.')"
              [languages]="languages()"
              [value]="item.title"
              (valueChange)="patchItem(item.id, { title: $event })"
            />

            <app-localized-quill
              [label]="i18n.t('Body', 'المحتوى')"
              [hint]="i18n.t('The card\\'s main text; you can add bold, links and lists.', 'النص الرئيسي للبطاقة؛ يمكنك إضافة خط عريض وروابط وقوائم.')"
              [languages]="languages()"
              [value]="item.body"
              (valueChange)="patchItem(item.id, { body: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('Link', 'الرابط')"
                [hint]="i18n.t('Where the card goes when clicked: a full web address like https://example.com, or #section to jump to a section on this page.', 'إلى أين تنتقل البطاقة عند النقر عليها: عنوان ويب كامل مثل https://example.com، أو ‎#section للانتقال إلى قسم في هذه الصفحة.')"
              />
              <input
                pInputText
                class="w-full"
                [placeholder]="i18n.t('https://… or #anchor', 'https://… أو ‎#anchor')"
                [ngModel]="item.link ?? ''"
                (ngModelChange)="patchItem(item.id, { link: $event })"
              />
            </div>
          </div>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add card', 'إضافة بطاقة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class CardsEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<CardsContent>();
  readonly languages = input.required<Language[]>();

  protected readonly columnOptions = computed(() => [
    { label: this.i18n.t('1 column', 'عمود واحد'), value: 1 },
    { label: this.i18n.t('2 columns', 'عمودان'), value: 2 },
    { label: this.i18n.t('3 columns', '3 أعمدة'), value: 3 },
    { label: this.i18n.t('4 columns', '4 أعمدة'), value: 4 },
  ]);

  protected setColumns(columns: number): void {
    this.content.update((c) => ({ ...c, columns }));
  }

  /** Immutably patch a single card item by id. */
  protected patchItem(id: string, patch: Partial<CardItem>): void {
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
    const item: CardItem = {
      id: crypto.randomUUID(),
      imageUrl: '',
      title: {},
      body: {},
      link: '',
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
