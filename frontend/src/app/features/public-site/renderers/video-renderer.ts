import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { Language, Section, VideoContent } from '../../../core/models';

/**
 * Renders a `video` section: a responsive 16:9 player with an optional caption
 * beneath it. YouTube and Vimeo are embedded via a sanitized <iframe> built from
 * the parsed video id; self-hosted files use a native <video controls> element.
 * Blank or unparseable URLs fall back to a subtle placeholder.
 */
@Component({
  selector: 'app-video-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    @let c = content();
    <div class="mx-auto max-w-4xl px-4" [attr.dir]="dir(l)">
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

      <figure class="m-0">
        <div
          class="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/10 transition-shadow duration-300 hover:shadow-2xl"
        >
          @if (embedUrl()) {
            <iframe
              class="absolute inset-0 h-full w-full"
              [src]="embedUrl()"
              [title]="resolveText(c.caption, l) || (l === 'ar' ? 'فيديو' : 'Video')"
              frameborder="0"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          } @else if (fileUrl()) {
            <video
              class="absolute inset-0 h-full w-full bg-black"
              [src]="fileUrl()!"
              controls
              playsinline
              preload="metadata"
            ></video>
          } @else {
            <div
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100 text-gray-400"
            >
              <span
                class="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:scale-110"
              >
                <i class="pi pi-play text-2xl" style="color: var(--site-primary)"></i>
              </span>
              <p class="text-sm">
                {{ l === 'ar' ? 'لا يوجد فيديو بعد' : 'No video yet' }}
              </p>
            </div>
          }
        </div>

        @if (resolveText(c.caption, l)) {
          <figcaption
            class="mt-4 text-center text-sm text-gray-600"
            [attr.dir]="dir(l)"
          >
            {{ resolveText(c.caption, l) }}
          </figcaption>
        }
      </figure>
    </div>
  `,
})
export class VideoRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  private readonly sanitizer = inject(DomSanitizer);

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as VideoContent,
  );

  /**
   * Sanitized embed URL for YouTube/Vimeo, or `null` when the provider is
   * `file` or the URL cannot be parsed into a video id.
   */
  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const c = this.content();
    const url = (c.url ?? '').trim();
    if (!url) return null;

    if (c.provider === 'youtube') {
      const id = this.youtubeId(url);
      return id
        ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${id}`,
          )
        : null;
    }

    if (c.provider === 'vimeo') {
      const id = this.vimeoId(url);
      return id
        ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://player.vimeo.com/video/${id}`,
          )
        : null;
    }

    return null;
  });

  /** Absolute URL for a self-hosted video file, or `null`. */
  protected readonly fileUrl = computed<string | null>(() => {
    const c = this.content();
    if (c.provider !== 'file') return null;
    return assetUrl((c.url ?? '').trim());
  });

  /** Parse a YouTube video id from watch?v=, youtu.be/, /embed/ or a bare id. */
  private youtubeId(url: string): string | null {
    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /\/embed\/([A-Za-z0-9_-]{6,})/,
      /\/shorts\/([A-Za-z0-9_-]{6,})/,
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) return m[1];
    }
    // Bare id fallback (no slashes, no scheme).
    if (/^[A-Za-z0-9_-]{6,}$/.test(url)) return url;
    return null;
  }

  /** Parse a Vimeo numeric id from a player or share URL, or a bare id. */
  private vimeoId(url: string): string | null {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return m[1];
    if (/^\d+$/.test(url)) return url;
    return null;
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
