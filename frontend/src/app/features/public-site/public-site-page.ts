import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/api.service';
import { assetUrl } from '../../core/config';
import { socialIcon } from '../../core/social';
import { dir, languageLabel, languagesFor, resolveText } from '../../core/i18n';
import {
  FooterConfig,
  Language,
  NavItem,
  Page,
  Section,
  Site,
} from '../../core/models';
import { ThemeService } from '../../shared/theme.service';
import { SeoService } from '../../shared/seo.service';
import { SectionRenderer } from './section-renderer';

/**
 * A navbar item resolved for rendering. `link` is a RouterLink commands array
 * for page entries; `href` is a plain string (anchor target or external URL)
 * for section/link entries. `children` is populated for dropdown entries.
 */
interface ResolvedNavEntry {
  id: string;
  kind: 'page' | 'section' | 'link' | 'dropdown';
  label: string;
  link?: (string | undefined)[];
  href?: string;
  active?: boolean;
  newTab?: boolean;
  children?: ResolvedNavEntry[];
}

/**
 * Public, published-site renderer mounted at `/site/:subdomain` and
 * `/site/:subdomain/:slug`. Loads the site via the public API, applies its brand
 * theme and language direction, and renders the requested page (matched by slug,
 * falling back to the home page). Visitor-facing strings are localized to the
 * SITE language (`activeLang`) via the local `t(en, ar)` helper. Shows a friendly
 * screen on 404.
 */
