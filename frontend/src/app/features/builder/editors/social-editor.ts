import { Component, inject, input, model } from '@angular/core';
import { Language, SocialContent } from '../../../core/models';
import { AdminI18n } from '../../../core/admin-i18n';
import { SocialLinksEditor } from '../../../shared/social-links-editor';

/**
 * Per-type editor for a `social` section. The links are SITE-WIDE (the single
 * source shared with the footer), so this simply embeds the reusable
 * {@link SocialLinksEditor}; the section's own content is no longer used.
 */
@Component({
  selector: 'app-social-editor',
  imports: [SocialLinksEditor],
  template: `
    <div class="flex flex-col gap-3">
      <p class="text-sm text-gray-500">
        {{
          i18n.t(
            'These social links are shared site-wide — the same set is shown in the footer, and edits here appear there too.',
            'روابط التواصل هذه مشتركة على مستوى الموقع — تظهر نفس المجموعة في التذييل، والتعديلات هنا تظهر هناك أيضاً.'
          )
        }}
      </p>
      <app-social-links-editor />
    </div>
  `,
})
export class SocialEditor {
  protected readonly i18n = inject(AdminI18n);
  // Kept to satisfy the section-form binding; the social section no longer
  // stores its own links (they live site-wide on the store).
  readonly content = model.required<SocialContent>();
  readonly languages = input.required<Language[]>();
}
