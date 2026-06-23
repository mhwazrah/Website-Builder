import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { Language, LocalizedText } from '../core/models';
import { dir, languageLabel } from '../core/i18n';
import { FieldLabel } from './field-label';

/**
 * A rich-text (Quill) field bound to a {@link LocalizedText}. Renders one editor
 * per active language; Arabic editors flip to RTL.
 */
@Component({
  selector: 'app-localized-quill',
  imports: [FormsModule, QuillEditorComponent, FieldLabel],
  template: `
    @if (label()) {
      <app-field-label [text]="label()" [hint]="hint()" />
    }
    <div class="flex flex-col gap-3">
      @for (lang of languages(); track lang) {
        <div [attr.dir]="dir(lang)">
          @if (languages().length > 1) {
            <div class="text-xs font-semibold text-gray-500 mb-1">
              {{ languageLabel(lang) }}
            </div>
          }
          <quill-editor
            class="block bg-white"
            theme="snow"
            [styles]="{ minHeight: '120px' }"
            [ngModel]="value()[lang] ?? ''"
            (ngModelChange)="update(lang, $event)"
          />
        </div>
      }
    </div>
  `,
})
export class LocalizedQuillComponent {
  readonly value = model<LocalizedText>({});
  readonly languages = input<Language[]>(['en']);
  readonly label = input('');
  readonly hint = input('');

  protected readonly languageLabel = languageLabel;
  protected readonly dir = dir;

  protected update(lang: Language, html: string | null): void {
    this.value.update((cur) => ({ ...cur, [lang]: html ?? '' }));
  }
}
