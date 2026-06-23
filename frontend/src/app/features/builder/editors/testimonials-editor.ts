import { Component, input, model, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import {
  Language,
  TestimonialItem,
  TestimonialsContent,
} from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `testimonials` section’s content. */
@Component({
  selector: 'app-testimonials-editor',
  imports: [
    FormsModule,
    SelectModule,
    ButtonModule,
    LocalizedTextInputComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Column count -->
      <div>
        <app-field-label
          [text]="i18n.t('Columns', 'الأعمدة')"
          [hint]="
            i18n.t(
              'How many testimonial cards sit side by side in each row.',
              'عدد بطاقات الشهادات التي تظهر جنبًا إلى جنب في كل صف.'
            )
          "
        />
        <p-select
          [options]="columnOptions"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().columns"
          (ngModelChange)="setColumns($event)"
          styleClass="w-40"
        />
      </div>

      <!-- Testimonial items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Testimonial', 'شهادة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove testimonial', 'إزالة الشهادة')"
              />
            </div>

            <app-localized-text-input
              [label]="i18n.t('Quote', 'الاقتباس')"
              [hint]="
                i18n.t(
                  'The customer’s words of praise shown on this card.',
                  'كلمات الثناء التي يقولها العميل والمعروضة على هذه البطاقة.'
                )
              "
              [languages]="languages()"
              [value]="item.quote"
              (valueChange)="patchItem(item.id, { quote: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Author', 'الكاتب')"
              [hint]="
                i18n.t(
                  'The name of the person giving this testimonial.',
                  'اسم الشخص الذي يقدم هذه الشهادة.'
                )
              "
              [languages]="languages()"
              [value]="item.author"
              (valueChange)="patchItem(item.id, { author: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Role', 'المنصب')"
              [hint]="
                i18n.t(
                  'The author’s job title or company, e.g. CEO at Acme.',
                  'المسمى الوظيفي للكاتب أو شركته، مثل: الرئيس التنفيذي في أكمي.'
                )
              "
              [languages]="languages()"
              [value]="item.role"
              (valueChange)="patchItem(item.id, { role: $event })"
            />

            <app-image-picker
              [aspectRatio]="1"
              [label]="i18n.t('Avatar', 'الصورة الرمزية')"
              [hint]="
                i18n.t(
                  'A small photo of the author, shown next to their name.',
                  'صورة صغيرة للكاتب تظهر بجانب اسمه.'
                )
              "
              [value]="item.avatarUrl ?? ''"
              (valueChange)="patchItem(item.id, { avatarUrl: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('Rating', 'التقييم')"
                [hint]="
                  i18n.t(
                    'The star score for this review, from 1 to 5 stars.',
                    'تقييم هذه المراجعة بالنجوم، من نجمة واحدة إلى خمس نجوم.'
                  )
                "
              />
              <p-select
                [options]="ratingOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="item.rating"
                (ngModelChange)="patchItem(item.id, { rating: $event })"
                styleClass="w-40"
              />
            </div>
          </div>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add testimonial', 'إضافة شهادة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class TestimonialsEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<TestimonialsContent>();
  readonly languages = input.required<Language[]>();

  protected get columnOptions() {
    return [
      { label: this.i18n.t('1 column', 'عمود واحد'), value: 1 },
      { label: this.i18n.t('2 columns', 'عمودان'), value: 2 },
      { label: this.i18n.t('3 columns', '3 أعمدة'), value: 3 },
    ];
  }

  protected get ratingOptions() {
    return [
      { label: this.i18n.t('1 star', 'نجمة واحدة'), value: 1 },
      { label: this.i18n.t('2 stars', 'نجمتان'), value: 2 },
      { label: this.i18n.t('3 stars', '3 نجوم'), value: 3 },
      { label: this.i18n.t('4 stars', '4 نجوم'), value: 4 },
      { label: this.i18n.t('5 stars', '5 نجوم'), value: 5 },
    ];
  }

  protected setColumns(columns: number): void {
    this.content.update((c) => ({ ...c, columns }));
  }

  /** Immutably patch a single testimonial item by id. */
  protected patchItem(id: string, patch: Partial<TestimonialItem>): void {
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
    const item: TestimonialItem = {
      id: crypto.randomUUID(),
      quote: {},
      author: {},
      role: {},
      avatarUrl: '',
      rating: 5,
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
