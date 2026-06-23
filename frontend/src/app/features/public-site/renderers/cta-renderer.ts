import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { CtaButton, CtaContent, Language, Section } from '../../../core/models';

/**
 * Renders a `cta` section: a centered call-to-action band sitting on a soft
 * brand-tinted gradient, with a large heading, supporting text and one
 * prominent button. The button style maps the same way as in the hero
 * section (primary / secondary / outline) using the site brand CSS vars.
 */
@Component({
  selector: 'app-cta-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = lang();
    @let c = content();
    <div
      class="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20"
      [attr.dir]="dir(l)"
      [style.background]="bandBackground()"
    >
      <!-- Soft decorative glows tinted with the brand colours. -->
      <div
        class="pointer-events-none absolute -top-24 ltr:-right-16 rtl:-left-16 h-72 w-72 rounded-full opacity-20 blur-3xl"
        [style.background]="'var(--site-primary)'"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-24 ltr:-left-16 rtl:-right-16 h-72 w-72 rounded-full opacity-20 blur-3xl"
        [style.background]="'var(--site-secondary)'"
        aria-hidden="true"
      ></div>

      <div class="relative mx-auto flex max-w-3xl flex-col items-center">
        @if (resolveText(c.heading, l)) {
          <h2
            class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            {{ resolveText(c.heading, l) }}
          </h2>
        }

        @if (resolveText(c.text, l)) {
          <p class="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            {{ resolveText(c.text, l) }}
          </p>
        }

        @if (button() && resolveText(button().label, l)) {
          <div class="mt-9">
            <a
              [href]="button().url || '#'"
              [target]="isExternal(button().url) ? '_blank' : null"
              [rel]="isExternal(button().url) ? 'noopener noreferrer' : null"
              class="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-8 py-3.5 text-base font-semibold shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              [class.border-2]="button().style === 'outline'"
              [style.background-color]="buttonBg()"
              [style.color]="buttonColor()"
              [style.border-color]="buttonBorder()"
            >
              <!-- Soft sheen that sweeps across on hover. -->
              <span
                class="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                aria-hidden="true"
              ></span>
              <span class="relative">{{ resolveText(button().label, l) }}</span>
              <i
                class="pi relative text-sm transition-transform duration-300 ease-out group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                [class.pi-arrow-right]="dir(l) === 'ltr'"
                [class.pi-arrow-left]="dir(l) === 'rtl'"
                aria-hidden="true"
              ></i>
            </a>
          </div>
        }
      </div>
    </div>
  `,
})
export class CtaRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as CtaContent,
  );

  /** The single call-to-action button (may be undefined in malformed data). */
  protected readonly button = computed<CtaButton>(
    () => this.content().button ?? ({ id: '', label: {}, url: '', style: 'primary' } as CtaButton),
  );

  /** A subtle brand-tinted gradient backing the whole band. */
  protected readonly bandBackground = computed(
    () =>
      'linear-gradient(135deg, ' +
      'color-mix(in srgb, var(--site-primary) 10%, white) 0%, ' +
      'color-mix(in srgb, var(--site-secondary) 8%, white) 100%)',
  );

  /** Background colour of the button based on its style. */
  protected readonly buttonBg = computed(() => {
    switch (this.button().style) {
      case 'secondary':
        return 'var(--site-secondary)';
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return 'var(--site-primary)';
    }
  });

  /** Text colour of the button based on its style. */
  protected readonly buttonColor = computed(() =>
    this.button().style === 'outline' ? 'var(--site-primary)' : '#ffffff',
  );

  /** Border colour of the button (only meaningful for the outline style). */
  protected readonly buttonBorder = computed(() =>
    this.button().style === 'outline' ? 'var(--site-primary)' : 'transparent',
  );

  /** True when the URL points off-site (so we open it in a new tab). */
  protected isExternal(url: string): boolean {
    return /^https?:\/\//i.test(url ?? '');
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
