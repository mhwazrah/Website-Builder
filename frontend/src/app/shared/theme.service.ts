import { Injectable } from '@angular/core';
import { googleFontUrl } from '../core/fonts';

/**
 * Applies a site's brand colours and web font as CSS custom properties so both
 * the builder preview and the public renderer can theme themselves via
 * `var(--site-*)`. Google Fonts are injected lazily (one <link> per family,
 * with a one-time preconnect) and exposed as `--site-font`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  apply(
    primary: string,
    secondary: string,
    target: HTMLElement = document.documentElement,
  ): void {
    target.style.setProperty('--site-primary', primary);
    target.style.setProperty('--site-secondary', secondary);
  }

  /**
   * Set the site font. Loads the Google Font stylesheet on demand and exposes
   * the family as `--site-font` (consumed by the `.site-font` containers). Pass
   * a falsy family to clear it (falls back to the default UI font).
   */
  applyFont(
    family: string | null | undefined,
    target: HTMLElement = document.documentElement,
  ): void {
    if (family) {
      this.loadGoogleFont(family);
      target.style.setProperty(
        '--site-font',
        `'${family}', system-ui, sans-serif`,
      );
    } else {
      target.style.removeProperty('--site-font');
    }
  }

  /** Maximum corner radius (px) the 100% setting maps to. */
  private static readonly MAX_RADIUS_PX = 32;

  /**
   * Set the global corner radius from a 0–100 percentage, exposed as
   * `--site-radius` (consumed by the `.site-font` radius rules). Null/undefined
   * falls back to the 50% default so the whole site shares one corner style.
   */
  applyRadius(
    percent: number | null | undefined,
    target: HTMLElement = document.documentElement,
  ): void {
    const pct = Math.min(100, Math.max(0, percent ?? 50));
    const px = Math.round((pct / 100) * ThemeService.MAX_RADIUS_PX);
    target.style.setProperty('--site-radius', `${px}px`);
  }

  /** Inject the Google Fonts stylesheet for `family` once (idempotent). */
  private loadGoogleFont(family: string): void {
    const id = 'gf-' + family.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;

    if (!document.getElementById('gf-preconnect')) {
      const pc1 = document.createElement('link');
      pc1.id = 'gf-preconnect';
      pc1.rel = 'preconnect';
      pc1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pc1);
      const pc2 = document.createElement('link');
      pc2.rel = 'preconnect';
      pc2.href = 'https://fonts.gstatic.com';
      pc2.crossOrigin = 'anonymous';
      document.head.appendChild(pc2);
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontUrl(family);
    document.head.appendChild(link);
  }

  reset(target: HTMLElement = document.documentElement): void {
    target.style.removeProperty('--site-primary');
    target.style.removeProperty('--site-secondary');
    target.style.removeProperty('--site-font');
    target.style.removeProperty('--site-radius');
  }
}
