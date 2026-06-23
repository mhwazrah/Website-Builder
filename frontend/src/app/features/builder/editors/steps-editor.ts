import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { Language, StepItem, StepsContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `steps` section’s content. */
@Component({
  selector: 'app-steps-editor',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Layout -->
      <div>
        <app-field-label
          [text]="i18n.t('Layout', 'التخطيط')"
          [hint]="
            i18n.t(
              'Vertical shows the steps as a top-to-bottom timeline; Horizontal lays them out in a row across the page.',
              'العمودي يعرض الخطوات كخط زمني من الأعلى إلى الأسفل؛ الأفقي يرتبها في صف عبر الصفحة.'
            )
          "
        />
        <p-select
          [options]="layoutOptions()"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().layout"
          (ngModelChange)="setLayout($event)"
          styleClass="w-48"
        />
      </div>

      <!-- Step items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Step', 'الخطوة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove step', 'إزالة الخطوة')"
              />
            </div>

            <div>
              <app-field-label
                [text]="i18n.t('Icon', 'الأيقونة')"
                [hint]="
                  i18n.t(
                    'Optional PrimeIcons class shown inside the step badge instead of its number, like pi pi-check.',
                    'فئة PrimeIcons اختيارية تظهر داخل شارة الخطوة بدلاً من رقمها، مثل pi pi-check.'
                  )
                "
              />
              <div class="flex items-center gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  [style.background-color]="'var(--site-primary)'"
                >
                  @if (item.icon) {
                    <i [class]="item.icon"></i>
                  } @else {
                    {{ i + 1 }}
                  }
                </span>
                <input
                  pInputText
                  class="w-full"
                  placeholder="pi pi-check"
                  [ngModel]="item.icon ?? ''"
                  (ngModelChange)="patchItem(item.id, { icon: $event })"
                />
              </div>
              <p class="mt-1 text-xs text-gray-400">
                {{
                  i18n.t(
                    'Leave blank to show the step number. Browse icons at primeng.org/icons.',
                    'اتركه فارغًا لإظهار رقم الخطوة. تصفح الأيقونات على primeng.org/icons.'
                  )
                }}
              </p>
            </div>

            <app-localized-text-input
              [label]="i18n.t('Title', 'العنوان')"
              [hint]="
                i18n.t(
                  'A short name for this step in the process.',
                  'اسم قصير لهذه الخطوة في العملية.'
                )
              "
              [languages]="languages()"
              [value]="item.title"
              (valueChange)="patchItem(item.id, { title: $event })"
            />

            <app-localized-quill
              [label]="i18n.t('Body', 'النص')"
              [hint]="
                i18n.t(
                  'Explain what happens during this step and what the visitor should expect.',
                  'اشرح ما يحدث خلال هذه الخطوة وما الذي يجب أن يتوقعه الزائر.'
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
          [label]="i18n.t('Add step', 'إضافة خطوة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class StepsEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<StepsContent>();
  readonly languages = input.required<Language[]>();

  protected readonly layoutOptions = computed(() => [
    { label: this.i18n.t('Vertical', 'عمودي'), value: 'vertical' },
    { label: this.i18n.t('Horizontal', 'أفقي'), value: 'horizontal' },
  ]);

  protected setLayout(layout: 'vertical' | 'horizontal'): void {
    this.content.update((c) => ({ ...c, layout }));
  }

  /** Immutably patch a single step item by id. */
  protected patchItem(id: string, patch: Partial<StepItem>): void {
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
    const item: StepItem = {
      id: crypto.randomUUID(),
      title: {},
      body: {},
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
