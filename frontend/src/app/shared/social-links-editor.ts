import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { SiteStore } from '../core/site-store';
import { AdminI18n } from '../core/admin-i18n';
import { SocialLink } from '../core/models';
import { SOCIAL_PLATFORMS } from '../core/social';

/**
 * Reusable editor for the site-wide social links. It reads and writes
 * {@link SiteStore.site}'s `socialLinks` directly, so it can be embedded in
 * BOTH the footer manager and the social section editor — any add/edit/delete
 * in one place is the same list shown in the other (and on the public site).
 * Each change persists immediately through {@link SiteStore.saveSite}.
 */
@Component({
  selector: 'app-social-links-editor',
  imports: [FormsModule, SelectModule, ButtonModule, InputTextModule],
  template: `
    <div class="flex flex-col gap-2">
      @for (link of links(); track link.id; let i = $index) {
        <div class="flex items-center gap-2">
          <p-select
            [options]="platforms"
            optionLabel="label"
            optionValue="value"
            styleClass="w-40 shrink-0"
            [ngModel]="link.platform"
            (ngModelChange)="patch(i, { platform: $event })"
          />
          <input
            pInputText
            class="w-full min-w-0"
            [attr.dir]="'ltr'"
            placeholder="https://example.com"
            [ngModel]="link.url"
            (ngModelChange)="patch(i, { url: $event })"
          />
          <p-button
            icon="pi pi-trash"
            [text]="true"
            [rounded]="true"
            size="small"
            severity="danger"
            (onClick)="remove(i)"
            [ariaLabel]="i18n.t('Remove', 'حذف')"
          />
        </div>
      } @empty {
        <div
          class="rounded-md border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400"
        >
          {{ i18n.t('No social links yet.', 'لا توجد روابط تواصل بعد.') }}
        </div>
      }

      <div>
        <p-button
          [label]="i18n.t('Add social link', 'إضافة رابط تواصل')"
          icon="pi pi-plus"
          size="small"
          [text]="true"
          (onClick)="add()"
        />
      </div>
    </div>
  `,
})
export class SocialLinksEditor {
  protected readonly store = inject(SiteStore);
  protected readonly i18n = inject(AdminI18n);
  private readonly messages = inject(MessageService);

  protected readonly platforms = SOCIAL_PLATFORMS;

  /** Local editable copy, seeded from the store (and on external updates). */
  protected readonly links = signal<SocialLink[]>([]);
  /** Prevents the seeding effect from clobbering an edit we just saved. */
  private suppressSeed = false;

  constructor() {
    effect(() => {
      const stored = this.store.site()?.socialLinks;
      if (this.suppressSeed) {
        this.suppressSeed = false;
        return;
      }
      this.links.set((stored ?? []).map((l) => ({ ...l })));
    });
  }

  protected add(): void {
    this.commit([
      ...this.links(),
      { id: crypto.randomUUID(), platform: 'facebook', url: '' },
    ]);
  }

  protected remove(index: number): void {
    this.commit(this.links().filter((_, i) => i !== index));
  }

  protected patch(index: number, patch: Partial<SocialLink>): void {
    this.commit(
      this.links().map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  }

  /** Update local state and persist the site-wide list. */
  private commit(next: SocialLink[]): void {
    this.links.set(next);
    this.suppressSeed = true;
    void this.store
      .saveSite({ socialLinks: next.map((l) => ({ ...l })) })
      .catch(() => {
        this.suppressSeed = false;
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Save failed', 'فشل الحفظ'),
        });
      });
  }
}
