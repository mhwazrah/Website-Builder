import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { assetUrl } from '../../../core/config';
import { dir, resolveText } from '../../../core/i18n';
import { Language, Section, TeamContent, TeamMember } from '../../../core/models';

/**
 * Renders a `team` section: optional title/subtitle followed by a responsive
 * grid (2/3/4 columns) of member cards. Each card shows a round avatar
 * (uploaded photo, or an initial-on-brand-tint fallback), the member name in
 * bold, their role in the brand colour, and a rich-text bio injected via
 * `[innerHTML]`. Arabic flips to RTL.
 */
@Component({
  selector: 'app-team-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    <div class="mx-auto max-w-6xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2 class="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
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

      <div class="stagger grid gap-6" [class]="gridCols()">
        @for (member of content().members; track member.id) {
          <article
            class="card-elevation group flex h-full flex-col items-center rounded-2xl border border-gray-100 bg-white p-7 text-center transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            <!-- Avatar -->
            @if (photoUrl(member.photoUrl); as photo) {
              <img
                [src]="photo"
                [alt]="resolveText(member.name, l)"
                class="mb-4 h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-gray-100 transition-transform duration-300 ease-out group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <span
                class="mb-4 flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-4xl font-semibold transition-transform duration-300 ease-out group-hover:scale-105"
                style="
                  color: var(--site-primary);
                  background: color-mix(in srgb, var(--site-primary) 14%, white);
                "
                aria-hidden="true"
                >{{ initial(member, l) }}</span
              >
            }

            <!-- Name -->
            @if (resolveText(member.name, l)) {
              <h3 class="text-lg font-bold text-gray-900">
                {{ resolveText(member.name, l) }}
              </h3>
            }

            <!-- Role -->
            @if (resolveText(member.role, l)) {
              <p
                class="mt-1 text-sm font-semibold"
                style="color: var(--site-primary)"
              >
                {{ resolveText(member.role, l) }}
              </p>
            }

            <!-- Bio -->
            @if (resolveText(member.bio, l)) {
              <div
                class="rich-text mt-3 text-sm leading-relaxed text-gray-600"
                [attr.dir]="dir(l)"
                [innerHTML]="resolveText(member.bio, l)"
              ></div>
            }
          </article>
        }
      </div>
    </div>
  `,
})
export class TeamRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();

  /** Strongly-typed view of the section content. */
  protected readonly content = computed(
    () => this.section().content as TeamContent,
  );

  /** Map the configured column count to responsive Tailwind grid classes. */
  protected readonly gridCols = computed(() => {
    switch (this.content().columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  });

  /** First character of the member name, for the avatar fallback. */
  protected initial(member: TeamMember, l: Language): string {
    const name = resolveText(member.name, l).trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // Expose helpers to the template.
  protected readonly resolveText = resolveText;
  protected readonly dir = dir;
  protected photoUrl(path: string | undefined): string | null {
    return assetUrl(path);
  }
}
