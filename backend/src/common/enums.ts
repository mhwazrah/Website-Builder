/** Which languages a site exposes to its visitors. */
export enum LanguageMode {
  AR = 'ar',
  EN = 'en',
  BOTH = 'both',
}

/** A concrete language a piece of content can be rendered in. */
export enum Language {
  AR = 'ar',
  EN = 'en',
}

/**
 * The catalogue of section/component types a user can drop onto a page.
 * All of these are implemented (render + edit) in the builder.
 */
export enum SectionType {
  HERO = 'hero',
  CARDS = 'cards',
  FEATURES = 'features',
  ACCORDION = 'accordion',
  GALLERY = 'gallery',
  CAROUSEL = 'carousel',
  TESTIMONIALS = 'testimonials',
  STATS = 'stats',
  CTA = 'cta',
  RICHTEXT = 'richtext',
  CONTACT = 'contact',
  SOCIAL = 'social',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  // Round 5 — pro/creative additions.
  PRICING = 'pricing',
  TEAM = 'team',
  LOGOS = 'logos',
  VIDEO = 'video',
  MAP = 'map',
  STEPS = 'steps',
}
