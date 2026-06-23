import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Language, LocalizedText, VideoContent } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `video` section’s content. */
@Component({
  selector: 'app-video-editor',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    LocalizedTextInputComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Provider -->
      <div>
        <app-field-label
          [text]="i18n.t('Source', 'المصدر')"
          [hint]="
            i18n.t(
              'Where the video is hosted. Choose the platform, then paste its link below.',
              'مكان استضافة الفيديو. اختر المنصة ثم الصق الرابط أدناه.'
            )
          "
        />
        <p-select
          [options]="providerOptions()"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().provider"
          (ngModelChange)="setProvider($event)"
          styleClass="w-56"
        />
      </div>

      <!-- URL -->
      <div>
        <app-field-label
          [text]="i18n.t('Video URL', 'رابط الفيديو')"
          [hint]="urlHint()"
        />
        <input
          pInputText
          class="w-full"
          [attr.dir]="'ltr'"
          [placeholder]="urlPlaceholder()"
          [ngModel]="content().url"
          (ngModelChange)="patch({ url: $event })"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{ i18n.t('Example:', 'مثال:') }} {{ urlPlaceholder() }}
        </p>
      </div>

      <!-- Caption -->
      <app-localized-text-input
        [label]="i18n.t('Caption', 'التعليق')"
        [hint]="
          i18n.t(
            'Optional short text shown beneath the video, in each language.',
            'نص قصير اختياري يظهر أسفل الفيديو، بكل لغة.'
          )
        "
        [languages]="languages()"
        [value]="content().caption"
        (valueChange)="patch({ caption: $event })"
      />
    </div>
  `,
})
export class VideoEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<VideoContent>();
  readonly languages = input.required<Language[]>();

  protected readonly providerOptions = computed(() => [
    { label: this.i18n.t('YouTube', 'يوتيوب'), value: 'youtube' },
    { label: this.i18n.t('Vimeo', 'فيميو'), value: 'vimeo' },
    { label: this.i18n.t('File URL', 'رابط ملف'), value: 'file' },
  ]);

  /** Provider-specific example URL used as placeholder and hint. */
  protected readonly urlPlaceholder = computed(() => {
    switch (this.content().provider) {
      case 'vimeo':
        return 'https://vimeo.com/76979871';
      case 'file':
        return 'https://example.com/media/intro.mp4';
      case 'youtube':
      default:
        return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }
  });

  protected readonly urlHint = computed(() => {
    switch (this.content().provider) {
      case 'vimeo':
        return this.i18n.t(
          'Paste any Vimeo link — the share URL or the player URL both work.',
          'الصق أي رابط فيميو — يعمل رابط المشاركة أو رابط المشغّل.',
        );
      case 'file':
        return this.i18n.t(
          'A direct link to a video file (.mp4, .webm) that visitors can play.',
          'رابط مباشر لملف فيديو (‎.mp4، ‎.webm) يمكن للزوار تشغيله.',
        );
      case 'youtube':
      default:
        return this.i18n.t(
          'Paste any YouTube link — watch, youtu.be, or embed URLs all work.',
          'الصق أي رابط يوتيوب — تعمل روابط المشاهدة أو youtu.be أو التضمين.',
        );
    }
  });

  protected setProvider(provider: VideoContent['provider']): void {
    this.content.update((c) => ({ ...c, provider }));
  }

  /** Immutably patch one or more video-content fields. */
  protected patch(
    patch: Partial<{ url: string; caption: LocalizedText }>,
  ): void {
    this.content.update((c) => ({ ...c, ...patch }));
  }
}
