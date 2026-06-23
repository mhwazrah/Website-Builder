import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { Language, Section, WhatsappContent } from '../../../core/models';

/**
 * Renders a `whatsapp` section as a click-to-chat link.
 *
 * The href is built as `https://wa.me/<digits-only phone>?text=<encoded message>`.
 * When `floating` is true it renders a fixed, RTL-aware round green button pinned
 * to the bottom-end corner; otherwise it renders a centered inline pill button
 * carrying the localized label. When `phone` is empty nothing is rendered.
 */
@Component({
  selector: 'app-whatsapp-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = lang();
    @let c = content();
    @let ar = l === 'ar';
    @let href = whatsappHref();

    @if (href) {
      @if (c.floating) {
        <!-- Floating action button, pinned bottom-end (RTL-aware). -->
        <a
          [href]="href"
          target="_blank"
          rel="noopener noreferrer"
          [attr.dir]="dir(l)"
          [attr.aria-label]="
            resolveText(c.label, l) || (ar ? 'تواصل عبر واتساب' : 'Chat on WhatsApp')
          "
          [title]="
            resolveText(c.label, l) || (ar ? 'تواصل عبر واتساب' : 'Chat on WhatsApp')
          "
          class="group fixed bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-black/5 transition duration-300 ease-out hover:scale-110 hover:bg-[#1ebe5d] hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          [class.right-5]="!ar"
          [class.left-5]="ar"
        >
          <i
            class="pi pi-whatsapp text-2xl transition-transform duration-300 ease-out group-hover:scale-110"
          ></i>
          <span
            class="pointer-events-none absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30"
          ></span>
        </a>
      } @else {
        <!-- Inline centered pill button with icon + label. -->
        <div class="flex justify-center px-4" [attr.dir]="dir(l)">
          <a
            [href]="href"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="
              resolveText(c.label, l) || (ar ? 'تواصل عبر واتساب' : 'Chat on WhatsApp')
            "
            class="inline-flex items-center gap-2.5 rounded-lg bg-[#25D366] px-6 py-3 text-base font-semibold text-white shadow-md transition duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#1ebe5d] hover:shadow-lg active:translate-y-0 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          >
            <i class="pi pi-whatsapp text-xl"></i>
            <span>
              {{
                resolveText(c.label, l) || (ar ? 'تواصل عبر واتساب' : 'Chat on WhatsApp')
              }}
            </span>
          </a>
        </div>
      }
    }
  `,
})
export class WhatsappRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as WhatsappContent,
  );

  /**
   * Build the wa.me click-to-chat link. Returns `null` when no phone is set so
   * the template renders nothing. The phone is reduced to digits only and the
   * prefilled message is URL-encoded.
   */
  protected readonly whatsappHref = computed<string | null>(() => {
    const c = this.content();
    const digits = (c.phone ?? '').replace(/\D/g, '');
    if (!digits) return null;
    const message = resolveText(c.message, this.lang());
    const query = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${digits}${query}`;
  });

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