@Component({
  selector: 'app-public-site-page',
  standalone: true,
  imports: [
    SectionRenderer,
    RouterLink,
    ButtonModule,
    ToastModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast />

    @if (notFound()) {
      <div
        class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center"
        [attr.dir]="dir(activeLang())"
        [attr.lang]="activeLang()"
      >
        <i class="pi pi-compass mb-6 text-6xl text-gray-300"></i>
        <h1 class="mb-2 text-3xl font-bold text-gray-900">
          {{ t('Site not found', 'الموقع غير موجود') }}
        </h1>
        <p class="max-w-md text-gray-600">
          {{
            t(
              'We could not find a published site at',
              'تعذر العثور على موقع منشور على العنوان'
            )
          }}
          <span class="font-mono font-semibold">{{ subdomain() }}</span>.
          {{
            t(
              'It may be unpublished or the address may be misspelled.',
              'قد يكون غير منشور أو أن العنوان مكتوب بشكل خاطئ.'
            )
          }}
        </p>
      </div>
    } @else if (site(); as s) {
      @let l = activeLang();
      <div
        class="site-font flex min-h-screen flex-col bg-white transition-colors"
        [class.theme-dark]="colorMode() === 'dark'"
        [style.background-color]="pageBg()"
        [attr.dir]="dir(l)"
        [attr.lang]="l"
      >
        <!-- Sticky navbar -->
        <header class="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
          <!-- Whole navbar (logo + links + controls) aligns start/center/end on
               desktop; mobile keeps logo + hamburger split (justify-between). -->
          <div
            class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
            [class.md:justify-start]="navAlign() === 'start'"
            [class.md:justify-center]="navAlign() === 'center'"
            [class.md:justify-end]="navAlign() === 'end'"
          >
            <a
              [routerLink]="['/site', subdomain()]"
              [attr.aria-label]="t('Go to home page', 'الذهاب إلى الصفحة الرئيسية') + ' — ' + s.name"
              class="flex shrink-0 items-center gap-2"
            >
              @if (logoUrl(s); as logo) {
                <img [src]="logo" [alt]="s.name" class="h-9 w-auto" />
              } @else {
                <span class="text-lg font-bold text-gray-900">{{ s.name }}</span>
              }
            </a>

            <!-- Desktop nav links -->
            <nav
              class="hidden items-center gap-1 md:flex"
              [attr.aria-label]="t('Primary', 'رئيسية')"
            >
              @if (useAuthoredNav()) {
                @for (nav of authoredNav(); track nav.id) {
                  @switch (nav.kind) {
                    @case ('page') {
                      <a
                        [routerLink]="nav.link"
                        [attr.aria-current]="nav.active ? 'page' : null"
                        class="focus-ring rounded px-3 py-1.5 text-sm font-medium transition"
                        [class.text-gray-600]="!nav.active"
                        [class.hover:text-gray-900]="!nav.active"
                        [class.text-gray-900]="nav.active"
                        [class.font-semibold]="nav.active"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('section') {
                      <a
                        [href]="nav.href"
                        (click)="onSectionNav($event, nav.href)"
                        class="focus-ring rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('link') {
                      <a
                        [href]="nav.href"
                        [attr.target]="nav.newTab ? '_blank' : null"
                        [attr.rel]="nav.newTab ? 'noopener noreferrer' : null"
                        class="focus-ring rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('dropdown') {
                      <div class="relative">
                        <button
                          type="button"
                          class="focus-ring inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                          [attr.aria-expanded]="openDropdown() === nav.id"
                          (click)="toggleDropdown(nav.id)"
                        >
                          {{ nav.label }}
                          <i class="pi pi-angle-down text-xs"></i>
                        </button>
                        @if (openDropdown() === nav.id) {
                          <div
                            class="absolute z-50 mt-1 min-w-44 rounded-md border border-gray-100 bg-white py-1 shadow-lg"
                          >
                            @for (child of nav.children; track child.id) {
                              @if (child.kind === 'page') {
                                <a
                                  [routerLink]="child.link"
                                  class="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                  (click)="toggleDropdown(nav.id)"
                                >
                                  {{ child.label }}
                                </a>
                              } @else {
                                <a
                                  [href]="child.href"
                                  [attr.target]="child.newTab ? '_blank' : null"
                                  [attr.rel]="child.newTab ? 'noopener noreferrer' : null"
                                  class="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                  (click)="onSectionNav($event, child.href); openDropdown.set('')"
                                >
                                  {{ child.label }}
                                </a>
                              }
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                }
              } @else {
                @for (nav of pageNavItems(); track nav.slug) {
                  <a
                    [routerLink]="nav.link"
                    [attr.aria-current]="nav.active ? 'page' : null"
                    class="rounded px-3 py-1.5 text-sm font-medium transition"
                    [class.text-gray-600]="!nav.active"
                    [class.hover:text-gray-900]="!nav.active"
                    [class.text-gray-900]="nav.active"
                    [class.font-semibold]="nav.active"
                  >
                    {{ nav.label }}
                  </a>
                }

                @for (anchor of anchorNavItems(); track anchor.anchor) {
                  <a
                    [href]="'#' + anchor.anchor"
                    (click)="onSectionNav($event, '#' + anchor.anchor)"
                    class="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                  >
                    {{ anchor.label }}
                  </a>
                }
              }

            </nav>

            <!-- Desktop utility controls (theme + language), pinned to the end -->
            <div class="hidden shrink-0 items-center gap-1 md:flex">
              @if (showThemeToggle()) {
                <button
                  type="button"
                  class="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                  [attr.aria-label]="
                    colorMode() === 'dark'
                      ? t('Switch to light mode', 'التبديل إلى الوضع الفاتح')
                      : t('Switch to dark mode', 'التبديل إلى الوضع الداكن')
                  "
                  (click)="toggleTheme()"
                >
                  <i [class]="colorMode() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"></i>
                </button>
              }
              @if (showLangToggle()) {
                <button
                  type="button"
                  class="focus-ring inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  [attr.aria-label]="t('Switch language', 'تبديل اللغة')"
                  (click)="toggleLang()"
                >
                  <i class="pi pi-globe text-xs"></i>
                  {{ otherLangLabel() }}
                </button>
              }
            </div>

            <!-- Mobile controls: theme toggle + animated hamburger -->
            <div class="flex items-center gap-1 md:hidden">
              @if (showThemeToggle()) {
                <button
                  type="button"
                  class="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-50"
                  [attr.aria-label]="
                    colorMode() === 'dark'
                      ? t('Switch to light mode', 'التبديل إلى الوضع الفاتح')
                      : t('Switch to dark mode', 'التبديل إلى الوضع الداكن')
                  "
                  (click)="toggleTheme()"
                >
                  <i [class]="colorMode() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"></i>
                </button>
              }
              <button
                type="button"
                class="nav-icon2 ms-1 text-gray-800"
                [class.open]="mobileOpen()"
                [attr.aria-expanded]="mobileOpen()"
                [attr.aria-label]="
                  mobileOpen()
                    ? t('Close menu', 'إغلاق القائمة')
                    : t('Open menu', 'فتح القائمة')
                "
                (click)="toggleMobile()"
              >
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </button>
            </div>
          </div>

          <!-- Mobile stacked menu -->
          @if (mobileOpen()) {
            <nav
              class="border-t border-gray-100 bg-white px-4 py-2 md:hidden"
              [attr.aria-label]="t('Mobile', 'الجوال')"
            >
              @if (useAuthoredNav()) {
                @for (nav of authoredNav(); track nav.id) {
                  @switch (nav.kind) {
                    @case ('page') {
                      <a
                        [routerLink]="nav.link"
                        [attr.aria-current]="nav.active ? 'page' : null"
                        class="block rounded px-3 py-2 text-sm font-medium transition"
                        [class.text-gray-700]="!nav.active"
                        [class.hover:bg-gray-50]="!nav.active"
                        [class.text-gray-900]="nav.active"
                        [class.font-semibold]="nav.active"
                        [class.bg-gray-50]="nav.active"
                        (click)="closeMobile()"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('section') {
                      <a
                        [href]="nav.href"
                        class="block rounded px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        (click)="onSectionNav($event, nav.href); closeMobile()"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('link') {
                      <a
                        [href]="nav.href"
                        [attr.target]="nav.newTab ? '_blank' : null"
                        [attr.rel]="nav.newTab ? 'noopener noreferrer' : null"
                        class="block rounded px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        (click)="closeMobile()"
                      >
                        {{ nav.label }}
                      </a>
                    }
                    @case ('dropdown') {
                      <div class="px-1 py-1">
                        <div class="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {{ nav.label }}
                        </div>
                        @for (child of nav.children; track child.id) {
                          @if (child.kind === 'page') {
                            <a
                              [routerLink]="child.link"
                              class="block rounded px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              (click)="closeMobile()"
                            >
                              {{ child.label }}
                            </a>
                          } @else {
                            <a
                              [href]="child.href"
                              [attr.target]="child.newTab ? '_blank' : null"
                              [attr.rel]="child.newTab ? 'noopener noreferrer' : null"
                              class="block rounded px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              (click)="onSectionNav($event, child.href); closeMobile()"
                            >
                              {{ child.label }}
                            </a>
                          }
                        }
                      </div>
                    }
                  }
                }
              } @else {
                @for (nav of pageNavItems(); track nav.slug) {
                  <a
                    [routerLink]="nav.link"
                    [attr.aria-current]="nav.active ? 'page' : null"
                    class="block rounded px-3 py-2 text-sm font-medium transition"
                    [class.text-gray-700]="!nav.active"
                    [class.hover:bg-gray-50]="!nav.active"
                    [class.text-gray-900]="nav.active"
                    [class.font-semibold]="nav.active"
                    [class.bg-gray-50]="nav.active"
                    (click)="closeMobile()"
                  >
                    {{ nav.label }}
                  </a>
                }

                @for (anchor of anchorNavItems(); track anchor.anchor) {
                  <a
                    [href]="'#' + anchor.anchor"
                    class="block rounded px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    (click)="onSectionNav($event, '#' + anchor.anchor); closeMobile()"
                  >
                    {{ anchor.label }}
                  </a>
                }
              }

              @if (showLangToggle()) {
                <button
                  type="button"
                  class="mt-1 inline-flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  [attr.aria-label]="t('Switch language', 'تبديل اللغة')"
                  (click)="toggleLang(); closeMobile()"
                >
                  <i class="pi pi-globe text-xs"></i>
                  {{ otherLangLabel() }}
                </button>
              }
            </nav>
          }
        </header>

        <!-- Page sections -->
        <main class="flex-1">
          @for (section of currentSections(); track section.id; let i = $index) {
            <app-section-renderer
              [section]="section"
              [lang]="l"
              [index]="i"
              [subdomain]="subdomain()"
              [socialLinks]="s.socialLinks ?? []"
            />
          } @empty {
            <div class="mx-auto max-w-6xl px-4 py-24 text-center text-gray-500">
              {{ t('This page has no content yet.', 'لا يوجد محتوى في هذه الصفحة بعد.') }}
            </div>
          }
        </main>

        <!-- Footer (owner-designed; falls back to logo + page nav) -->
        <footer class="mt-auto border-t border-gray-200 bg-gray-50">
          <!-- Brand accent bar -->
          <div
            class="h-1 w-full"
            [style.background]="
              'linear-gradient(90deg, var(--site-primary), var(--site-secondary))'
            "
            aria-hidden="true"
          ></div>
          <div class="mx-auto max-w-6xl px-4 py-14">
            <div class="grid grid-cols-1 gap-10 md:grid-cols-3">
              <!-- Brand column -->
              <div class="flex flex-col items-start gap-4 md:col-span-2">
                @if (footerCfg().showLogo !== false) {
                  <a
                    [routerLink]="['/site', subdomain()]"
                    class="focus-ring inline-flex items-center gap-2 rounded"
                    [attr.aria-label]="
                      t('Go to home page', 'الذهاب إلى الصفحة الرئيسية')
                    "
                  >
                    @if (logoUrl(s); as logo) {
                      <img [src]="logo" [alt]="s.name" class="h-10 w-auto" />
                    } @else {
                      <span class="text-xl font-bold text-gray-900">{{ s.name }}</span>
                    }
                  </a>
                }
                @if (footerTagline()) {
                  <p class="max-w-md text-sm leading-relaxed text-gray-600">
                    {{ footerTagline() }}
                  </p>
                }
                @if (footerSocial().length) {
                  <div class="mt-1 flex flex-wrap items-center gap-2.5">
                    @for (soc of footerSocial(); track soc.id) {
                      <a
                        [href]="soc.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        [style.color]="'var(--site-primary)'"
                        [attr.aria-label]="soc.platform"
                      >
                        <i [class]="socialIcon(soc.platform)"></i>
                      </a>
                    }
                  </div>
                }
              </div>

              <!-- Quick links: custom links if configured, else page nav -->
              @if (footerCustomLinks().length || pageNavItems().length) {
                <nav
                  class="flex flex-col gap-4"
                  [attr.aria-label]="t('Footer', 'تذييل')"
                >
                  <h3
                    class="text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {{ t('Quick links', 'روابط سريعة') }}
                  </h3>
                  <ul class="flex flex-col gap-2.5">
                    @if (footerCustomLinks().length) {
                      @for (lnk of footerCustomLinks(); track lnk.id) {
                        <li>
                          <a
                            [href]="lnk.href"
                            [attr.target]="lnk.external ? '_blank' : null"
                            [attr.rel]="lnk.external ? 'noopener noreferrer' : null"
                            class="focus-ring inline-flex rounded text-sm text-gray-600 transition hover:text-gray-900 hover:ms-1"
                          >
                            {{ lnk.label }}
                          </a>
                        </li>
                      }
                    } @else {
                      @for (nav of pageNavItems(); track nav.slug) {
                        <li>
                          <a
                            [routerLink]="nav.link"
                            class="focus-ring inline-flex rounded text-sm text-gray-600 transition hover:text-gray-900 hover:ms-1"
                          >
                            {{ nav.label }}
                          </a>
                        </li>
                      }
                    }
                  </ul>
                </nav>
              }
            </div>

            <!-- Bottom bar: copyright + back to top -->
            <div
              class="mt-12 flex flex-col items-center gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between"
            >
              <p class="text-sm text-gray-500">{{ footerCopyright() }}</p>
              <button
                type="button"
                (click)="scrollTop()"
                class="focus-ring inline-flex items-center gap-1.5 rounded-full text-sm text-gray-500 transition hover:text-gray-900"
                [attr.aria-label]="t('Back to top', 'العودة للأعلى')"
              >
                {{ t('Back to top', 'العودة للأعلى') }}
                <i class="pi pi-arrow-up text-xs"></i>
              </button>
            </div>
          </div>
        </footer>
      </div>
    } @else {
      <!-- Skeleton while the site loads -->
      <div
        class="min-h-screen bg-white"
        [attr.aria-busy]="true"
        [attr.aria-label]="t('Loading', 'جار التحميل')"
      >
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p-skeleton width="9rem" height="2rem" />
          <div class="flex gap-3">
            <p-skeleton width="4rem" height="1.25rem" />
            <p-skeleton width="4rem" height="1.25rem" />
            <p-skeleton width="4rem" height="1.25rem" />
          </div>
        </div>
        <div class="mx-auto max-w-6xl px-4 py-16">
          <p-skeleton height="20rem" borderRadius="1rem" styleClass="mb-12" />
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <p-skeleton height="12rem" borderRadius="1rem" />
            <p-skeleton height="12rem" borderRadius="1rem" />
            <p-skeleton height="12rem" borderRadius="1rem" />
          </div>
        </div>
      </div>
    }
  `,
})
export class PublicSitePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly seo = inject(SeoService);

  /** Reactive route params — the component is reused across sibling routes. */
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  /** Subdomain from the route (e.g. `/site/demo`). */
  readonly subdomain = computed(() => this.params().get('subdomain') ?? '');

  /** Optional page slug from the route (e.g. `/site/demo/about`). */
  readonly slug = computed(() => this.params().get('slug'));

  readonly site = signal<Site | null>(null);
  readonly notFound = signal(false);
  readonly activeLang = signal<Language>('en');
  readonly mobileOpen = signal(false);
  /** Visitor-selected colour theme (persisted per site in localStorage). */
  readonly colorMode = signal<'light' | 'dark'>('light');

  /** Navbar link alignment chosen by the owner. */
  readonly navAlign = computed(() => this.site()?.navAlign ?? 'start');

  /** The visitor theme toggle is only offered when the site supports both. */
  readonly showThemeToggle = computed(() => this.site()?.themeMode === 'both');

  /** The active page background per theme (owner-configured). */
  readonly pageBg = computed<string | null>(() => {
    const s = this.site();
    if (!s) return null;
    return this.colorMode() === 'dark'
      ? s.darkBackground || '#111827'
      : s.lightBackground || '#ffffff';
  });

  readonly year = new Date().getFullYear();

  /** Localize a visitor-facing string to the active SITE language. */
  readonly t = (en: string, ar: string): string =>
    this.activeLang() === 'ar' ? ar : en;

  /** Languages exposed by this site, derived from its language mode. */
  readonly languages = computed<Language[]>(() => {
    const s = this.site();
    return s ? languagesFor(s.languageMode) : ['en'];
  });

  /** Only show the language toggle when both languages are available. */
  readonly showLangToggle = computed(() => this.languages().length > 1);

  /** Label of the language the toggle would switch to. */
  readonly otherLangLabel = computed(() => {
    const other = this.languages().find((x) => x !== this.activeLang());
    return other ? languageLabel(other) : '';
  });

  /** All pages on the site, sorted by `order`. */
  private readonly pages = computed<Page[]>(() => {
    const pages = this.site()?.pages ?? [];
    return [...pages].sort((a, b) => a.order - b.order);
  });

  /** The home page (explicit `isHome`, falling back to the first page). */
  private readonly homePage = computed<Page | null>(() => {
    const pages = this.pages();
    return pages.find((p) => p.isHome) ?? pages[0] ?? null;
  });

  /** The page to render: matched by slug, else the home page. */
  private readonly currentPage = computed<Page | null>(() => {
    const slug = this.slug();
    const pages = this.pages();
    if (slug) {
      const match = pages.find((p) => p.slug === slug);
      if (match) return match;
    }
    return this.homePage();
  });

  /** Current page sections sorted by `order`. */
  readonly currentSections = computed<Section[]>(() => {
    const sections = this.currentPage()?.sections ?? [];
    return [...sections].sort((a, b) => a.order - b.order);
  });

  /** Top-level page links for pages flagged `showInNav`. */
  readonly pageNavItems = computed(() => {
    const l = this.activeLang();
    const sub = this.subdomain();
    const home = this.homePage();
    const current = this.currentPage();
    return this.pages()
      .filter((p) => p.showInNav)
      .map((p) => {
        const isHome = p.id === home?.id;
        return {
          slug: p.slug,
          label: resolveText(p.title, l) || p.slug,
          link: isHome ? ['/site', sub] : ['/site', sub, p.slug],
          active: p.id === current?.id,
        };
      });
  });

  /** In-page anchor links for sections of the active page flagged `showInNav`. */
  readonly anchorNavItems = computed(() => {
    const l = this.activeLang();
    return this.currentSections()
      .filter((s) => s.showInNav && s.anchor)
      .map((s) => ({
        anchor: s.anchor as string,
        label: resolveText(s.title, l) || (s.anchor as string),
      }));
  });

  /** The authored navbar entries (from `site.navItems`), resolved for display. */
  readonly authoredNav = computed<ResolvedNavEntry[]>(() => {
    const s = this.site();
    if (!s) return [];
    const l = this.activeLang();
    return (s.navItems ?? [])
      .map((item) => this.resolveNavItem(item, s, l))
      .filter((e): e is ResolvedNavEntry => e !== null);
  });

  /**
   * Whether to render the authored navbar. Falls back to the auto-generated
   * page + anchor lists when the site has no authored nav items.
   */
  readonly useAuthoredNav = computed(() => this.authoredNav().length > 0);

  /** Currently open dropdown id (click-to-open); empty string means none. */
  readonly openDropdown = signal('');

  constructor() {
    this.load();
    // Mirror the visitor theme onto <html> so dark mode also reaches the phone
    // field's country dropdown, which the intl-tel-input library renders on
    // <body> (outside this component's `.theme-dark` root). Cleaned up on
    // destroy so the admin UI is never left dark.
    effect(() => {
      document.documentElement.classList.toggle(
        'theme-dark',
        this.colorMode() === 'dark',
      );
    });
  }

  ngOnDestroy(): void {
    document.documentElement.classList.remove('theme-dark');
  }

  private load(): void {
    const sub = this.subdomain();
    if (!sub) {
      this.notFound.set(true);
      return;
    }
    this.api.publicGetSite(sub).subscribe({
      next: (site) => {
        this.site.set(site);
        this.activeLang.set(site.defaultLanguage);
        // Resolve the visitor colour theme from the site's theme mode: a single
        // forced theme, or (for 'both') the visitor's saved preference.
        const mode = site.themeMode ?? 'light';
        if (mode === 'light' || mode === 'dark') {
          this.colorMode.set(mode);
        } else {
          try {
            const saved = localStorage.getItem('wb-theme-' + sub);
            this.colorMode.set(saved === 'dark' ? 'dark' : 'light');
          } catch {
            this.colorMode.set('light');
          }
        }
        this.theme.apply(site.primaryColor, site.secondaryColor);
        this.theme.applyFont(site.fontFamily);
        this.theme.applyRadius(site.borderRadius);
        this.seo.applyForSite(site, site.defaultLanguage);
        document.documentElement.dir = dir(site.defaultLanguage);
      },
      error: () => {
        this.notFound.set(true);
      },
    });
  }

  toggleLang(): void {
    const other = this.languages().find((x) => x !== this.activeLang());
    if (!other) return;
    this.activeLang.set(other);
    document.documentElement.dir = dir(other);
    const s = this.site();
    if (s) this.seo.applyForSite(s, other);
  }

  toggleTheme(): void {
    const next = this.colorMode() === 'dark' ? 'light' : 'dark';
    this.colorMode.set(next);
    try {
      localStorage.setItem('wb-theme-' + this.subdomain(), next);
    } catch {
      /* localStorage unavailable */
    }
  }

  toggleMobile(): void {
    this.mobileOpen.update((open) => !open);
  }

  /** Smooth-scroll back to the top of the page (footer "Back to top"). */
  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  /** Toggle an authored dropdown panel open/closed by id. */
  toggleDropdown(id: string): void {
    this.openDropdown.update((open) => (open === id ? '' : id));
  }

  /**
   * Smooth-scroll to an in-page section instead of doing a full navigation.
   * If the anchor target exists on the current page, we prevent the default
   * jump, reveal the target (so it is never stuck mid-entrance) and animate
   * the scroll. Cross-page links (target not on this page) fall through to the
   * normal href so the browser navigates there.
   */
  onSectionNav(event: MouseEvent, href: string | undefined): void {
    if (!href) return;
    const hash = href.indexOf('#');
    if (hash < 0) return;
    const anchor = href.slice(hash + 1);
    const el = document.getElementById(anchor);
    if (!el) return; // different page → let the href navigate
    event.preventDefault();
    // Ensure the target is visible even if its entrance hasn't triggered yet.
    el.classList.remove('reveal-init');
    el.classList.add('reveal-in');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.openDropdown.set('');
    this.closeMobile();
  }

  /**
   * Resolve a single authored nav item into a display entry. Returns `null`
   * when the item references a missing page/section so it is skipped.
   * Dropdowns are resolved one level deep (children: page/section/link).
   */
  private resolveNavItem(
    item: NavItem,
    s: Site,
    l: Language,
    allowDropdown = true,
  ): ResolvedNavEntry | null {
    const sub = this.subdomain();
    const home = this.homePage();
    const current = this.currentPage();

    if (item.type === 'page') {
      const page = s.pages.find((p) => p.id === item.pageId);
      if (!page) return null;
      const isHome = page.id === home?.id;
      return {
        id: item.id,
        kind: 'page',
        label: resolveText(item.label, l) || resolveText(page.title, l) || page.slug,
        link: isHome ? ['/site', sub] : ['/site', sub, page.slug],
        active: page.id === current?.id,
      };
    }

    if (item.type === 'section') {
      let owner: Page | undefined;
      let section: Section | undefined;
      for (const p of s.pages) {
        const found = p.sections.find((sec) => sec.id === item.sectionId);
        if (found) {
          owner = p;
          section = found;
          break;
        }
      }
      if (!owner || !section || !section.anchor) return null;
      const isHome = owner.id === home?.id;
      const path = isHome ? `/site/${sub}` : `/site/${sub}/${owner.slug}`;
      return {
        id: item.id,
        kind: 'section',
        label:
          resolveText(item.label, l) ||
          resolveText(section.title, l) ||
          section.type,
        href: `${path}#${section.anchor}`,
      };
    }

    if (item.type === 'link') {
      return {
        id: item.id,
        kind: 'link',
        label: resolveText(item.label, l) || item.url || '',
        href: item.url ?? '',
        newTab: item.newTab,
      };
    }

    // dropdown
    if (!allowDropdown) return null;
    const children = (item.children ?? [])
      .map((child) => this.resolveNavItem(child, s, l, false))
      .filter((e): e is ResolvedNavEntry => e !== null);
    return {
      id: item.id,
      kind: 'dropdown',
      label: resolveText(item.label, l) || '',
      children,
    };
  }

  /** Resolve the light logo to an absolute URL (or null to fall back to name). */
  logoUrl(site: Site): string | null {
    const url =
      this.colorMode() === 'dark'
        ? site.logoDarkUrl || site.logoLightUrl
        : site.logoLightUrl;
    return assetUrl(url);
  }

  // --- Footer (owner-authored, with sensible fallbacks) ---
  readonly footerCfg = computed<FooterConfig>(() => this.site()?.footer ?? {});

  /** Site-wide social links that actually have a URL (shared with the social
   *  section — single source of truth). */
  readonly footerSocial = computed(() =>
    (this.site()?.socialLinks ?? []).filter((s) => s.url?.trim()),
  );

  /** Configured footer text links, resolved for the active language. */
  readonly footerCustomLinks = computed(() => {
    const l = this.activeLang();
    return (this.footerCfg().links ?? [])
      .filter((x) => x.url?.trim())
      .map((x) => ({
        id: x.id,
        label: resolveText(x.label, l) || x.url,
        href: x.url,
        external: /^https?:\/\//i.test(x.url),
      }));
  });

  readonly footerTagline = computed(() =>
    resolveText(this.footerCfg().tagline ?? {}, this.activeLang()),
  );

  readonly footerCopyright = computed(() => {
    const c = resolveText(this.footerCfg().copyright ?? {}, this.activeLang());
    return c || `© ${this.year} ${this.site()?.name ?? ''}`;
  });

  /** Map a social platform key to its PrimeIcons class. */
  /** Shared platform → icon mapping (same as the social section). */
  readonly socialIcon = socialIcon;

  // Expose helpers to the template.
  readonly dir = dir;
}
