import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dir } from '../../core/i18n';
import { Language, Page, Section, Site } from '../../core/models';
import { ThemeService } from '../../shared/theme.service';
import { SectionRenderer } from '../public-site/section-renderer';

/**
 * Bare, chrome-less render of a site's DRAFT page, mounted in an iframe by the
 * builder's device preview. Because it lives in its own iframe document, CSS
 * viewport breakpoints (sm:/lg:) resolve against the iframe width — so the
 * mobile/tablet frames show the TRUE responsive layout instead of a desktop
 * grid squished into a narrow box. Reads `?page=<id>&lang=<en|ar>`.
 */
@Component({
  selector: 'app-section-preview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionRenderer],
  template: `
    @if (site(); as s) {
      <div class="site-font min-h-screen bg-white" [attr.dir]="dir(lang())">
        @for (section of sections(); track section.id; let i = $index) {
          <app-section-renderer
            [section]="section"
            [lang]="lang()"
            [index]="i"
            [subdomain]="s.subdomain"
            [socialLinks]="s.socialLinks ?? []"
          />
        } @empty {
          <div class="px-4 py-24 text-center text-gray-400">
            {{ lang() === 'ar' ? 'لا يوجد محتوى بعد.' : 'No content yet.' }}
          </div>
        }
      </div>
    }
  `,
})
export class SectionPreviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly site = signal<Site | null>(null);
  readonly lang = computed<Language>(() =>
    this.query().get('lang') === 'ar' ? 'ar' : 'en',
  );
  private readonly pageId = computed(() => this.query().get('page'));

  readonly sections = computed<Section[]>(() => {
    const s = this.site();
    if (!s) return [];
    const pages = s.pages ?? [];
    const page: Page | undefined =
      pages.find((p) => p.id === this.pageId()) ??
      pages.find((p) => p.isHome) ??
      pages[0];
    return page ? [...page.sections].sort((a, b) => a.order - b.order) : [];
  });

  readonly dir = dir;

  constructor() {
    const id = this.params().get('id');
    if (id) {
      this.api.getSite(id).subscribe((site) => {
        this.site.set(site);
        this.theme.apply(site.primaryColor, site.secondaryColor);
        this.theme.applyFont(site.fontFamily);
        this.theme.applyRadius(site.borderRadius);
        document.documentElement.dir = dir(this.lang());
      });
    }
  }
}
