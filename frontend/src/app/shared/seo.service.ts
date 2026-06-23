import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { assetUrl } from '../core/config';
import { resolveText } from '../core/i18n';
import { Language, Site } from '../core/models';

/**
 * Sets per-site SEO: document <title>, meta description, Open Graph / Twitter
 * tags, and the favicon (derived from the site's favicon or light logo).
 * Client-side only — sufficient for sharing/bookmarks; SSR would be needed for
 * crawler-time meta.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  applyForSite(site: Site, lang: Language): void {
    const title = resolveText(site.metaTitle, lang) || site.name;
    const description = resolveText(site.metaDescription, lang);

    this.title.setTitle(title);
    this.setName('description', description);
    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    this.setProperty('og:type', 'website');

    const ogImage = assetUrl(site.logoLightUrl ?? site.logoDarkUrl);
    if (ogImage) this.setProperty('og:image', ogImage);
    this.setName('twitter:card', 'summary');

    const favicon = assetUrl(site.faviconUrl) ?? assetUrl(site.logoLightUrl);
    if (favicon) this.setFavicon(favicon);

    this.doc.documentElement.lang = lang;
  }

  /** Restore the builder/admin default title. */
  reset(): void {
    this.title.setTitle('Website Builder');
  }

  private setName(name: string, content: string): void {
    if (content) this.meta.updateTag({ name, content });
    else this.meta.removeTag(`name='${name}'`);
  }

  private setProperty(property: string, content: string): void {
    if (content) this.meta.updateTag({ property, content });
    else this.meta.removeTag(`property='${property}'`);
  }

  private setFavicon(href: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'icon');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
