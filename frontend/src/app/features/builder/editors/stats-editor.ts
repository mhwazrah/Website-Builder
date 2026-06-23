import { Component, inject, input, model } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AdminI18n } from '../../../core/admin-i18n';
import { Language, StatItem, StatsContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';

/** Per-type editor for a `stats` section’s content. */
@Component({
  selector: 'app-stats-editor',
  imports: [ButtonModule, LocalizedTextInputComponent],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Stat items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Stat', 'إحصائية') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove stat', 'إزالة الإحصائية')"
              />
            </div>

            <app-localized-text-input
              [label]="i18n.t('Value', 'القيمة')"
              [placeholder]="i18n.t('e.g. 10K+', 'مثال: ‎+10 آلاف')"
              [hint]="
                i18n.t(
                  'The big number for this stat, like 10K+ or 99%.',
                  'الرقم الكبير لهذه الإحصائية، مثل ‎+10 آلاف أو 99٪.'
                )
              "
              [languages]="languages()"
              [value]="item.value"
              (valueChange)="patchItem(item.id, { value: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Label', 'التسمية')"
              [placeholder]="i18n.t('e.g. Happy customers', 'مثال: عملاء سعداء')"
              [hint]="
                i18n.t(
                  'Short text under the number that says what it counts.',
                  'نص قصير أسفل الرقم يوضح ما يعدّه.'
                )
              "
              [languages]="languages()"
              [value]="item.label"
              (valueChange)="patchItem(item.id, { label: $event })"
            />
          </div>
        } @empty {
          <p class="text-sm text-gray-500">
            {{
              i18n.t(
                'No stats yet. Add your first stat below.',
                'لا توجد إحصائيات بعد. أضف أول إحصائية أدناه.'
              )
            }}
          </p>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add stat', 'إضافة إحصائية')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class StatsEditor {
  protected readonly i18n = inject(AdminI18n);
  readonly content = model.required<StatsContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch a single stat item by id. */
  protected patchItem(id: string, patch: Partial<StatItem>): void {
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
    const item: StatItem = {
      id: crypto.randomUUID(),
      value: {},
      label: {},
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
