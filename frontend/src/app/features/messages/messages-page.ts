import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { ApiService } from '../../core/api.service';
import { AdminI18n } from '../../core/admin-i18n';
import { ContactMessage } from '../../core/models';
import { AdminLangSwitcher } from '../../shared/admin-lang-switcher';

/**
 * Admin contact inbox at /sites/:id/messages. Lists the form submissions for a
 * site, lets you toggle read/unread, reply by email and delete. Fully bilingual
 * (EN/AR) and RTL-aware via {@link AdminI18n}; shows skeletons while loading and
 * paginates with a Load more button.
 */
@Component({
  selector: 'app-messages-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    AdminLangSwitcher,
  ],
  template: `
    <div class="min-h-screen bg-surface-50" [attr.dir]="i18n.dir()">
      <!-- Sticky header -->
      <header
        class="sticky top-0 z-20 border-b border-surface-200 bg-white/90 backdrop-blur"
      >
        <div
          class="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3"
        >
          <a
            [routerLink]="['/sites', siteId(), 'builder']"
            class="text-surface-400 hover:text-surface-700"
            [attr.aria-label]="i18n.t('Back to builder', 'العودة إلى المحرّر')"
          >
            <i class="pi pi-arrow-left" [class.rotate-180]="i18n.isAr()"></i>
          </a>
          <div class="min-w-0">
            <h1
              class="flex items-center gap-2 truncate text-lg font-semibold text-surface-900"
            >
              {{ i18n.t('Messages', 'الرسائل') }}
              @if (unread() > 0) {
                <p-badge
                  [value]="unread().toString()"
                  severity="danger"
                  [attr.aria-label]="
                    i18n.t('Unread messages', 'رسائل غير مقروءة')
                  "
                />
              }
            </h1>
            @if (siteName(); as n) {
              <p class="truncate text-xs text-surface-500">{{ n }}</p>
            }
          </div>
          <div class="ms-auto flex items-center gap-2">
            <app-admin-lang-switcher />
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-3xl px-4 py-6">
        @if (loading()) {
          <!-- Skeletons -->
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="rounded-xl border border-surface-200 bg-white p-4">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <p-skeleton width="10rem" height="1.1rem" />
                  <p-skeleton width="5rem" height="0.8rem" />
                </div>
                <p-skeleton height="0.9rem" styleClass="mb-2" />
                <p-skeleton height="0.9rem" width="80%" />
              </div>
            }
          </div>
        } @else if (items().length === 0) {
          <!-- Empty state -->
          <div
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-16 text-center"
          >
            <span
              class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-200 text-surface-500"
            >
              <i class="pi pi-inbox text-2xl"></i>
            </span>
            <h2 class="text-lg font-semibold text-surface-900">
              {{ i18n.t('No messages yet', 'لا توجد رسائل بعد') }}
            </h2>
            <p class="mt-1 max-w-sm text-sm text-surface-500">
              {{
                i18n.t(
                  'When visitors submit your contact form, their messages will appear here.',
                  'عندما يرسل الزوار نموذج التواصل، ستظهر رسائلهم هنا.'
                )
              }}
            </p>
          </div>
        } @else {
          <ul class="flex flex-col gap-3">
            @for (m of items(); track m.id) {
              <li
                class="rounded-xl border bg-white p-4 transition"
                [class.border-surface-200]="m.read"
                [class.border-primary-200]="!m.read"
                [class.shadow-sm]="!m.read"
              >
                <button
                  type="button"
                  class="flex w-full items-start gap-3 text-start"
                  (click)="toggleRead(m)"
                  [attr.aria-label]="
                    m.read
                      ? i18n.t('Mark as unread', 'وضع كغير مقروء')
                      : i18n.t('Mark as read', 'وضع كمقروء')
                  "
                >
                  <span
                    class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    [class.bg-primary-500]="!m.read"
                    [class.bg-transparent]="m.read"
                  ></span>
                  <span class="min-w-0 flex-1">
                    <span
                      class="flex flex-wrap items-baseline justify-between gap-x-3"
                    >
                      <span
                        class="truncate text-surface-900"
                        [class.font-semibold]="!m.read"
                        [class.font-medium]="m.read"
                      >
                        {{ m.name }}
                      </span>
                      <span class="shrink-0 text-xs text-surface-400">
                        {{ relativeDate(m.createdAt) }}
                      </span>
                    </span>
                    <span class="mt-0.5 flex flex-wrap gap-x-3 text-xs">
                      <span class="truncate text-surface-500" dir="ltr">{{
                        m.email
                      }}</span>
                      @if (m.phone) {
                        <span class="truncate text-surface-500" dir="ltr">{{
                          m.phone
                        }}</span>
                      }
                    </span>
                    @if (m.subject) {
                      <span
                        class="mt-1.5 block truncate text-sm font-semibold text-surface-800"
                      >
                        {{ m.subject }}
                      </span>
                    }
                    <span
                      class="mt-2 block whitespace-pre-line text-sm"
                      [class.font-medium]="!m.read"
                      [class.text-surface-800]="!m.read"
                      [class.text-surface-600]="m.read"
                    >
                      {{ m.message }}
                    </span>
                  </span>
                </button>

                <div
                  class="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-100 pt-3"
                >
                  <a [href]="mailto(m)">
                    <p-button
                      [label]="i18n.t('Reply', 'رد')"
                      icon="pi pi-reply"
                      size="small"
                      [outlined]="true"
                    />
                  </a>
                  <p-button
                    [label]="
                      m.read
                        ? i18n.t('Mark unread', 'غير مقروء')
                        : i18n.t('Mark read', 'مقروء')
                    "
                    [icon]="m.read ? 'pi pi-envelope' : 'pi pi-check'"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    [disabled]="busyIds().has(m.id)"
                    (onClick)="toggleRead(m)"
                  />
                  <p-button
                    [label]="i18n.t('Delete', 'حذف')"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    [text]="true"
                    styleClass="ms-auto"
                    [disabled]="busyIds().has(m.id)"
                    (onClick)="remove(m)"
                  />
                </div>
              </li>
            }
          </ul>

          @if (items().length < total()) {
            <div class="mt-6 flex justify-center">
              <p-button
                [label]="i18n.t('Load more', 'تحميل المزيد')"
                icon="pi pi-chevron-down"
                [outlined]="true"
                [loading]="loadingMore()"
                [disabled]="loadingMore()"
                (onClick)="loadMore()"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class MessagesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);
  protected readonly i18n = inject(AdminI18n);

  readonly siteId = signal<string>('');
  readonly siteName = signal<string | null>(null);

  readonly items = signal<ContactMessage[]>([]);
  readonly total = signal(0);
  readonly unread = signal(0);
  readonly page = signal(1);

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly busyIds = signal<Set<string>>(new Set());

  constructor() {
    // Keep the document direction in sync so PrimeNG overlays are RTL too.
    effect(() => {
      document.documentElement.dir = this.i18n.dir();
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== this.siteId()) {
        this.siteId.set(id);
        void this.loadSiteName(id);
        void this.loadMessages(1, true);
      }
    });
  }

  private async loadSiteName(id: string): Promise<void> {
    try {
      const site = await firstValueFrom(this.api.getSite(id));
      this.siteName.set(site.name);
    } catch {
      this.siteName.set(null);
    }
  }

  private async loadMessages(page: number, reset: boolean): Promise<void> {
    if (reset) this.loading.set(true);
    else this.loadingMore.set(true);
    try {
      const res = await firstValueFrom(
        this.api.listMessages(this.siteId(), { page }),
      );
      this.total.set(res.total);
      this.unread.set(res.unread);
      this.page.set(res.page);
      this.items.update((list) =>
        reset ? res.items : [...list, ...res.items],
      );
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Failed to load messages', 'فشل تحميل الرسائل'),
      });
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  loadMore(): void {
    if (this.loadingMore()) return;
    void this.loadMessages(this.page() + 1, false);
  }

  private setBusy(id: string, busy: boolean): void {
    this.busyIds.update((set) => {
      const next = new Set(set);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async toggleRead(m: ContactMessage): Promise<void> {
    if (this.busyIds().has(m.id)) return;
    const next = !m.read;
    this.setBusy(m.id, true);
    try {
      const updated = await firstValueFrom(
        this.api.setMessageRead(m.id, next),
      );
      this.items.update((list) =>
        list.map((x) => (x.id === m.id ? { ...x, read: updated.read } : x)),
      );
      this.unread.update((n) => Math.max(0, n + (updated.read ? -1 : 1)));
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Update failed', 'فشل التحديث'),
      });
    } finally {
      this.setBusy(m.id, false);
    }
  }

  async remove(m: ContactMessage): Promise<void> {
    if (this.busyIds().has(m.id)) return;
    const ok = window.confirm(
      this.i18n.t(
        `Delete the message from ${m.name}? This cannot be undone.`,
        `حذف الرسالة من ${m.name}؟ لا يمكن التراجع عن ذلك.`,
      ),
    );
    if (!ok) return;
    this.setBusy(m.id, true);
    try {
      await firstValueFrom(this.api.deleteMessage(m.id));
      const wasUnread = !m.read;
      this.items.update((list) => list.filter((x) => x.id !== m.id));
      this.total.update((n) => Math.max(0, n - 1));
      if (wasUnread) this.unread.update((n) => Math.max(0, n - 1));
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Message deleted', 'تم حذف الرسالة'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Delete failed', 'فشل الحذف'),
      });
    } finally {
      this.setBusy(m.id, false);
    }
  }

  mailto(m: ContactMessage): string {
    const subject = m.subject
      ? `${this.i18n.t('Re:', 'رد:')} ${m.subject}`
      : this.i18n.t('Re: your message', 'رد: رسالتك');
    return `mailto:${m.email}?subject=${encodeURIComponent(subject)}`;
  }

  /** Bilingual relative time (falls back to a localized absolute date). */
  relativeDate(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diff = Date.now() - then;
    const sec = Math.round(diff / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);

    const ar = this.i18n.isAr();
    if (sec < 45) return ar ? 'الآن' : 'just now';

    // Arabic needs dual/plural grammar — let Intl handle the noun forms.
    if (ar) {
      const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
      if (min < 60) return rtf.format(-min, 'minute');
      if (hr < 24) return rtf.format(-hr, 'hour');
      if (day < 7) return rtf.format(-day, 'day');
      return new Date(then).toLocaleDateString('ar', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    if (min < 60) return `${min} min ago`;
    if (hr < 24) return `${hr} h ago`;
    if (day < 7) return `${day} d ago`;
    return new Date(then).toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
