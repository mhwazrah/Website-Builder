import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { GalleryContent, GalleryImage, Language } from '../../../core/models';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `gallery` section’s content. */
@Component({
  selector: 'app-gallery-editor',
  imports: [
    FormsModule,
    SelectModule,
    ButtonModule,
    ImagePickerComponent,
    LocalizedTextInputComponent,
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
              'How many images sit side by side in each row of the gallery grid.',
              'عدد الصور التي تظهر جنبًا إلى جنب في كل صف من شبكة المعرض.'
            )
          "
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

      <!-- Gallery images -->
      <div class="flex flex-col gap-4">
        @for (image of content().images; track image.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Image', 'صورة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeImage(image.id)"
                [ariaLabel]="i18n.t('Remove image', 'إزالة الصورة')"
              />
            </div>

            <app-image-picker
              [aspectRatio]="1"
              [label]="i18n.t('Image', 'صورة')"
              [hint]="
                i18n.t(
                  'The photo shown in this gallery tile.',
                  'الصورة المعروضة في هذه البطاقة من المعرض.'
                )
              "
              [value]="image.url"
              (valueChange)="patchImage(image.id, { url: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Caption', 'التعليق')"
              [hint]="
                i18n.t(
                  'Optional short text shown under this image, in each language.',
                  'نص قصير اختياري يظهر أسفل هذه الصورة، بكل لغة.'
                )
              "
              [languages]="languages()"
              [value]="image.caption ?? {}"
              (valueChange)="patchImage(image.id, { caption: $event })"
            />
          </div>
        }

        @if (!content().images.length) {
          <p class="text-sm text-gray-400">
            {{
              i18n.t(
                'No images yet — add one to build your gallery.',
                'لا توجد صور بعد — أضف واحدة لبناء معرضك.'
              )
            }}
          </p>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add image', 'إضافة صورة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addImage()"
        />
      </div>
    </div>
  `,
})
export class GalleryEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<GalleryContent>();
  readonly languages = input.required<Language[]>();

  protected readonly columnOptions = computed(() => [
    { label: this.i18n.t('2 columns', 'عمودان'), value: 2 },
    { label: this.i18n.t('3 columns', '3 أعمدة'), value: 3 },
    { label: this.i18n.t('4 columns', '4 أعمدة'), value: 4 },
  ]);

  protected setColumns(columns: number): void {
    this.content.update((c) => ({ ...c, columns }));
  }

  /** Immutably patch a single gallery image by id. */
  protected patchImage(id: string, patch: Partial<GalleryImage>): void {
    this.content.update((c) => ({
      ...c,
      images: c.images.map((img) =>
        img.id === id ? { ...img, ...patch } : img,
      ),
    }));
  }

  protected removeImage(id: string): void {
    this.content.update((c) => ({
      ...c,
      images: c.images.filter((img) => img.id !== id),
    }));
  }

  protected addImage(): void {
    const image: GalleryImage = {
      id: crypto.randomUUID(),
      url: '',
      caption: {},
    };
    this.content.update((c) => ({ ...c, images: [...c.images, image] }));
  }
}
