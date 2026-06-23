import { LocalizedText } from './types';

/**
 * Type-specific content shapes for each section, stored as `jsonb` in the
 * `content` column. Text fields are bilingual; rich-text bodies hold Quill HTML.
 * The backend treats `content` loosely (validated as an object); these types are
 * the source of truth mirrored on the frontend.
 */

/** A call-to-action button reused by hero / cta sections. */
export interface CtaButton {
  id: string;
  label: LocalizedText;
  url: string;
  style: 'primary' | 'secondary' | 'outline';
}

// --- Hero ---------------------------------------------------------------
export interface HeroContent {
  headline: LocalizedText;
  subheadline: LocalizedText;
  imageUrl?: string;
  overlay: boolean;
  align: 'left' | 'center';
  buttons: CtaButton[];
}

// --- Cards --------------------------------------------------------------
export interface CardItem {
  id: string;
  imageUrl?: string;
  icon?: string;
  title: LocalizedText;
  body: LocalizedText;
  link?: string;
  linkLabel?: LocalizedText;
}
export interface CardsContent {
  columns: number;
  items: CardItem[];
}

// --- Features -----------------------------------------------------------
export interface FeatureItem {
  id: string;
  icon?: string;
  /** Optional side image; when absent the icon is shown as a fallback. */
  imageUrl?: string;
  title: LocalizedText;
  body: LocalizedText;
}
export interface FeaturesContent {
  items: FeatureItem[];
}

// --- Accordion ----------------------------------------------------------
export interface AccordionItem {
  id: string;
  header: LocalizedText;
  body: LocalizedText;
}
export interface AccordionContent {
  multiple: boolean;
  items: AccordionItem[];
}

// --- Gallery ------------------------------------------------------------
export interface GalleryImage {
  id: string;
  url: string;
  caption?: LocalizedText;
}
export interface GalleryContent {
  columns: number;
  images: GalleryImage[];
}

// --- Carousel -----------------------------------------------------------
export interface CarouselSlide {
  id: string;
  imageUrl: string;
  caption: LocalizedText;
  link?: string;
}
export interface CarouselContent {
  autoplay: boolean;
  intervalMs: number;
  slides: CarouselSlide[];
}

// --- Testimonials -------------------------------------------------------
export interface TestimonialItem {
  id: string;
  quote: LocalizedText;
  author: LocalizedText;
  role: LocalizedText;
  avatarUrl?: string;
  rating: number;
}
export interface TestimonialsContent {
  columns: number;
  items: TestimonialItem[];
}

// --- Stats --------------------------------------------------------------
export interface StatItem {
  id: string;
  value: LocalizedText;
  label: LocalizedText;
}
export interface StatsContent {
  items: StatItem[];
}

// --- CTA ----------------------------------------------------------------
export interface CtaContent {
  heading: LocalizedText;
  text: LocalizedText;
  button: CtaButton;
}

// --- Rich text ----------------------------------------------------------
export interface RichTextContent {
  body: LocalizedText;
  maxWidth: 'narrow' | 'normal' | 'wide';
}

// --- Contact ------------------------------------------------------------
export interface ContactContent {
  description: LocalizedText;
  recipientEmail: string;
  showPhone: boolean;
  whatsappNumber?: string;
  successMessage: LocalizedText;
}

// --- Social -------------------------------------------------------------
export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}
export interface SocialContent {
  links: SocialLink[];
}

// --- WhatsApp -----------------------------------------------------------
export interface WhatsappContent {
  phone: string;
  message: LocalizedText;
  label: LocalizedText;
  floating: boolean;
}

// --- Email --------------------------------------------------------------
export interface EmailContent {
  email: string;
  subject: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
}

// --- Pricing -------------------------------------------------------------
export interface PricingFeature {
  id: string;
  text: LocalizedText;
}
export interface PricingPlan {
  id: string;
  name: LocalizedText;
  price: LocalizedText;
  period: LocalizedText;
  features: PricingFeature[];
  highlighted: boolean;
  buttonLabel: LocalizedText;
  buttonUrl: string;
}
export interface PricingContent {
  plans: PricingPlan[];
}

// --- Team ----------------------------------------------------------------
export interface TeamMember {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  photoUrl?: string;
}
export interface TeamContent {
  columns: number;
  members: TeamMember[];
}

// --- Logos (clients / partners strip) ------------------------------------
export interface LogoItem {
  id: string;
  imageUrl: string;
  alt: LocalizedText;
  url?: string;
}
export interface LogosContent {
  grayscale: boolean;
  logos: LogoItem[];
}

// --- Video ---------------------------------------------------------------
export interface VideoContent {
  /** youtube | vimeo | file */
  provider: 'youtube' | 'vimeo' | 'file';
  url: string;
  caption: LocalizedText;
}

// --- Map -----------------------------------------------------------------
export interface MapContent {
  query: string;
  zoom: number;
  height: number;
  caption: LocalizedText;
}

// --- Steps (process / how-it-works) --------------------------------------
export interface StepItem {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  icon?: string;
}
export interface StepsContent {
  layout: 'vertical' | 'horizontal';
  items: StepItem[];
}

export type SectionContent =
  | HeroContent
  | CardsContent
  | FeaturesContent
  | AccordionContent
  | GalleryContent
  | CarouselContent
  | TestimonialsContent
  | StatsContent
  | CtaContent
  | RichTextContent
  | ContactContent
  | SocialContent
  | WhatsappContent
  | EmailContent
  | PricingContent
  | TeamContent
  | LogosContent
  | VideoContent
  | MapContent
  | StepsContent
  | Record<string, unknown>;

/** Presentational options shared by every section type. */
export interface SectionSettings {
  background?: 'none' | 'muted' | 'primary' | 'secondary';
  paddingY?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
  [key: string]: unknown;
}
