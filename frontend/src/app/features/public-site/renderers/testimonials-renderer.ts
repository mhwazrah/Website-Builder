import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import {
  Language,
  Section,
  TestimonialItem,
  TestimonialsContent,
} from '../../../core/models';

/**
 * Renders a `testimonials` section: optional title/subtitle followed by a
 * responsive grid (1/2/3 columns) of quote cards. Each card shows a quotation
 * accent in the brand colour, the quote, a 0–5 star rating, a round avatar
 * (with an initial fallback), and the author's name + role.
 */
@Component({
  selector: 'app-testimonials-renderer',
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
        @for (item of content().items; track item.id) {
          <figure
            class="card-elevation relative flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-7 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            <!-- Quotation mark accent -->
            <span
              class="pointer-events-none absolute top-4 select-none text-6xl leading-none opacity-15 ltr:right-6 rtl:left-6"
              style="color: var(--site-primary)"
              aria-hidden="true"
              >&ldquo;</span
            >

            <!-- Star rating -->
            <div
              class="mb-4 flex items-center gap-1"
              [attr.aria-label]="ariaRating(item.rating)"
            >
              @for (star of stars(item.rating); track $index) {
                <i
                  [class]="star ? 'pi pi-star-fill' : 'pi pi-star'"
                  class="text-sm"
                  [style.color]="star ? 'var(--site-primary)' : '#d1d5db'"
                ></i>
              }
            </div>

            <!-- Quote -->
            @if (resolveText(item.quote, l)) {
              <blockquote
                class="relative flex-1 text-base leading-relaxed text-gray-700"
              >
                {{ resolveText(item.quote, l) }}
              </blockquote>
            }

            <!-- Author -->
            <figcaption class="mt-6 flex items-center gap-3">
              @if (avatarUrl(item.avatarUrl)) {
                <img
                  [src]="avatarUrl(item.avatarUrl)"
                  [alt]="resolveText(item.author, l)"
                  class="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
                  loading="lazy"
                  decoding="async"
                />
              } @else {
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style="background: var(--site-primary)"
                  aria-hidden="true"
                  >{{ initial(item, l) }}</span
                >
              }
              <span class="flex min-w-0 flex-col">
                @if (resolveText(item.author, l)) {
                  <span class="truncate font-semibold text-gray-900">
                    {{ resolveText(item.author, l) }}
                  </span>
                }
                @if (resolveText(item.role, l)) {
                  <span class="truncate text-sm text-gray-600">
                    {{ resolveText(item.role, l) }}
                  </span>
                }
              </span>
            </figcaption>
          </figure>
        }
      </div>
    </div>
  `,
})
export class TestimonialsRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as TestimonialsContent,
  );

  /** Map the configured column count to responsive Tailwind grid classes. */
  protected readonly gridCols = computed(() => {
    switch (this.content().columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  });

  /** Build a fixed 5-slot boolean array (filled/empty) for a rating. */
  protected stars(rating: number): boolean[] {
    const filled = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
    return Array.from({ length: 5 }, (_, i) => i < filled);
  }

  protected ariaRating(rating: number): string {
    const filled = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
    return `${filled} / 5`;
  }

  /** First character of the author name, for the avatar fallback. */
  protected initial(item: TestimonialItem, l: Language): string {
    const name = resolveText(item.author, l).trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
  protected avatarUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
