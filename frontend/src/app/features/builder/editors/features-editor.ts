import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FeatureItem, FeaturesContent, Language } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `features` section’s content. */
@Component({
  selector: 'app-features-editor',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <p class="text-sm text-gray-500">
        {{
          i18n.t(
            'Each feature shows an image on one side and its title and text on the other. The image sits on the left for English and on the right for Arabic.',
            'تعرض كل ميزة صورة على أحد الجانبين والعنوان والنص على الجانب الآخر. تظهر الصورة على اليسار للإنجليزية وعلى اليمين للعربية.'
          )
        }}
      </p>

      <!-- Feature items -->
      <div class="flex flex-col gap-4">
        @for (item of content().items; track item.id; let i = $index) {
          <div class="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Feature', 'الميزة') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeItem(item.id)"
                [ariaLabel]="i18n.t('Remove feature', 'إزالة الميزة')"
              />
            </div>

            <app-image-picker
              [aspectRatio]="1"
              [label]="i18n.t('Image', 'الصورة')"
              [hint]="
                i18n.t(
                  'The picture shown beside this feature. Leave empty to show the icon instead.',
                  'الصورة التي تظهر بجانب هذه الميزة. اتركها فارغة لإظهار الأيقونة بدلاً منها.'
                )
              "
              [value]="item.imageUrl ?? ''"
              (valueChange)="patchItem(item.id, { imageUrl: $event })"
            />

            <div>
              <app-field-label
                [text]="i18n.t('Icon (fallback)', 'الأيقونة (بديلة)')"
                [hint]="
                  i18n.t(
                    'Shown only when no image is set. A PrimeIcons class name like pi pi-bolt — browse options at primeng.org/icons.',
                    'تظهر فقط عند عدم تعيين صورة. اسم فئة PrimeIcons مثل pi pi-bolt — تصفح الخيارات على primeng.org/icons.'
                  )
                "
              />
              <div class="flex items-center gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  [style.background-color]="
                    'color-mix(in srgb, var(--site-primary) 12%, transparent)'
                  "
                  [style.color]="'var(--site-primary)'"
                >
                  <i [class]="item.icon || 'pi pi-star'"></i>
                </span>
                <input
                  pInputText
                  class="w-full"
                  placeholder="pi pi-bolt"
                  [ngModel]="item.icon ?? ''"
                  (ngModelChange)="patchItem(item.id, { icon: $event })"
                />
              </div>
            </div>

            <app-localized-text-input
              [label]="i18n.t('Title', 'العنوان')"
              [hint]="
                i18n.t(
                  'The short headline for this feature, shown next to its image.',
                  'العنوان القصير لهذه الميزة، يظهر بجانب صورتها.'
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
                  'A sentence or two describing this feature and the benefit it offers visitors.',
                  'جملة أو جملتان تصف هذه الميزة والفائدة التي تقدمها للزوار.'
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
          [label]="i18n.t('Add feature', 'إضافة ميزة')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addItem()"
        />
      </div>
    </div>
  `,
})
export class FeaturesEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<FeaturesContent>();
  readonly languages = input.required<Language[]>();

  /** Immutably patch a single feature item by id. */
  protected patchItem(id: string, patch: Partial<FeatureItem>): void {
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
    const item: FeatureItem = {
      id: crypto.randomUUID(),
      icon: 'pi pi-star',
      imageUrl: '',
      title: {},
      body: {},
    };
    this.content.update((c) => ({ ...c, items: [...c.items, item] }));
  }
}
