import { Injectable, computed, effect, signal } from '@angular/core';

export type AdminLang = 'en' | 'ar';
const STORAGE_KEY = 'wb-admin-lang';

/**
 * Runtime bilingual support for the BUILDER/admin UI (separate from the content
 * language of the sites being built). Components call `t(en, ar)` at each string
 * site — no central dictionary, so translations live next to their usage and the
 * choice updates instantly when `lang` changes.
 */
@Injectable({ providedIn: 'root' })
export class AdminI18n {
  readonly lang = signal<AdminLang>(this.read());
  readonly dir = computed<'rtl' | 'ltr'>(() =>
    this.lang() === 'ar' ? 'rtl' : 'ltr',
  );
  readonly isAr = computed(() => this.lang() === 'ar');

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, this.lang());
      } catch {
        /* ignore storage errors */
      }
    });
  }

  set(lang: AdminLang): void {
    this.lang.set(lang);
  }

  toggle(): void {
    this.lang.set(this.lang() === 'ar' ? 'en' : 'ar');
  }

  /** Pick the string for the active admin language. */
  t(en: string, ar: string): string {
    return this.lang() === 'ar' ? ar : en;
  }

  private read(): AdminLang {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }
}
