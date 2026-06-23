import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import {
  Language,
  PricingContent,
  PricingFeature,
  PricingPlan,
} from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `pricing` section’s content. */
@Component({
  selector: 'app-pricing-editor',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    LocalizedTextInputComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      @for (plan of content().plans; track plan.id; let i = $index) {
        <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-600">
              {{ i18n.t('Plan', 'الباقة') }} {{ i + 1 }}
            </span>
            <p-button
              icon="pi pi-trash"
              severity="danger"
              [text]="true"
              [rounded]="true"
              (onClick)="removePlan(plan.id)"
              [ariaLabel]="i18n.t('Remove plan', 'إزالة الباقة')"
            />
          </div>

          <app-localized-text-input
            [label]="i18n.t('Name', 'الاسم')"
            [hint]="i18n.t('The plan name, e.g. Starter or Pro.', 'اسم الباقة، مثل مبتدئ أو احترافي.')"
            [languages]="languages()"
            [value]="plan.name"
            (valueChange)="patchPlan(plan.id, { name: $event })"
          />

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <app-localized-text-input
              [label]="i18n.t('Price', 'السعر')"
              [hint]="i18n.t('The headline price, e.g. $29 or Free.', 'السعر الرئيسي، مثل 29$ أو مجاني.')"
              [languages]="languages()"
              [value]="plan.price"
              (valueChange)="patchPlan(plan.id, { price: $event })"
            />
            <app-localized-text-input
              [label]="i18n.t('Period', 'الفترة')"
              [hint]="i18n.t('Small text after the price, e.g. /mo or per year.', 'نص صغير بعد السعر، مثل /شهر أو سنوياً.')"
              [languages]="languages()"
              [value]="plan.period"
              (valueChange)="patchPlan(plan.id, { period: $event })"
            />
          </div>

          <div class="flex items-center gap-2">
            <p-checkbox
              [inputId]="'pricing-highlight-' + plan.id"
              [binary]="true"
              [ngModel]="plan.highlighted"
              (ngModelChange)="patchPlan(plan.id, { highlighted: $event })"
            />
            <app-field-label
              [for]="'pricing-highlight-' + plan.id"
              [text]="i18n.t('Highlight this plan', 'إبراز هذه الباقة')"
              [hint]="i18n.t('Marks the plan as popular with a brand-coloured ring and a badge.', 'يميّز الباقة كالأكثر شيوعاً بإطار بلون العلامة وشارة.')"
            />
          </div>

          <!-- Features -->
          <div class="flex flex-col gap-2 rounded-md bg-gray-50 p-3">
            <app-field-label
              [text]="i18n.t('Features', 'المميزات')"
              [hint]="i18n.t('The bullet points listed under this plan, each shown with a check mark.', 'النقاط المدرجة ضمن هذه الباقة، تظهر كل منها بعلامة صح.')"
            />
            @for (feature of plan.features; track feature.id) {
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <app-localized-text-input
                    [languages]="languages()"
                    [value]="feature.text"
                    (valueChange)="patchFeature(plan.id, feature.id, $event)"
                  />
                </div>
                <p-button
                  icon="pi pi-times"
                  severity="danger"
                  [text]="true"
                  [rounded]="true"
                  (onClick)="removeFeature(plan.id, feature.id)"
                  [ariaLabel]="i18n.t('Remove feature', 'إزالة الميزة')"
                />
              </div>
            }
            <div>
              <p-button
                [label]="i18n.t('Add feature', 'إضافة ميزة')"
                icon="pi pi-plus"
                size="small"
                [text]="true"
                (onClick)="addFeature(plan.id)"
              />
            </div>
          </div>

          <!-- Button -->
          <app-localized-text-input
            [label]="i18n.t('Button label', 'نص الزر')"
            [hint]="i18n.t('Text on the call-to-action button, e.g. Choose plan.', 'النص على زر الدعوة للإجراء، مثل اختر الباقة.')"
            [languages]="languages()"
            [value]="plan.buttonLabel"
            (valueChange)="patchPlan(plan.id, { buttonLabel: $event })"
          />

          <div>
            <app-field-label
              [text]="i18n.t('Button link', 'رابط الزر')"
              [hint]="i18n.t('Where the button goes: a full web address like https://example.com, or #section to jump to a section on this page.', 'إلى أين ينتقل الزر: عنوان ويب كامل مثل https://example.com، أو ‎#section للانتقال إلى قسم في هذه الصفحة.')"
            />
            <input
              pInputText
              class="w-full"
              [placeholder]="i18n.t('https://… or #anchor', 'https://… أو ‎#anchor')"
              [ngModel]="plan.buttonUrl"
              (ngModelChange)="patchPlan(plan.id, { buttonUrl: $event })"
            />
          </div>
        </div>
      }

      <div>
        <p-button
          [label]="i18n.t('Add plan', 'إضافة باقة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addPlan()"
        />
      </div>
    </div>
  `,
})
export class PricingEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<PricingContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch a single plan by id. */
  protected patchPlan(id: string, patch: Partial<PricingPlan>): void {
    this.content.update((c) => ({
      ...c,
      plans: c.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  protected removePlan(id: string): void {
    this.content.update((c) => ({
      ...c,
      plans: c.plans.filter((p) => p.id !== id),
    }));
  }

  protected addPlan(): void {
    const plan: PricingPlan = {
      id: crypto.randomUUID(),
      name: {},
      price: {},
      period: {},
      features: [],
      highlighted: false,
      buttonLabel: {},
      buttonUrl: '',
    };
    this.content.update((c) => ({ ...c, plans: [...c.plans, plan] }));
  }

  /** Immutably patch a feature within a plan. */
  protected patchFeature(
    planId: string,
    featureId: string,
    text: PricingFeature['text'],
  ): void {
    this.content.update((c) => ({
      ...c,
      plans: c.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              features: p.features.map((f) =>
                f.id === featureId ? { ...f, text } : f,
              ),
            }
          : p,
      ),
    }));
  }

  protected addFeature(planId: string): void {
    const feature: PricingFeature = { id: crypto.randomUUID(), text: {} };
    this.content.update((c) => ({
      ...c,
      plans: c.plans.map((p) =>
        p.id === planId ? { ...p, features: [...p.features, feature] } : p,
      ),
    }));
  }

  protected removeFeature(planId: string, featureId: string): void {
    this.content.update((c) => ({
      ...c,
      plans: c.plans.map((p) =>
        p.id === planId
          ? { ...p, features: p.features.filter((f) => f.id !== featureId) }
          : p,
      ),
    }));
  }
}
