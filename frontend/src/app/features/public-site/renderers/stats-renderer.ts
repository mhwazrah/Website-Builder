import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { dir, resolveText } from '../../../core/i18n';
import { Language, Section, StatsContent } from '../../../core/models';

/** A stat value split into an animatable number plus its surrounding text. */
interface ParsedStat {
  /** The raw resolved text (used as the static fallback). */
  raw: string;
  /** The numeric target, or null when no leading number was found. */
  target: number | null;
  /** Text before the number (e.g. `$`). */
  prefix: string;
  /** Text after the number (e.g. `%`, `+`, `K`). */
  suffix: string;
  /** Decimal places to preserve when formatting the running value. */
  decimals: number;
  /** Whether the original number used grouping separators (e.g. `1,200`). */
  grouped: boolean;
}

/**
 * Renders a `stats` section: an optional title/subtitle followed by a
 * responsive, centred row of stat blocks. Each block shows a large bold value
 * in the site's primary brand colour with a muted label beneath it.
 *
 * When the section first scrolls into view each numeric value counts up from
 * zero to its target (~1.2s, ease-out) while preserving any prefix/suffix such
 * as `$`, `%`, `+`, `K`, or thousands separators. Non-numeric values render as
 * static text. Honours `prefers-reduced-motion` by showing final values
 * immediately, and runs the rAF loop outside Angular for OnPush efficiency.
 */
@Component({
  selector: 'app-stats-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div #host class="mx-auto max-w-6xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2
          class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(s.subtitle, l)) {
        <p class="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
          {{ resolveText(s.subtitle, l) }}
        </p>
      } @else if (resolveText(s.title, l)) {
        <div class="mb-10"></div>
      }

      <div class="stagger grid gap-8" [class]="gridCols()">
        @for (entry of displayItems(); track entry.id) {
          <div
            class="flex flex-col items-center justify-start gap-2 text-center transition duration-300 ease-out hover:-translate-y-1"
          >
            <div
              class="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl"
              [style.color]="'var(--site-primary)'"
            >
              {{ entry.display }}
            </div>
            @if (entry.label) {
              <div
                class="text-sm font-medium uppercase tracking-wide text-gray-600 sm:text-base"
              >
                {{ entry.label }}
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class StatsRenderer implements AfterViewInit, OnDestroy {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  private readonly zone = inject(NgZone);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  private observer?: IntersectionObserver;
  private rafId?: number;
  private fallbackTimer?: ReturnType<typeof setTimeout>;

  /** Animation progress, 0..1. Drives the displayed numeric values. */
  private readonly progress = signal(0);

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as StatsContent,
  );

  /** Resolve + parse every stat value for the current language. */
  private readonly parsedItems = computed(() =>
    this.content().items.map((item) => ({
      id: item.id,
      label: this.resolveText(item.label, this.lang()),
      stat: this.parseStat(this.resolveText(item.value, this.lang())),
    })),
  );

  /** The values actually shown, interpolated by the current progress. */
  protected readonly displayItems = computed(() => {
    const t = this.progress();
    return this.parsedItems().map((entry) => ({
      id: entry.id,
      label: entry.label,
      display: this.formatStat(entry.stat, t),
    }));
  });

  /** Distribute the stat blocks evenly, capping at four per row. */
  protected readonly gridCols = computed(() => {
    const count = this.content().items.length;
    switch (Math.min(count, 4)) {
      case 0:
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  });

  ngAfterViewInit(): void {
    // Respect reduced-motion: jump straight to final values, no observer.
    if (this.prefersReducedMotion()) {
      this.progress.set(1);
      return;
    }

    const node = this.host().nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      this.start();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            obs.disconnect();
            this.observer = undefined;
            this.start();
          }
        }
      },
      { threshold: 0.3 },
    );
    this.observer.observe(node);

    // Safety net for environments where the observer is throttled and never
    // fires for an element already on screen (some headless/embedded browsers).
    this.fallbackTimer = setTimeout(() => {
      if (this.progress() > 0) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        this.observer?.disconnect();
        this.observer = undefined;
        this.start();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    if (this.fallbackTimer !== undefined) clearTimeout(this.fallbackTimer);
  }

  /** Kick off the count-up rAF loop outside Angular; set the signal per frame. */
  private start(): void {
    const duration = 1200;
    this.zone.runOutsideAngular(() => {
      const begin =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const tick = (now: number) => {
        const elapsed = now - begin;
        const linear = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - linear, 3);
        this.zone.run(() => this.progress.set(eased));
        if (linear < 1) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.rafId = undefined;
        }
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /**
   * Pull the first number out of a stat string, keeping whatever wraps it.
   * Handles an optional sign, thousands separators, and a decimal part.
   */
  private parseStat(raw: string): ParsedStat {
    const match = raw.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
    if (!match) {
      return {
        raw,
        target: null,
        prefix: '',
        suffix: '',
        decimals: 0,
        grouped: false,
      };
    }

    const token = match[0];
    const start = match.index ?? 0;
    const prefix = raw.slice(0, start);
    const suffix = raw.slice(start + token.length);

    const grouped = token.includes(',');
    const normalized = token.replace(/,/g, '');
    const target = Number(normalized);
    if (!Number.isFinite(target)) {
      return {
        raw,
        target: null,
        prefix: '',
        suffix: '',
        decimals: 0,
        grouped: false,
      };
    }

    const dot = normalized.indexOf('.');
    const decimals = dot === -1 ? 0 : normalized.length - dot - 1;

    return { raw, target, prefix, suffix, decimals, grouped };
  }

  /** Render a parsed stat at progress `t` (0..1), or its static text. */
  private formatStat(stat: ParsedStat, t: number): string {
    if (stat.target === null) return stat.raw;

    const current = stat.target * t;
    const fixed = current.toFixed(stat.decimals);
    const number = stat.grouped
      ? this.groupThousands(fixed)
      : fixed;
    return `${stat.prefix}${number}${stat.suffix}`;
  }

  /** Re-insert thousands separators on a (possibly decimal) numeric string. */
  private groupThousands(value: string): string {
    const [intPart, fracPart] = value.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fracPart !== undefined ? `${grouped}.${fracPart}` : grouped;
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
}
