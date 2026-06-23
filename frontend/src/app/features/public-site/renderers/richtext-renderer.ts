import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { Language, RichTextContent, Section } from '../../../core/models';

/**
 * Renders a centred prose block of Quill HTML. The body is injected via
 * `[innerHTML]` inside a `.rich-text` container (typography styles come from the
 * global `rich-text` stylesheet) and constrained to one of three readable
 * measures. Arabic flips to RTL.
 */
@Component({
  selector: 'app-richtext-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    @let c = content();
    <div class="stagger px-4">
      @if (resolveText(s.title, l)) {
        <h2 class="mb-2 text-center text-3xl font-bold text-gray-900">
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(s.subtitle, l)) {
        <p class="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-8"></div>
      }

      @if (resolveText(c.body, l)) {
        <div
          class="rich-text mx-auto leading-relaxed text-gray-700"
          [class]="widthClass()"
          [attr.dir]="dir(l)"
          [innerHTML]="resolveText(c.body, l)"
        ></div>
      } @else {
        <div
          class="mx-auto rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-sm text-gray-400"
          [class]="widthClass()"
        >
          {{
            lang() === 'ar'
              ? 'محتوى النص المنسق يظهر هنا.'
              : 'Rich text content goes here.'
          }}
        </div>
      }
    </div>
  `,
})
export class RichTextRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  readonly content = computed(
    () => this.section().content as RichTextContent,
  );

  /** Map the chosen measure to a Tailwind max-width utility. */
  readonly widthClass = computed(() => {
    switch (this.content().maxWidth) {
      case 'narrow':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-5xl';
      case 'normal':
      default:
        return 'max-w-3xl';
    }
  });

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
}
