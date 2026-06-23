import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Language, Section, SocialLink } from '../../core/models';
import { RevealDirective } from '../../shared/reveal.directive';

import { HeroRenderer } from './renderers/hero-renderer';
import { CardsRenderer } from './renderers/cards-renderer';
import { FeaturesRenderer } from './renderers/features-renderer';
import { AccordionRenderer } from './renderers/accordion-renderer';
import { GalleryRenderer } from './renderers/gallery-renderer';
import { CarouselRenderer } from './renderers/carousel-renderer';
import { TestimonialsRenderer } from './renderers/testimonials-renderer';
import { StatsRenderer } from './renderers/stats-renderer';
import { CtaRenderer } from './renderers/cta-renderer';
import { RichTextRenderer } from './renderers/richtext-renderer';
import { ContactRenderer } from './renderers/contact-renderer';
import { SocialRenderer } from './renderers/social-renderer';
import { WhatsappRenderer } from './renderers/whatsapp-renderer';
import { EmailRenderer } from './renderers/email-renderer';
import { PricingRenderer } from './renderers/pricing-renderer';
import { TeamRenderer } from './renderers/team-renderer';
import { LogosRenderer } from './renderers/logos-renderer';
import { VideoRenderer } from './renderers/video-renderer';
import { MapRenderer } from './renderers/map-renderer';
import { StepsRenderer } from './renderers/steps-renderer';

/**
 * Wraps a single section in its chrome (anchor id, vertical padding, background,
 * text alignment, centered container) and dispatches to the per-type renderer.
 * Add a new section type by importing its renderer and adding a `@case` below.
 */
@Component({
  selector: 'app-section-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RevealDirective,
    HeroRenderer,
    CardsRenderer,
    FeaturesRenderer,
    AccordionRenderer,
    GalleryRenderer,
    CarouselRenderer,
    TestimonialsRenderer,
    StatsRenderer,
    CtaRenderer,
    RichTextRenderer,
    ContactRenderer,
    SocialRenderer,
    WhatsappRenderer,
    EmailRenderer,
    PricingRenderer,
    TeamRenderer,
    LogosRenderer,
    VideoRenderer,
    MapRenderer,
    StepsRenderer,
  ],
  template: `
    @let s = section();
    <section
      appReveal
      [id]="s.anchor || undefined"
      [class]="sectionClasses()"
      [style.background-color]="bgColor()"
    >
      <!-- Conventional type anchor (e.g. #contact) so default CTAs resolve. -->
      <span
        [id]="s.type"
        aria-hidden="true"
        class="pointer-events-none block h-0 scroll-mt-20"
      ></span>
      @switch (s.type) {
          @case ('hero') {
            <app-hero-renderer [section]="s" [lang]="lang()" />
          }
          @case ('cards') {
            <app-cards-renderer [section]="s" [lang]="lang()" />
          }
          @case ('features') {
            <app-features-renderer [section]="s" [lang]="lang()" />
          }
          @case ('accordion') {
            <app-accordion-renderer [section]="s" [lang]="lang()" />
          }
          @case ('gallery') {
            <app-gallery-renderer [section]="s" [lang]="lang()" />
          }
          @case ('carousel') {
            <app-carousel-renderer [section]="s" [lang]="lang()" />
          }
          @case ('testimonials') {
            <app-testimonials-renderer [section]="s" [lang]="lang()" />
          }
          @case ('stats') {
            <app-stats-renderer [section]="s" [lang]="lang()" />
          }
          @case ('cta') {
            <app-cta-renderer [section]="s" [lang]="lang()" />
          }
          @case ('richtext') {
            <app-richtext-renderer [section]="s" [lang]="lang()" />
          }
          @case ('contact') {
            <app-contact-renderer
              [section]="s"
              [lang]="lang()"
              [subdomain]="subdomain()"
            />
          }
          @case ('social') {
            <app-social-renderer [lang]="lang()" [socialLinks]="socialLinks()" />
          }
          @case ('whatsapp') {
            <app-whatsapp-renderer [section]="s" [lang]="lang()" />
          }
          @case ('email') {
            <app-email-renderer [section]="s" [lang]="lang()" />
          }
          @case ('pricing') {
            <app-pricing-renderer [section]="s" [lang]="lang()" />
          }
          @case ('team') {
            <app-team-renderer [section]="s" [lang]="lang()" />
          }
          @case ('logos') {
            <app-logos-renderer [section]="s" [lang]="lang()" />
          }
          @case ('video') {
            <app-video-renderer [section]="s" [lang]="lang()" />
          }
          @case ('map') {
            <app-map-renderer [section]="s" [lang]="lang()" />
          }
          @case ('steps') {
            <app-steps-renderer [section]="s" [lang]="lang()" />
          }
          @default {
            <!-- Unknown section type: render nothing. -->
          }
        }
    </section>
  `,
})
export class SectionRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();
  readonly subdomain = input<string>('');
  /** Site-wide social links, forwarded to the social section renderer. */
  readonly socialLinks = input<SocialLink[]>([]);
  /** Position of this section in the page, used for automatic zebra striping. */
  readonly index = input<number>(0);

  /** Padding + base background + text alignment from section settings.
   * `cv-section` enables content-visibility so offscreen sections skip layout/
   * paint until near the viewport (a page-speed win that, unlike @defer, keeps
   * the elements in the DOM so in-page anchor jumps still resolve). */
  protected readonly sectionClasses = computed(() => {
    const s = this.section().settings ?? {};
    const pad =
      s.paddingY === 'sm' ? 'py-8' : s.paddingY === 'lg' ? 'py-24' : 'py-16';
    const base = s.background === 'muted' ? 'bg-gray-50' : '';
    const align = s.align === 'center' ? 'text-center' : 'text-start';
    return `cv-section ${pad} ${base} ${align}`.trim();
  });

  /**
   * Effective background. Author choices (primary/secondary tint, muted) win;
   * otherwise default sections get automatic zebra striping — a very light
   * tint on odd positions — so adjacent white sections are visually separated.
   */
  protected readonly bgColor = computed(() => {
    const bg = this.section().settings?.background;
    // Mix with the themed surface var so tints/zebra adapt in dark mode.
    if (bg === 'primary')
      return 'color-mix(in srgb, var(--site-primary) 8%, var(--site-surface, #fff))';
    if (bg === 'secondary')
      return 'color-mix(in srgb, var(--site-secondary) 8%, var(--site-surface, #fff))';
    if (bg === 'muted') return ''; // handled by the bg-gray-50 class
    // Default / none: zebra-stripe for rhythm and scannability.
    return this.index() % 2 === 1 ? 'var(--site-zebra, #f9fafb)' : '';
  });
}
