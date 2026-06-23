import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CarouselContent, CarouselSlide, Language } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `carousel` section’s content. */
@Component({
  selector: 'app-carousel-editor',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    ButtonModule,
    LocalizedTextInputComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Playback settings -->
      <div class="flex flex-wrap items-end gap-6">
        <div class="flex items-center gap-2">
          <p-checkbox
            inputId="carousel-autoplay"
            [binary]="true"
            [ngModel]="content().autoplay"
            (ngModelChange)="setAutoplay($event)"
          />
          <app-field-label
            for="carousel-autoplay"
            [text]="i18n.t('Autoplay', 'تشغيل تلقائي')"
            [hint]="i18n.t('When on, slides advance on their own. Turn off to let visitors click through the slides themselves.', 'عند التفعيل، تتنقل الشرائح تلقائيًا. أوقف التشغيل للسماح للزوار بالتنقل بين الشرائح بأنفسهم.')"
          />
        </div>

        <div>
          <app-field-label
            [text]="i18n.t('Interval', 'الفاصل الزمني')"
            [hint]="i18n.t('How long each slide stays on screen before the next one appears. Only used when Autoplay is on.', 'مدة بقاء كل شريحة على الشاشة قبل ظهور الشريحة التالية. يُستخدم فقط عند تفعيل التشغيل التلقائي.')"
          />
          <p-select
            [options]="intervalOptions"
            optionLabel="label"
            optionValue="value"
            [ngModel]="content().intervalMs"
            (ngModelChange)="setInterval($event)"
            [disabled]="!content().autoplay"
            styleClass="w-44"
          />
        </div>
      </div>

      <!-- Slides -->
      <div class="flex flex-col gap-4">
        @for (slide of content().slides; track slide.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Slide', 'شريحة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeSlide(slide.id)"
                [ariaLabel]="i18n.t('Remove slide', 'إزالة الشريحة')"
              />
            </div>

            <app-image-picker
              [aspectRatio]="16 / 9"
              [label]="i18n.t('Image', 'الصورة')"
              [hint]="i18n.t('The picture shown on this slide. Use a wide, high-quality image for the best look across the carousel.', 'الصورة المعروضة في هذه الشريحة. استخدم صورة عريضة وعالية الجودة للحصول على أفضل مظهر عبر العارض الدوار.')"
              [value]="slide.imageUrl"
              (valueChange)="patchSlide(slide.id, { imageUrl: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Caption', 'التسمية التوضيحية')"
              [hint]="i18n.t('Short text shown over the image of this slide. Keep it brief so it is easy to read as the carousel moves.', 'نص قصير يظهر فوق صورة هذه الشريحة. اجعله موجزًا ليسهل قراءته أثناء حركة العارض الدوار.')"
              [languages]="languages()"
              [value]="slide.caption"
              (valueChange)="patchSlide(slide.id, { caption: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('Link', 'الرابط')"
                [hint]="i18n.t('Optional web address (like https://example.com) that this slide opens in a new tab when clicked. Leave blank for no link.', 'عنوان ويب اختياري (مثل https://example.com) تفتحه هذه الشريحة في علامة تبويب جديدة عند النقر عليها. اتركه فارغًا لعدم وجود رابط.')"
              />
              <input
                pInputText
                class="w-full"
                [placeholder]="i18n.t('https://… (optional, opens in new tab)', 'https://… (اختياري، يفتح في علامة تبويب جديدة)')"
                [ngModel]="slide.link ?? ''"
                (ngModelChange)="patchSlide(slide.id, { link: $event })"
              />
            </div>
          </div>
        }

        @if (!content().slides.length) {
          <p class="text-sm text-gray-400">{{ i18n.t('No slides yet — add your first one.', 'لا توجد شرائح بعد — أضف أول شريحة لك.') }}</p>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add slide', 'إضافة شريحة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addSlide()"
        />
      </div>
    </div>
  `,
})
export class CarouselEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<CarouselContent>();
  readonly languages = input.required<Language[]>();

  protected get intervalOptions() {
    return [
      { label: this.i18n.t('2 seconds', '٢ ثانية'), value: 2000 },
      { label: this.i18n.t('3 seconds', '٣ ثوانٍ'), value: 3000 },
      { label: this.i18n.t('5 seconds', '٥ ثوانٍ'), value: 5000 },
      { label: this.i18n.t('7 seconds', '٧ ثوانٍ'), value: 7000 },
      { label: this.i18n.t('10 seconds', '١٠ ثوانٍ'), value: 10000 },
    ];
  }

  protected setAutoplay(autoplay: boolean): void {
    this.content.update((c) => ({ ...c, autoplay }));
  }

  protected setInterval(intervalMs: number): void {
    this.content.update((c) => ({ ...c, intervalMs }));
  }

  /** Immutably patch a single slide by id. */
  protected patchSlide(id: string, patch: Partial<CarouselSlide>): void {
    this.content.update((c) => ({
      ...c,
      slides: c.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  protected removeSlide(id: string): void {
    this.content.update((c) => ({
      ...c,
      slides: c.slides.filter((s) => s.id !== id),
    }));
  }

  protected addSlide(): void {
    const slide: CarouselSlide = {
      id: crypto.randomUUID(),
      imageUrl: '',
      caption: {},
      link: '',
    };
    this.content.update((c) => ({ ...c, slides: [...c.slides, slide] }));
  }
}
