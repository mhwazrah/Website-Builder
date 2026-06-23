/**
 * Frontend mirror of the backend contract. Keep field names in sync with the
 * NestJS DTOs/entities — these are the wire shapes used by ApiService.
 */

export type LanguageMode = 'ar' | 'en' | 'both';
export type Language = 'ar' | 'en';

export type SectionType =
  | 'hero'
  | 'cards'
  | 'features'
  | 'accordion'
  | 'gallery'
  | 'carousel'
  | 'testimonials'
  | 'stats'
  | 'cta'
  | 'richtext'
  | 'contact'
  | 'social'
  | 'whatsapp'
  | 'email'
  | 'pricing'
  | 'team'
  | 'logos'
  | 'video'
  | 'map'
  | 'steps';

export interface LocalizedText {
  en?: string;
  ar?: string;
}

export interface ColorPalette {
  colors: string[];
  primary: string;
  secondary: string;
}

/** A call-to-action button reused by hero / cta sections. */
export interface CtaButton {
  id: string;
  label: LocalizedText;
  url: string;
  style: 'primary' | 'secondary' | 'outline';
}

// --- Section content shapes (mirror backend/common/section-content.ts) ---
export interface HeroContent {
  headline: LocalizedText;
  subheadline: LocalizedText;
  imageUrl?: string;
  overlay: boolean;
  align: 'left' | 'center';
  buttons: CtaButton[];
}

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

export interface AccordionItem {
  id: string;
  header: LocalizedText;
  body: LocalizedText;
}
export interface AccordionContent {
  multiple: boolean;
  items: AccordionItem[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: LocalizedText;
}
export interface GalleryContent {
  columns: number;
  images: GalleryImage[];
}

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

export interface StatItem {
  id: string;
  value: LocalizedText;
  label: LocalizedText;
}
export interface StatsContent {
  items: StatItem[];
}

export interface CtaContent {
  heading: LocalizedText;
  text: LocalizedText;
  button: CtaButton;
}

export interface RichTextContent {
  body: LocalizedText;
  maxWidth: 'narrow' | 'normal' | 'wide';
}

export interface ContactContent {
  description: LocalizedText;
  recipientEmail: string;
  showPhone: boolean;
  whatsappNumber?: string;
  successMessage: LocalizedText;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}
export interface SocialContent {
  links: SocialLink[];
}

export interface WhatsappContent {
  phone: string;
  message: LocalizedText;
  label: LocalizedText;
  floating: boolean;
}

export interface EmailContent {
  email: string;
  subject: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
}

// --- Pricing ---
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

// --- Team ---
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

// --- Logos ---
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

// --- Video ---
export interface VideoContent {
  provider: 'youtube' | 'vimeo' | 'file';
  url: string;
  caption: LocalizedText;
}

// --- Map ---
export interface MapContent {
  query: string;
  zoom: number;
  height: number;
  caption: LocalizedText;
}

// --- Steps ---
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

/** A navbar entry (page link, section jump, external link, or dropdown). */
export interface NavItem {
  id: string;
  type: 'page' | 'section' | 'link' | 'dropdown';
  label: LocalizedText;
  pageId?: string;
  sectionId?: string;
  url?: string;
  newTab?: boolean;
  children?: NavItem[];
}

export interface SectionSettings {
  background?: 'none' | 'muted' | 'primary' | 'secondary';
  paddingY?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
  [key: string]: unknown;
}

// --- Entities ------------------------------------------------------------
export interface Section {
  id: string;
  pageId: string;
  type: SectionType;
  title: LocalizedText;
  subtitle: LocalizedText;
  anchor: string | null;
  showInNav: boolean;
  order: number;
  content: SectionContent;
  settings: SectionSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface Page {
  id: string;
  siteId: string;
  title: LocalizedText;
  slug: string;
  order: number;
  showInNav: boolean;
  isHome: boolean;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
}

/** A social-media icon link in the footer. */
export interface FooterSocialLink {
  id: string;
  platform: string;
  url: string;
}

/** A text link in the footer's links column. */
export interface FooterLink {
  id: string;
  label: LocalizedText;
  url: string;
}

/** Owner-authored footer; when empty the public site uses an automatic footer. */
export interface FooterConfig {
  showLogo?: boolean;
  tagline?: LocalizedText;
  copyright?: LocalizedText;
  socialLinks?: FooterSocialLink[];
  links?: FooterLink[];
}

export interface Site {
  id: string;
  name: string;
  subdomain: string;
  languageMode: LanguageMode;
  defaultLanguage: Language;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  lightBackground?: string;
  darkBackground?: string;
  borderRadius?: number;
  navAlign?: 'start' | 'center' | 'end';
  themeMode?: 'light' | 'dark' | 'both';
  extractedColors: string[];
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  faviconUrl: string | null;
  navItems: NavItem[];
  fontFamily?: string | null;
  footer?: FooterConfig;
  /** Site-wide social links shared by the footer and the social section. */
  socialLinks?: SocialLink[];
  published: boolean;
  publishedAt?: string | null;
  hasUnpublishedChanges?: boolean;
  pages: Page[];
  createdAt?: string;
  updatedAt?: string;
}

/** A starter template shown in the create-site dialog. */
export interface Template {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  icon: string;
}

/** A contact-form submission (admin inbox). */
export interface ContactMessage {
  id: string;
  siteId: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MessageListResult {
  items: ContactMessage[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

/** A reusable image in the media library. */
export interface Asset {
  id: string;
  url: string;
  filename: string | null;
  mimetype: string | null;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface AssetListResult {
  items: Asset[];
  total: number;
  page: number;
  limit: number;
}

// --- DTOs (request bodies) ----------------------------------------------
export interface CreateSiteDto {
  name: string;
  subdomain: string;
  languageMode?: LanguageMode;
  defaultLanguage?: Language;
  templateId?: string;
}
export type UpdateSiteDto = Partial<{
  name: string;
  subdomain: string;
  languageMode: LanguageMode;
  defaultLanguage: Language;
  primaryColor: string;
  secondaryColor: string;
  lightBackground: string;
  darkBackground: string;
  borderRadius: number;
  navAlign: 'start' | 'center' | 'end';
  themeMode: 'light' | 'dark' | 'both';
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  faviconUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  navItems: NavItem[];
  fontFamily: string | null;
  footer: FooterConfig;
  socialLinks: SocialLink[];
  published: boolean;
}>;

export interface CreatePageDto {
  title: LocalizedText;
  slug: string;
  showInNav?: boolean;
  isHome?: boolean;
}
export type UpdatePageDto = Partial<CreatePageDto>;

export interface CreateSectionDto {
  type: SectionType;
  title?: LocalizedText;
  subtitle?: LocalizedText;
  anchor?: string | null;
  showInNav?: boolean;
  content?: SectionContent;
  settings?: SectionSettings;
}
export type UpdateSectionDto = Partial<CreateSectionDto>;

export interface ContactSubmissionDto {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  sectionId?: string;
}

export interface SubdomainCheck {
  available: boolean;
}

export interface LogoUploadResult {
  url: string;
  mode: 'light' | 'dark';
  palette: ColorPalette;
  site: Site;
}

export interface ImageUploadResult {
  url: string;
}
