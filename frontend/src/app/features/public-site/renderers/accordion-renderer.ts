import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { AccordionContent, Language, Section } from '../../../core/models';

/**
 * Hand-rolled accordion (no PrimeNG). Tracks open panels by index; when the
 * section is not `multiple`, opening one panel closes the others.
 */
@Component({
  selector: 'app-accordion-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-3xl px-4">
      @if (resolveText(s.title, l)) {
        <h2 class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(s.subtitle, l)) {
        <p class="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-8"></div>
      }

      <div class="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
        @for (item of content().items; track item.id; let i = $index) {
          <div>
            <button
              type="button"
              class="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors duration-200 ease-out hover:bg-gray-50"
              [attr.dir]="dir(l)"
              [attr.aria-expanded]="isOpen(i)"
              (click)="toggle(i)"
            >
              <span class="text-base font-semibold text-gray-900">
                {{ resolveText(item.header, l) }}
              </span>
              <i
                class="pi pi-chevron-down shrink-0 text-sm transition-transform duration-300 ease-out"
                [class.rotate-180]="isOpen(i)"
                [style.color]="'var(--site-primary)'"
              ></i>
            </button>
            <div class="acc-grid grid" [class.acc-grid-open]="isOpen(i)">
              <div class="min-h-0 overflow-hidden">
                <div
                  class="acc-panel rich-text px-5 pb-5 text-gray-600"
                  [class.acc-panel-open]="isOpen(i)"
                  [attr.dir]="dir(l)"
                  [innerHTML]="resolveText(item.body, l)"
                ></div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .acc-grid {
        grid-template-rows: 0fr;
        transition: grid-template-rows 280ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .acc-grid-open {
        grid-template-rows: 1fr;
      }
      .acc-panel {
        opacity: 0;
        transform: translateY(-4px);
        transition:
          opacity 280ms ease-out,
          transform 280ms ease-out;
      }
      .acc-panel-open {
        opacity: 1;
        transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .acc-grid,
        .acc-panel {
          transition: none;
        }
      }
    `,
  ],
})
export class AccordionRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  readonly content = computed(() => this.section().content as AccordionContent);

  /** Indices of currently-open panels. */
  private readonly openIds = signal<Set<number>>(new Set<number>());

  isOpen(index: number): boolean {
    return this.openIds().has(index);
  }

  toggle(index: number): void {
    const allowMultiple = this.content().multiple;
    const next = new Set(this.openIds());
    if (next.has(index)) {
      next.delete(index);
    } else {
      if (!allowMultiple) next.clear();
      next.add(index);
    }
    this.openIds.set(next);
  }

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
}
