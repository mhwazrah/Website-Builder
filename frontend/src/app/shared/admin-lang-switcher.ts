import { Component, inject } from '@angular/core';
import { AdminI18n } from '../core/admin-i18n';

/** Toggles the builder/admin UI language between English and Arabic. */
@Component({
  selector: 'app-admin-lang-switcher',
  template: `
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition hover:bg-surface-50"
      (click)="i18n.toggle()"
      [attr.aria-label]="
        i18n.t('Switch to Arabic', 'التبديل إلى الإنجليزية')
      "
    >
      <i class="pi pi-globe text-xs"></i>
      {{ i18n.t('العربية', 'English') }}
    </button>
  `,
})
export class AdminLangSwitcher {
  protected readonly i18n = inject(AdminI18n);
}
