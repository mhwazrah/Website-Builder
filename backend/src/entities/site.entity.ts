import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language, LanguageMode } from '../common/enums';
import type {
  FooterConfig,
  FooterSocialLink,
  LocalizedText,
  NavItem,
  SiteSnapshot,
} from '../common/types';
import { Page } from './page.entity';
import { ContactMessage } from './contact-message.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  /** Unique, URL-safe handle used at /site/{subdomain}. Lowercase [a-z0-9.-]. */
  @Index('UQ_site_subdomain', { unique: true })
  @Column({ length: 63 })
  subdomain: string;

  @Column({ type: 'enum', enum: LanguageMode, default: LanguageMode.EN })
  languageMode: LanguageMode;

  @Column({ type: 'enum', enum: Language, default: Language.EN })
  defaultLanguage: Language;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoLightUrl: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoDarkUrl: string | null;

  @Column({ type: 'varchar', length: 9, default: '#2563eb' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 9, default: '#9333ea' })
  secondaryColor: string;

  /** Page background for the light theme (visitor default). */
  @Column({ type: 'varchar', length: 9, default: '#ffffff' })
  lightBackground: string;

  /** Page background for the dark theme. */
  @Column({ type: 'varchar', length: 9, default: '#111827' })
  darkBackground: string;

  /** Global corner-radius identity, 0–100 (percent of the max radius). */
  @Column({ type: 'smallint', default: 50 })
  borderRadius: number;

  /** Alignment of the whole navbar (logo + links + controls): 'start' | 'center' | 'end'. */
  @Column({ type: 'varchar', length: 8, default: 'start' })
  navAlign: string;

  /** Which colour themes the site offers: 'light' | 'dark' | 'both'. */
  @Column({ type: 'varchar', length: 8, default: 'light' })
  themeMode: string;

  /** Palette suggested from the most recently uploaded logo. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  extractedColors: string[];

  /** SEO: per-language <title>. Falls back to `name` when empty. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  metaTitle: LocalizedText;

  /** SEO: per-language meta description / OG description. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  metaDescription: LocalizedText;

  /** Favicon URL. Falls back to the light logo when null. */
  @Column({ type: 'varchar', length: 512, nullable: true })
  faviconUrl: string | null;

  /** Authored navbar (pages, dropdowns, section jump-links). Empty = auto nav. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  navItems: NavItem[];

  /** Google Font family for the site (e.g. 'Cairo'); null = system default. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  fontFamily: string | null;

  /** Owner-authored footer (links, copyright). Empty = auto. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  footer: FooterConfig;

  /** Site-wide social links — the single source shared by the footer AND any
   *  `social` section, so editing one place reflects everywhere. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  socialLinks: FooterSocialLink[];

  @Column({ type: 'boolean', default: true })
  published: boolean;

  /** Frozen published tree served to visitors (null until first publish). */
  @Column({ type: 'jsonb', nullable: true })
  publishedData: SiteSnapshot | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  /** True when the live (draft) tree has edits not yet published. */
  @Column({ type: 'boolean', default: true })
  hasUnpublishedChanges: boolean;

  @OneToMany(() => Page, (page) => page.site, { cascade: true })
  pages: Page[];

  @OneToMany(() => ContactMessage, (message) => message.site)
  contactMessages: ContactMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
