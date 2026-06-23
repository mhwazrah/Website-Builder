import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { FeaturesContent, Language, Section } from '../../../core/models';

/**
 * Renders a `features` section as a stack of horizontal media rows: each item
 * shows an image (or a tinted icon fallback) on the leading side and its
 * title + rich-text body on the other. The image side follows the reading
 * direction — left in LTR, right in RTL — purely via the container `dir` and
 * `flex-row` (the main-axis start flips with direction). On narrow screens the
 * row stacks vertically (image on top) so nothing is squished. This deliberately
 * contrasts with the `cards` section's icon-on-top grid.
 */
@Component({
  selector: 'app-features-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    @let c = content();
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

      <div class="stagger mx-auto flex max-w-5xl flex-col gap-6">
        @for (item of c.items; track item.id) {
          <article
            class="card-elevation group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg sm:flex-row"
          >
            <!-- Media side (leading edge: left in LTR, right in RTL). -->
            @if (mediaUrl(item.imageUrl)) {
              <div class="shrink-0 sm:w-2/5">
                <img
                  [src]="mediaUrl(item.imageUrl)"
                  [alt]="resolveText(item.title, l) || (l === 'ar' ? 'صورة الميزة' : 'Feature image')"
                  class="h-56 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 sm:h-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            } @else {
              <div
                class="flex h-44 shrink-0 items-center justify-center sm:h-auto sm:w-2/5"
                [style.background-color]="iconPanelBg"
              >
                <i
                  [class]="(item.icon || 'pi pi-star') + ' text-5xl'"
                  [style.color]="'var(--site-primary)'"
                  aria-hidden="true"
                ></i>
              </div>
            }

            <!-- Text side. Always start-aligned so it hugs the image edge,
                 regardless of the section's center setting. -->
            <div class="flex flex-1 flex-col justify-center gap-2 p-6 text-start sm:p-8">
              @if (resolveText(item.title, l)) {
                <h3 class="text-xl font-semibold text-gray-900 sm:text-2xl">
                  {{ resolveText(item.title, l) }}
                </h3>
              }
              <div
                class="rich-text text-gray-600"
                [attr.dir]="dir(l)"
                [innerHTML]="resolveText(item.body, l)"
              ></div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class FeaturesRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  readonly content = computed(() => this.section().content as FeaturesContent);

  /** Tinted icon-panel background; mixes with the themed surface so it adapts
   * in dark mode. */
  readonly iconPanelBg =
    'color-mix(in srgb, var(--site-primary) 10%, var(--site-surface, #fff))';

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
  mediaUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
