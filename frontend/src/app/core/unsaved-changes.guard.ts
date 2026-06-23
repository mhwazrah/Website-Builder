import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { AdminI18n } from './admin-i18n';

/**
 * Implemented by routed components that hold unsaved edits. The router guard
 * below asks the component whether it is safe to leave the current route.
 */
export interface CanComponentDeactivate {
  /** Return `true` when there is nothing unsaved and navigation may proceed. */
  canDeactivate(): boolean;
}

/**
 * Functional {@link CanDeactivateFn} guard. Allows navigation when the component
 * does not implement {@link CanComponentDeactivate} or reports no unsaved
 * changes; otherwise prompts the user with a generic bilingual confirmation and
 * returns their choice.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component,
) => {
  if (!component || typeof component.canDeactivate !== 'function') {
    return true;
  }
  if (component.canDeactivate()) {
    return true;
  }

  const i18n = inject(AdminI18n);
  return window.confirm(
    i18n.t(
      'You have unsaved changes. Leave this page and discard them?',
      'لديك تغييرات غير محفوظة. هل تريد مغادرة الصفحة وتجاهلها؟',
    ),
  );
};
