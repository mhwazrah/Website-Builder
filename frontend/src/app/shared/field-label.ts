import { Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * A form field label with an optional help tooltip. Use everywhere a field
 * needs explanation, so non-technical users understand what each value does.
 *
 *   <app-field-label text="Menu link id" hint="A short id the nav menu scrolls to…" />
 */
@Component({
  selector: 'app-field-label',
  imports: [TooltipModule],
  template: `
    <label
      class="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700"
      [attr.for]="for() || null"
    >
      <span>{{ text() }}</span>
      @if (hint()) {
        <i
          class="pi pi-question-circle cursor-help text-xs text-surface-400 hover:text-surface-600"
          [pTooltip]="hint()"
          tooltipPosition="top"
          [autoHide]="false"
          tabindex="0"
          [attr.aria-label]="text() + ' help: ' + hint()"
        ></i>
      }
    </label>
  `,
})
export class FieldLabel {
  readonly text = input.required<string>();
  readonly hint = input<string>('');
  readonly for = input<string>('');
}
