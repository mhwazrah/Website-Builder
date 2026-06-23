/**
 * Bilingual text. When a site's languageMode is `both`, the UI collects both
 * `en` and `ar`; for single-language sites only the relevant key is populated.
 * Rich-text fields store Quill-generated HTML strings.
 */
export interface LocalizedText {
  en?: string;
  ar?: string;
}

/** A resolved palette suggestion produced from an uploaded logo. */
export interface ColorPalette {
  /** Hex colors ordered by visual dominance, e.g. ['#1a2b3c', ...]. */
  colors: string[];
  /** Best guess for the primary brand color. */
  primary: string;
  /** Best guess for an accent/secondary color. */
  secondary: string;
}

/** A frozen copy of a section, stored inside a published snapshot. */
export interface SnapshotSection {
  id: string;
  type: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  anchor: string | null;
  showInNav: boolean;
  order: number;
  content: unknown;
  settings: unknown;
}

/** A frozen copy of a page (with its sections) inside a published snapshot. */
export interface SnapshotPage {
  id: string;
  title: LocalizedText;
  slug: string;
  order: number;
  showInNav: boolean;
  isHome: boolean;
  sections: SnapshotSection[];
}

/**
 * A navbar entry authored in the navbar manager. A `dropdown` groups `children`
 * under a toggle. `section` items jump to a section (anchor resolved behind the
 * scenes); `page` items link to a page; `link` items are external URLs.
 */
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

/** A social-media icon link shown in the footer. */
export interface FooterSocialLink {
  id: string;
  /** Platform key (drives the icon), e.g. 'facebook', 'instagram', 'x'. */
  platform: string;
  url: string;
}

/** A text link shown in the footer's links column. */
export interface FooterLink {
  id: string;
  label: LocalizedText;
  url: string;
}

/**
 * Owner-authored footer. When empty the public site falls back to an automatic
 * footer (logo + page nav + copyright).
 */
export interface FooterConfig {
  showLogo?: boolean;
  tagline?: LocalizedText;
  copyright?: LocalizedText;
  socialLinks?: FooterSocialLink[];
  links?: FooterLink[];
}

/**
 * The published version of a site: a frozen tree the public renderer serves,
 * decoupled from the live (draft) tables the builder edits.
 */
export interface SiteSnapshot {
  pages: SnapshotPage[];
  navItems: NavItem[];
  publishedAt: string;
}
