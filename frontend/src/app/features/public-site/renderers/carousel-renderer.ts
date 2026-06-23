import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { CarouselContent, CarouselSlide, Language, Section } from '../../../core/models';

/**
 * Renders a `carousel` section: a single-slide carousel with previous/next
 * arrow controls and clickable dot indicators. The current slide shows a
 * cover image with a caption overlay, optionally wrapped in an external link.
 * When `autoplay` is enabled the carousel advances automatically every
 * `intervalMs`; the timer is started in the constructor and cleared on destroy.
 */
@Component({
  selector: 'app-carousel-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-5xl px-4">
      @if (resolveText(s.title, l)) {
        <h2
          class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(s.subtitle, l)) {
        <p class="mx-auto mb-8 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-8"></div>
      }

      @if (slides().length) {
        <div
          class="group relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg transition-shadow duration-300 hover:shadow-xl"
          [attr.dir]="dir(l)"
        >
          <!-- Stacked slides (cross-fade) -->
          <div class="relative aspect-[16/9] w-full">
            @for (slide of slides(); track slide.id; let i = $index) {
              <div
                class="absolute inset-0 transition-opacity duration-500 ease-out"
                [class]="
                  i === index() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                "
                [attr.aria-hidden]="i === index() ? null : 'true'"
              >
                @if (imageUrl(slide.imageUrl); as src) {
                  @if (slide.link) {
                    <a
                      [href]="slide.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block h-full w-full"
                    >
                      <img
                        [src]="src"
                        [alt]="resolveText(slide.caption, l)"
                        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  } @else {
                    <img
                      [src]="src"
                      [alt]="resolveText(slide.caption, l)"
                      class="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  }
                } @else {
                  <div
                    class="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-400"
                  >
                    <i class="pi pi-image text-6xl"></i>
                  </div>
                }

                <!-- Caption overlay -->
                @if (resolveText(slide.caption, l)) {
                  <div
                    class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 pt-16"
                  >
                    <p
                      class="text-lg font-semibold text-white drop-shadow-sm sm:text-2xl"
                      [attr.dir]="dir(l)"
                    >
                      {{ resolveText(slide.caption, l) }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Arrows -->
          @if (slides().length > 1) {
            <button
              type="button"
              (click)="prev()"
              class="absolute top-1/2 ltr:left-4 rtl:right-4 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur transition duration-300 hover:scale-110 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              [attr.aria-label]="lang() === 'ar' ? 'الشريحة السابقة' : 'Previous slide'"
            >
              <i class="pi pi-chevron-left text-lg rtl:rotate-180"></i>
            </button>
            <button
              type="button"
              (click)="next()"
              class="absolute top-1/2 ltr:right-4 rtl:left-4 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur transition duration-300 hover:scale-110 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              [attr.aria-label]="lang() === 'ar' ? 'الشريحة التالية' : 'Next slide'"
            >
              <i class="pi pi-chevron-right text-lg rtl:rotate-180"></i>
            </button>
          }

          <!-- Dots -->
          @if (slides().length > 1) {
            <div
              class="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2"
            >
              @for (slide of slides(); track slide.id; let i = $index) {
                <button
                  type="button"
                  (click)="goTo(i)"
                  class="h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  [class]="i === index() ? 'w-6' : 'w-2.5 bg-white/60 hover:scale-125 hover:bg-white/90'"
                  [style.background-color]="i === index() ? 'var(--site-primary)' : null"
                  [attr.aria-label]="
                    (lang() === 'ar' ? 'انتقل إلى الشريحة ' : 'Go to slide ') +
                    (i + 1)
                  "
                  [attr.aria-current]="i === index() ? 'true' : null"
                ></button>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Empty state -->
        <div
          class="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400"
        >
          <i class="pi pi-images text-5xl"></i>
          <p class="text-sm font-medium">
            {{ l === 'ar' ? 'لا توجد شرائح بعد' : 'No slides yet' }}
          </p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @media (prefers-reduced-motion: reduce) {
        :host ::ng-deep .transition-opacity {
          transition: none;
        }
      }
    `,
  ],
})
export class CarouselRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as CarouselContent,
  );

  /** Defensive slide list (never undefined). */
  protected readonly slides = computed<CarouselSlide[]>(
    () => this.content().slides ?? [],
  );

  /** Index of the currently visible slide. */
  protected readonly index = signal(0);

  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Keep the index valid when the slide list shrinks (e.g. live editing).
    effect(() => {
      const len = this.slides().length;
      if (len > 0 && this.index() >= len) {
        this.index.set(0);
      }
    });

    // Restart/stop autoplay whenever the relevant config changes.
    effect(() => {
      const c = this.content();
      this.stopAutoplay();
      if (c.autoplay && this.slides().length > 1) {
        const interval = c.intervalMs > 0 ? c.intervalMs : 5000;
        this.timer = setInterval(() => this.next(), interval);
      }
    });

    this.destroyRef.onDestroy(() => this.stopAutoplay());
  }

  protected next(): void {
    const len = this.slides().length;
    if (!len) return;
    this.index.update((i) => (i + 1) % len);
  }

  protected prev(): void {
    const len = this.slides().length;
    if (!len) return;
    this.index.update((i) => (i - 1 + len) % len);
  }

  protected goTo(i: number): void {
    this.index.set(i);
  }

  private stopAutoplay(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
  protected imageUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
