import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { CtaButton, HeroContent, Language, Section } from '../../../core/models';

/**
 * Renders a `hero` section: a tall banner with a large headline, subheadline and
 * a row of call-to-action buttons. When an image is set it is used as a cover
 * background (with an optional dark overlay); otherwise a brand gradient built
 * from the site's primary/secondary colours is used. Text is white over both.
 */
@Component({
  selector: 'app-hero-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = lang();
    @let c = content();
    <div
      class="relative isolate flex min-h-[28rem] w-full overflow-hidden bg-gray-900 md:min-h-[34rem] lg:min-h-[38rem]"
      [style]="heroStyle()"
    >
      <!-- Dark overlay over the cover image -->
      @if (bgUrl() && c.overlay) {
        <div class="absolute inset-0 bg-black/55"></div>
      }

      <!-- Soft decorative glow that gently floats. -->
      <div
        class="anim-float pointer-events-none absolute -top-20 end-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      ></div>

      <div
        class="stagger relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-6 px-6 py-16 sm:px-10 md:px-14 lg:px-20"
        [class.items-center]="c.align === 'center'"
        [class.text-center]="c.align === 'center'"
        [class.items-start]="c.align === 'left'"
        [class.text-start]="c.align === 'left'"
        [attr.dir]="dir(l)"
      >
        @if (resolveText(c.headline, l)) {
          <h1
            class="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl"
          >
            {{ resolveText(c.headline, l) }}
          </h1>
        }

        @if (resolveText(c.subheadline, l)) {
          <p
            class="max-w-2xl text-lg font-medium leading-relaxed text-white/90 drop-shadow-sm sm:text-xl"
          >
            {{ resolveText(c.subheadline, l) }}
          </p>
        }

        @if (c.buttons.length) {
          <div
            class="mt-2 flex flex-wrap gap-4"
            [class.justify-center]="c.align === 'center'"
            [class.justify-start]="c.align === 'left'"
          >
            @for (btn of c.buttons; track btn.id) {
              <a
                [href]="btn.url || '#'"
                [attr.target]="isExternal(btn.url) ? '_blank' : null"
                [attr.rel]="isExternal(btn.url) ? 'noopener noreferrer' : null"
                (click)="onButtonClick($event, btn.url)"
                class="inline-flex items-center justify-center rounded-lg px-7 py-3 text-base font-semibold shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                [class.border]="btn.style === 'outline'"
                [class.border-2]="btn.style === 'outline'"
                [class.border-white]="btn.style === 'outline'"
                [class.bg-transparent]="btn.style === 'outline'"
                [class.text-white]="btn.style !== 'secondary'"
                [style]="buttonStyle(btn)"
              >
                {{ resolveText(btn.label, l) || (l === 'ar' ? 'زر' : 'Button') }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class HeroRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as HeroContent,
  );

  /** Resolved absolute cover-image URL, or null when none is configured. */
  protected readonly bgUrl = computed(() => assetUrl(this.content().imageUrl));

  /**
   * Single background style: the cover image when one is set, otherwise a brand
   * gradient. (Combined into one binding so an empty image doesn't clobber the
   * gradient.)
   */
  protected readonly heroStyle = computed(() => {
    const url = this.bgUrl();
    const image = url
      ? `url("${url}")`
      : 'linear-gradient(135deg, var(--site-primary), var(--site-secondary))';
    return `background-image: ${image}; background-size: cover; background-position: center;`;
  });

  /** Map a button's style to inline brand colours / borders. */
  protected buttonStyle(btn: CtaButton): string {
    switch (btn.style) {
      case 'secondary':
        return 'background: var(--site-secondary); color: #ffffff;';
      case 'outline':
        return 'background: transparent; color: #ffffff;';
      case 'primary':
      default:
        return 'background: var(--site-primary); color: #ffffff;';
    }
  }

  /** Absolute (http/https) URLs open in a new tab; in-page anchors do not. */
  protected isExternal(url: string | undefined): boolean {
    return !!url && /^https?:\/\//i.test(url);
  }

  /** Smooth-scroll to an in-page anchor target instead of navigating. */
  protected onButtonClick(event: MouseEvent, url: string | undefined): void {
    if (!url) return;
    const hash = url.indexOf('#');
    if (hash < 0) return;
    const id = url.slice(hash + 1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    event.preventDefault();
    el.classList.remove('reveal-init');
    el.classList.add('reveal-in');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
