import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { CardsContent, Language, Section } from '../../../core/models';

/**
 * Renders a `cards` section: optional title/subtitle followed by a responsive
 * grid of cards (image, title, rich-text body, optional link).
 */
@Component({
  selector: 'app-cards-renderer',
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
        <p class="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-10"></div>
      }

      <div class="stagger grid gap-6" [class]="gridCols()">
        @for (card of content().items; track card.id) {
          <div
            class="card-elevation group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            @if (imageUrl(card.imageUrl)) {
              <img
                [src]="imageUrl(card.imageUrl)"
                [alt]="resolveText(card.title, l)"
                class="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            }
            <div class="flex flex-1 flex-col gap-3 p-6" [class]="cardAlign()">
              @if (!imageUrl(card.imageUrl) && card.icon) {
                <div
                  class="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                  [style.background-color]="iconBg"
                  [style.color]="'var(--site-primary)'"
                >
                  <i [class]="card.icon" style="font-size: 1.6rem"></i>
                </div>
              }
              @if (resolveText(card.title, l)) {
                <h3 class="text-xl font-semibold text-surface-900">
                  {{ resolveText(card.title, l) }}
                </h3>
              }
              <div
                class="rich-text flex-1 text-surface-600"
                [attr.dir]="dir(l)"
                [innerHTML]="resolveText(card.body, l)"
              ></div>
              @if (card.link) {
                <a
                  [href]="card.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="focus-ring mt-1 inline-flex items-center gap-1 font-medium hover:underline"
                  [style.color]="'var(--site-primary)'"
                >
                  {{ resolveText(card.linkLabel, l) || (l === 'ar' ? 'اقرأ المزيد' : 'Learn more') }}
                  <i class="pi pi-arrow-right text-xs"></i>
                </a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CardsRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  readonly content = computed(() => this.section().content as CardsContent);

  /** Map the configured column count to responsive Tailwind grid classes. */
  readonly gridCols = computed(() => {
    switch (this.content().columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  });

  /** Tinted badge background derived from the brand primary. */
  readonly iconBg = 'color-mix(in srgb, var(--site-primary) 14%, white)';

  /** Card content alignment follows the section's alignment setting. */
  readonly cardAlign = computed(() =>
    this.section().settings?.align === 'left'
      ? 'items-start text-start'
      : 'items-center text-center',
  );

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
  imageUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
