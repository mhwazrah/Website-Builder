import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Language, LocalizedText, MapContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `map` section’s content. */
@Component({
  selector: 'app-map-editor',
  imports: [
    FormsModule,
    InputTextModule,
    LocalizedTextInputComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Address / place query -->
      <div>
        <app-field-label
          [text]="i18n.t('Address or place', 'العنوان أو المكان')"
          [hint]="
            i18n.t(
              'A street address, business name, or place to pin on the map — exactly as you would type it into Google Maps.',
              'عنوان أو اسم نشاط تجاري أو مكان لتثبيته على الخريطة — تمامًا كما تكتبه في خرائط Google.'
            )
          "
        />
        <input
          pInputText
          type="text"
          class="w-full"
          placeholder="123 King Fahd Rd, Riyadh"
          [ngModel]="content().query"
          (ngModelChange)="patch({ query: $event })"
        />
      </div>

      <!-- Zoom + height side by side -->
      <div class="flex flex-wrap gap-5">
        <div class="flex flex-col">
          <app-field-label
            [text]="i18n.t('Zoom level', 'مستوى التكبير')"
            [hint]="
              i18n.t(
                'How close the map is zoomed in. Lower shows a wider area; higher zooms onto the exact spot (around 14 works for most addresses).',
                'مدى تقريب الخريطة. القيم الأقل تُظهر منطقة أوسع، والأعلى تُقرّب على الموقع المحدد (القيمة 14 تقريبًا مناسبة لمعظم العناوين).'
              )
            "
          />
          <input
            pInputText
            type="number"
            min="1"
            max="20"
            class="w-40"
            [ngModel]="content().zoom"
            (ngModelChange)="patch({ zoom: toNumber($event) })"
          />
        </div>

        <div class="flex flex-col">
          <app-field-label
            [text]="i18n.t('Height (px)', 'الارتفاع (بكسل)')"
            [hint]="
              i18n.t(
                'The height of the map on the page, in pixels. The map always fills the full width.',
                'ارتفاع الخريطة على الصفحة بالبكسل. تملأ الخريطة العرض بالكامل دائمًا.'
              )
            "
          />
          <input
            pInputText
            type="number"
            min="100"
            step="20"
            class="w-40"
            [ngModel]="content().height"
            (ngModelChange)="patch({ height: toNumber($event) })"
          />
        </div>
      </div>

      <!-- Caption -->
      <app-localized-text-input
        [label]="i18n.t('Caption', 'التعليق')"
        [hint]="
          i18n.t(
            'Optional short text shown beneath the map, in each language.',
            'نص قصير اختياري يظهر أسفل الخريطة، بكل لغة.'
          )
        "
        [languages]="languages()"
        [value]="content().caption ?? {}"
        (valueChange)="patch({ caption: $event })"
      />
    </div>
  `,
})
export class MapEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<MapContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch one or more map-content fields. */
  protected patch(
    patch: Partial<{
      query: string;
      zoom: number;
      height: number;
      caption: LocalizedText;
    }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }

  /** Coerce a number-input value to a finite number (0 when blank/invalid). */
  protected toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
}
