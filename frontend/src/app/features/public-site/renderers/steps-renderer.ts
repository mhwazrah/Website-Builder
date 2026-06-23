import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { Language, Section, StepsContent } from '../../../core/models';

/**
 * Renders a `steps` section as a numbered process.
 *
 * - Vertical: a left-rail timeline with a continuous connecting line and
 *   numbered brand-coloured circles, each row showing a title and rich-text body.
 * - Horizontal: a responsive row of numbered steps, with connector segments
 *   linking the badges on wider screens.
 */
@Component({
  selector: 'app-steps-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .step-badge {
        animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      @media (prefers-reduced-motion: reduce) {
        .step-badge {
          animation: none;
        }
      }
    `,
  ],
  template: `
    @let s = section();
    @let l = lang();
    @let c = content();
    <div class="mx-auto max-w-5xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2
          class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(s.subtitle, l)) {
        <p class="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-12"></div>
      }

      @switch (c.layout) {
        @case ('horizontal') {
          <ol
            class="stagger grid gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4"
            [class.lg:grid-cols-3]="c.items.length === 3"
            [class.lg:grid-cols-2]="c.items.length === 2"
          >
            @for (item of c.items; track item.id; let i = $index; let last = $last) {
              <li class="group relative flex flex-col items-center text-center">
                <!-- Connector line to the next step (large screens only). -->
                @if (!last) {
                  <span
                    class="absolute top-7 hidden h-0.5 w-full lg:block"
                    [style.inset-inline-start]="'50%'"
                    [style.background-color]="
                      'color-mix(in srgb, var(--site-primary) 25%, transparent)'
                    "
                  ></span>
                }

                <div
                  class="step-badge relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-4 ring-white transition-transform duration-300 ease-out group-hover:scale-110"
                  [style.background-color]="'var(--site-primary)'"
                >
                  @if (item.icon) {
                    <i [class]="item.icon"></i>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>

                <div class="mt-5">
                  @if (resolveText(item.title, l)) {
                    <h3 class="text-lg font-bold text-gray-900">
                      {{ resolveText(item.title, l) }}
                    </h3>
                  }
                  <div
                    class="rich-text mt-2 text-gray-600"
                    [attr.dir]="dir(l)"
                    [innerHTML]="resolveText(item.body, l)"
                  ></div>
                </div>
              </li>
            }
          </ol>
        }

        @default {
          <ol class="stagger relative mx-auto max-w-2xl">
            <!-- Continuous timeline rail behind the badges. -->
            <span
              class="absolute top-6 bottom-6 w-0.5"
              [style.inset-inline-start]="'1.625rem'"
              [style.background-color]="
                'color-mix(in srgb, var(--site-primary) 22%, transparent)'
              "
            ></span>

            @for (item of c.items; track item.id; let i = $index) {
              <li class="group relative flex gap-5 pb-10 last:pb-0">
                <div
                  class="step-badge relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-4 ring-white transition-transform duration-300 ease-out group-hover:scale-110"
                  [style.background-color]="'var(--site-primary)'"
                >
                  @if (item.icon) {
                    <i [class]="item.icon"></i>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>

                <div class="min-w-0 flex-1 pt-1.5">
                  @if (resolveText(item.title, l)) {
                    <h3 class="text-xl font-bold text-gray-900">
                      {{ resolveText(item.title, l) }}
                    </h3>
                  }
                  <div
                    class="rich-text mt-2 text-gray-600"
                    [attr.dir]="dir(l)"
                    [innerHTML]="resolveText(item.body, l)"
                  ></div>
                </div>
              </li>
            }
          </ol>
        }
      }
    </div>
  `,
})
export class StepsRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as StepsContent,
  );

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
