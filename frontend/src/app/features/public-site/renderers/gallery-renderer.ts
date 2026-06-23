import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { GalleryContent, Language, Section } from '../../../core/models';

/**
 * Renders a `gallery` section: optional title/subtitle followed by a responsive
 * image grid (2/3/4 columns). Each image is shown in a fixed square aspect with
 * `object-cover`, rounded corners, and an optional caption rendered as a subtle
 * gradient overlay that reveals on hover. Falls back to a graceful empty state.
 */
@Component({
  selector: 'app-gallery-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-6xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2
          class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
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

      @if (images().length) {
        <div class="stagger grid gap-4" [class]="gridCols()">
          @for (image of images(); track image.id) {
            <figure
              class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5 aspect-square"
            >
              @if (imageUrl(image.url)) {
                <img
                  [src]="imageUrl(image.url)"
                  [alt]="resolveText(image.caption, l)"
                  class="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              } @else {
                <div
                  class="flex h-full w-full items-center justify-center text-gray-300"
                >
                  <i class="pi pi-image text-5xl"></i>
                </div>
              }

              @if (resolveText(image.caption, l)) {
                <figcaption
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  [attr.dir]="dir(l)"
                >
                  {{ resolveText(image.caption, l) }}
                </figcaption>
              }
            </figure>
          }
        </div>
      } @else {
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center"
        >
          <i class="pi pi-images text-4xl text-gray-300"></i>
          <p class="text-sm text-gray-600">
            {{ l === 'ar' ? 'لا توجد صور بعد' : 'No images yet' }}
          </p>
        </div>
      }
    </div>
  `,
})
export class GalleryRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as GalleryContent,
  );

  /** Image list, guarded against missing content. */
  protected readonly images = computed(() => this.content().images ?? []);

  /** Map the configured column count to responsive Tailwind grid classes. */
  protected readonly gridCols = computed(() => {
    switch (this.content().columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  });

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
  protected imageUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
