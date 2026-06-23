import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { dir, resolveText } from '../../../core/i18n';
import { Language, MapContent, Section } from '../../../core/models';

/**
 * Renders a `map` section: a responsive embedded Google map shown inside a
 * sanitized iframe. The iframe `src` is built from the configured place
 * `query` and `zoom` level using the public `output=embed` endpoint (no API
 * key required) and trusted via {@link DomSanitizer}. The frame spans the full
 * width at the configured pixel `height`, with rounded corners and a soft
 * shadow, and an optional localized caption beneath it. When no query is set
 * a friendly placeholder with a map-marker icon is shown instead.
 */
@Component({
  selector: 'app-map-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-5xl px-4" [attr.dir]="dir(l)">
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

      @if (hasQuery()) {
        <figure
          class="overflow-hidden rounded-2xl bg-gray-100 shadow-lg ring-1 ring-black/5 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl hover:ring-black/10"
        >
          <iframe
            [src]="mapSrc()"
            class="w-full block border-0"
            [style.height.px]="frameHeight()"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            [title]="captionText() || mapTitle(l)"
            allowfullscreen
          ></iframe>

          @if (captionText()) {
            <figcaption
              class="px-4 py-3 text-center text-sm font-medium text-gray-600"
              [attr.dir]="dir(l)"
            >
              {{ captionText() }}
            </figcaption>
          }
        </figure>
      } @else {
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center text-gray-400"
          [style.min-height.px]="frameHeight()"
        >
          <span
            class="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <i
              class="pi pi-map-marker text-3xl"
              style="color: var(--site-primary)"
            ></i>
          </span>
          <p class="text-sm font-medium">
            {{ l === 'ar' ? 'لم يتم تحديد موقع بعد' : 'No location set yet' }}
          </p>
        </div>
      }
    </div>
  `,
})
export class MapRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  private readonly sanitizer = inject(DomSanitizer);

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as MapContent,
  );

  /** Trimmed place query; empty when unset. */
  protected readonly query = computed(() => (this.content().query ?? '').trim());

  /** Whether a place query has been provided. */
  protected readonly hasQuery = computed(() => this.query().length > 0);

  /** Iframe height in pixels, with a sensible default and floor. */
  protected readonly frameHeight = computed(() => {
    const h = Number(this.content().height);
    return Number.isFinite(h) && h > 0 ? h : 400;
  });

  /** Resolved caption for the active language. */
  protected readonly captionText = computed(() =>
    resolveText(this.content().caption, this.lang()),
  );

  /** Sanitized Google Maps embed URL built from the query + zoom. */
  protected readonly mapSrc = computed<SafeResourceUrl>(() => {
    const z = Number(this.content().zoom);
    const zoom = Number.isFinite(z) && z > 0 ? Math.round(z) : 14;
    const url = `https://www.google.com/maps?q=${encodeURIComponent(
      this.query(),
    )}&z=${zoom}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  /** Fallback iframe title when no caption is set. */
  protected mapTitle(l: Language): string {
    return l === 'ar' ? 'خريطة الموقع' : 'Location map';
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
