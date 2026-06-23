import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { Language, PricingContent, PricingPlan, Section } from '../../../core/models';

/**
 * Renders a `pricing` section: a responsive grid of plan cards. The column
 * count adapts to how many plans there are (1 / 2 / 3+). A plan marked
 * `highlighted` stands out with a brand-coloured ring, a slight upward scale
 * and a “Popular” badge. Each plan shows its name, a large price with a small
 * period suffix, a brand-checked feature list and a primary action button.
 */
@Component({
  selector: 'app-pricing-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-6xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2 class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
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

      <div class="stagger grid items-stretch gap-6 lg:gap-8" [class]="gridCols()">
        @for (plan of plans(); track plan.id) {
          <div
            class="relative flex flex-col rounded-3xl border bg-white p-8 transition-all duration-300 ease-out"
            [class.card-elevation]="!plan.highlighted"
            [class.hover:-translate-y-1.5]="!plan.highlighted"
            [class.hover:shadow-xl]="!plan.highlighted"
            [class.border-gray-100]="!plan.highlighted"
            [class.shadow-2xl]="plan.highlighted"
            [class.lg:scale-[1.04]]="plan.highlighted"
            [class.z-10]="plan.highlighted"
            [style.box-shadow]="plan.highlighted ? ringShadow : null"
            [style.border-color]="plan.highlighted ? 'var(--site-primary)' : null"
          >
            @if (plan.highlighted) {
              <span
                class="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-md"
                [style.background-color]="'var(--site-primary)'"
              >
                <i class="pi pi-star-fill" style="font-size: 0.7rem"></i>
                {{ l === 'ar' ? 'الأكثر شيوعاً' : 'Popular' }}
              </span>
            }

            @if (resolveText(plan.name, l)) {
              <h3 class="text-lg font-semibold text-surface-900">
                {{ resolveText(plan.name, l) }}
              </h3>
            }

            <div class="mt-4 flex items-end gap-1.5">
              <span class="text-5xl font-extrabold leading-none tracking-tight text-surface-900">
                {{ resolveText(plan.price, l) }}
              </span>
              @if (resolveText(plan.period, l)) {
                <span class="pb-1 text-sm font-medium text-surface-500">
                  {{ resolveText(plan.period, l) }}
                </span>
              }
            </div>

            @if (plan.features.length) {
              <ul class="mt-7 flex flex-1 flex-col gap-3.5">
                @for (feature of plan.features; track feature.id) {
                  <li class="flex items-start gap-3 text-surface-700">
                    <span
                      class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      [style.background-color]="checkBg"
                      [style.color]="'var(--site-primary)'"
                    >
                      <i class="pi pi-check" style="font-size: 0.7rem"></i>
                    </span>
                    <span class="text-sm leading-snug">{{ resolveText(feature.text, l) }}</span>
                  </li>
                }
              </ul>
            } @else {
              <div class="flex-1"></div>
            }

            @if (resolveText(plan.buttonLabel, l)) {
              <a
                [href]="plan.buttonUrl || '#'"
                [target]="isExternal(plan.buttonUrl) ? '_blank' : null"
                [rel]="isExternal(plan.buttonUrl) ? 'noopener noreferrer' : null"
                class="mt-8 inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                [style.background-color]="'var(--site-primary)'"
              >
                {{ resolveText(plan.buttonLabel, l) }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PricingRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(() => this.section().content as PricingContent);

  /** The plans to render (defensive against malformed data). */
  protected readonly plans = computed<PricingPlan[]>(() => this.content().plans ?? []);

  /** Adapt the grid column count to the number of plans (1 / 2 / 3+). */
  protected readonly gridCols = computed(() => {
    const count = this.plans().length;
    if (count <= 1) return 'mx-auto max-w-md grid-cols-1';
    if (count === 2) return 'mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  });

  /** Tinted background for the feature check badges, derived from the brand. */
  protected readonly checkBg = 'color-mix(in srgb, var(--site-primary) 14%, white)';

  /** Brand-coloured ring used to make the highlighted plan stand out. */
  protected readonly ringShadow =
    '0 0 0 2px var(--site-primary), 0 25px 50px -12px color-mix(in srgb, var(--site-primary) 35%, transparent)';

  /** True when the URL points off-site (so we open it in a new tab). */
  protected isExternal(url: string): boolean {
    return /^https?:\/\//i.test(url ?? '');
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
