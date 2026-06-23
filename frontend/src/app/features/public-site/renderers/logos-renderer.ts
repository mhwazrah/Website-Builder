import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { Language, LogosContent, Section } from '../../../core/models';

/**
 * Renders a `logos` section: an optional title/subtitle followed by a
 * centered, wrapping row of logo images. When `grayscale` is on, logos are
 * de-saturated and dimmed, brightening to full colour on hover. Logos with a
 * `url` are wrapped in an anchor that opens in a new tab.
 */
@Component({
  selector: 'app-logos-renderer',
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

      @if (visibleLogos().length) {
        <div class="stagger flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
          @for (logo of visibleLogos(); track logo.id) {
            @if (logo.url) {
              <a
                [href]="logo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex shrink-0 items-center justify-center transition hover:-translate-y-0.5"
                [attr.aria-label]="resolveText(logo.alt, l)"
              >
                <img
                  [src]="imageUrl(logo.imageUrl)"
                  [alt]="resolveText(logo.alt, l)"
                  loading="lazy"
                  decoding="async"
                  class="h-10 w-auto max-w-[10rem] object-contain transition duration-300 sm:h-12"
                  [class]="imageClasses()"
                />
              </a>
            } @else {
              <div class="group flex shrink-0 items-center justify-center">
                <img
                  [src]="imageUrl(logo.imageUrl)"
                  [alt]="resolveText(logo.alt, l)"
                  loading="lazy"
                  decoding="async"
                  class="h-10 w-auto max-w-[10rem] object-contain transition duration-300 sm:h-12"
                  [class]="imageClasses()"
                />
              </div>
            }
          }
        </div>
      } @else {
        <div
          class="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-6 py-12 text-center"
        >
          <i class="pi pi-images text-3xl text-surface-300"></i>
          <p class="text-sm text-surface-500">
            {{
              l === 'ar'
                ? 'لا توجد شعارات بعد — أضف شعارات لعرضها هنا.'
                : 'No logos yet — add some to show them here.'
            }}
          </p>
        </div>
      }
    </div>
  `,
})
export class LogosRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  readonly content = computed(() => this.section().content as LogosContent);

  /** Only logos that actually have an image to display. */
  readonly visibleLogos = computed(() =>
    (this.content().logos ?? []).filter((logo) => !!logo.imageUrl),
  );

  /** Grayscale + dim with a clean-on-hover effect when enabled. */
  readonly imageClasses = computed(() =>
    this.content().grayscale
      ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
      : '',
  );

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
  imageUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
