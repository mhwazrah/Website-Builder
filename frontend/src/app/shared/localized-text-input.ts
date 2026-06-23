import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Language, LocalizedText } from '../core/models';
import { dir, languageLabel } from '../core/i18n';
import { FieldLabel } from './field-label';

/**
 * A plain-text field bound to a {@link LocalizedText}. Renders one input per
 * active language (so bilingual sites get EN + AR inputs side by side).
 */
@Component({
  selector: 'app-localized-text-input',
  imports: [FormsModule, InputText, FieldLabel],
  template: `
    @if (label()) {
      <app-field-label [text]="label()" [hint]="hint()" />
    }
    <div class="flex flex-col gap-2">
      @for (lang of languages(); track lang) {
        <div class="flex items-center gap-2">
          @if (languages().length > 1) {
            <span
              class="text-[11px] font-semibold uppercase w-7 shrink-0 text-gray-400"
              >{{ lang }}</span
            >
          }
          <input
            pInputText
            class="w-full"
            [attr.dir]="dir(lang)"
            [placeholder]="placeholder()"
            [ngModel]="value()[lang] ?? ''"
            (ngModelChange)="update(lang, $event)"
          />
        </div>
      }
    </div>
  `,
})
export class LocalizedTextInputComponent {
  readonly value = model<LocalizedText>({});
  readonly languages = input<Language[]>(['en']);
  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('');

  protected readonly languageLabel = languageLabel;
  protected readonly dir = dir;

  protected update(lang: Language, v: string): void {
    this.value.update((cur) => ({ ...cur, [lang]: v }));
  }
}
