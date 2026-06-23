import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { EmailContent, Language, Section } from '../../../core/models';

/**
 * Renders an `email` section: a centered block with a rich-text description and
 * a prominent mailto button (pre-filled subject) styled with the site primary
 * colour. Renders nothing when no email address is configured.
 */
@Component({
  selector: 'app-email-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = lang();
    @let c = content();
    @if (c.email) {
      <div class="mx-auto max-w-2xl px-4 text-center" [attr.dir]="dir(l)">
        @if (resolveText(c.description, l)) {
          <div
            class="rich-text mb-8 text-gray-600"
            [attr.dir]="dir(l)"
            [innerHTML]="resolveText(c.description, l)"
          ></div>
        }

        <a
          [href]="mailtoHref()"
          class="group inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          [style.background-color]="'var(--site-primary)'"
          [style.--tw-ring-color]="'var(--site-primary)'"
        >
          <i
            class="pi pi-envelope transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
          ></i>
          {{ buttonLabel() }}
        </a>
      </div>
    }
  `,
})
export class EmailRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as EmailContent,
  );

  /** `mailto:` link with an encoded, pre-filled subject line. */
  protected readonly mailtoHref = computed(() => {
    const c = this.content();
    const subject = resolveText(c.subject, this.lang());
    const base = `mailto:${c.email}`;
    return subject
      ? `${base}?subject=${encodeURIComponent(subject)}`
      : base;
  });

  /** Button text, falling back to a sensible bilingual default. */
  protected readonly buttonLabel = computed(() => {
    const label = resolveText(this.content().label, this.lang());
    if (label) return label;
    return this.lang() === 'ar' ? 'راسلنا عبر البريد' : 'Send us an email';
  });

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
