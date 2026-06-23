import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dir } from '../../../core/i18n';
import { Language, SocialLink } from '../../../core/models';
import { socialIcon } from '../../../core/social';

/** A social link resolved with its display icon, ready for the template. */
interface ResolvedSocialLink {
  id: string;
  url: string;
  platform: string;
  icon: string;
  label: string;
}

/**
 * Renders a `social` section: a centered, wrapping row of round icon buttons,
 * one per site-wide social link (the same list the footer uses — passed in via
 * {@link socialLinks}). Each button opens in a new tab; links with an empty URL
 * are skipped. Buttons tint to the site primary colour on hover/focus. Renders
 * nothing when there are no usable links.
 */
@Component({
  selector: 'app-social-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = lang();
    @let items = links();
    @if (items.length) {
      <div
        class="stagger flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4"
        [attr.dir]="dir(l)"
      >
        @for (item of items; track item.id) {
          <a
            [href]="item.url"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="item.label"
            [title]="item.label"
            class="social-btn group inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm ring-1 ring-gray-200 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:text-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-14 sm:w-14"
          >
            <i [class]="item.icon" class="text-xl sm:text-2xl"></i>
          </a>
        }
      </div>
    }
  `,
  styles: [
    `
      .social-btn:hover,
      .social-btn:focus-visible {
        background-color: var(--site-primary);
        border-color: var(--site-primary);
      }
      .social-btn {
        --tw-ring-color: var(--site-primary);
      }
    `,
  ],
})
export class SocialRenderer {
  readonly lang = input.required<Language>();
  /** Site-wide social links (shared with the footer). */
  readonly socialLinks = input<SocialLink[]>([]);

  /** Usable links (non-empty URL) resolved with their icon + label. */
  protected readonly links = computed<ResolvedSocialLink[]>(() => {
    return (this.socialLinks() ?? [])
      .filter((link: SocialLink) => !!link.url && link.url.trim().length > 0)
      .map((link: SocialLink) => {
        const platform = (link.platform ?? '').toLowerCase();
        return {
          id: link.id,
          url: link.url,
          platform,
          icon: socialIcon(platform),
          label: this.labelFor(platform),
        };
      });
  });

  /** Accessible label for a platform, bilingual where it matters. */
  private labelFor(platform: string): string {
    if (!platform) return this.lang() === 'ar' ? 'رابط' : 'Link';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  // Expose helper to the template.
  protected readonly dir = dir;
}
