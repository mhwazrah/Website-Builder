import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { SiteStore } from '../../core/site-store';
import { AdminI18n } from '../../core/admin-i18n';
import { FooterConfig, FooterLink, LocalizedText } from '../../core/models';
import { LocalizedTextInputComponent } from '../../shared/localized-text-input';
import { SocialLinksEditor } from '../../shared/social-links-editor';

/**
 * Builder panel for editing the site footer. Keeps a local editable copy of
 * {@link SiteStore.site}'s {@link FooterConfig} (seeded via an effect) and
 * persists every change through {@link SiteStore.saveSite}. Supports toggling
 * the logo, editing a tagline and copyright line, plus reorderable lists of
 * social links and text links. Bilingual (EN/AR) via {@link AdminI18n}.
 */
@Component({
  selector: 'app-footer-manager',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    LocalizedTextInputComponent,
    SocialLinksEditor,
  ],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-gray-600">
          {{ i18n.t('Footer', 'التذييل') }}
        </h2>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Show logo -->
        <div class="flex items-center gap-2">
          <p-checkbox
            [binary]="true"
            inputId="footer-show-logo"
            [ngModel]="footer().showLogo ?? false"
            (ngModelChange)="setShowLogo($event)"
          />
          <label for="footer-show-logo" class="text-sm text-gray-700">
            {{ i18n.t('Show logo', 'إظهار الشعار') }}
          </label>
        </div>

        <!-- Tagline -->
        <app-localized-text-input
          [label]="i18n.t('Tagline', 'الشعار النصي')"
          [languages]="store.languages()"
          [value]="footer().tagline ?? {}"
          (valueChange)="setTagline($event)"
        />

        <!-- Copyright -->
        <app-localized-text-input
          [label]="i18n.t('Copyright', 'حقوق النشر')"
          [languages]="store.languages()"
          [value]="footer().copyright ?? {}"
          (valueChange)="setCopyright($event)"
        />

        <!-- Social links (shared site-wide with the Social section) -->
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">
            {{ i18n.t('Social links', 'روابط التواصل') }}
          </label>
          <p class="mb-2 text-xs text-gray-400">
            {{
              i18n.t(
                'Shared with the Social section — edits appear in both places.',
                'مشتركة مع قسم التواصل — تظهر التعديلات في كلا المكانين.'
              )
            }}
          </p>
          <app-social-links-editor />
        </div>

        <!-- Links -->
        <div>
          <div class="mb-1 flex items-center justify-between">
            <label class="text-xs font-medium text-gray-600">
              {{ i18n.t('Links', 'الروابط') }}
            </label>
            <p-button
              [label]="i18n.t('Add link', 'إضافة رابط')"
              icon="pi pi-plus"
              size="small"
              [text]="true"
              (onClick)="addLink()"
            />
          </div>

          <div class="flex flex-col gap-2">
            @for (link of footer().links ?? []; track link.id; let i = $index) {
              <div
                class="flex flex-col gap-2 rounded-md border border-gray-100 bg-gray-50 p-2"
              >
                <app-localized-text-input
                  [label]="i18n.t('Label', 'التسمية')"
                  [languages]="store.languages()"
                  [value]="link.label"
                  (valueChange)="setLinkLabel(i, $event)"
                />
                <div class="flex items-center gap-2">
                  <input
                    pInputText
                    class="w-full"
                    [attr.dir]="'ltr'"
                    [placeholder]="'https://example.com'"
                    [ngModel]="link.url"
                    (ngModelChange)="setLinkUrl(i, $event)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="danger"
                    (onClick)="removeLink(i)"
                    [ariaLabel]="i18n.t('Remove', 'حذف')"
                  />
                </div>
              </div>
            } @empty {
              <div
                class="rounded-md border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400"
              >
                {{ i18n.t('No links yet.', 'لا توجد روابط بعد.') }}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FooterManager {
  protected readonly store = inject(SiteStore);
  protected readonly i18n = inject(AdminI18n);
  private readonly messages = inject(MessageService);

  /** Local editable copy of the footer; seeded from the store via an effect. */
  protected readonly footer = signal<FooterConfig>({});

  /** Guards the seeding effect from clobbering local edits we just saved. */
  private suppressSeed = false;

  constructor() {
    // Seed the editable copy whenever the stored footer changes (initial load
    // and external updates), unless the change came from our own save.
    effect(() => {
      const stored = this.store.site()?.footer;
      if (this.suppressSeed) {
        this.suppressSeed = false;
        return;
      }
      this.footer.set(this.cloneFooter(stored ?? {}));
    });
  }

  // --- mutations (each persists) ---
  protected setShowLogo(showLogo: boolean): void {
    this.commit({ ...this.footer(), showLogo });
  }

  protected setTagline(tagline: LocalizedText): void {
    this.commit({ ...this.footer(), tagline });
  }

  protected setCopyright(copyright: LocalizedText): void {
    this.commit({ ...this.footer(), copyright });
  }

  // --- links ---
  protected addLink(): void {
    const link: FooterLink = {
      id: crypto.randomUUID(),
      label: {},
      url: '',
    };
    this.commit({
      ...this.footer(),
      links: [...(this.footer().links ?? []), link],
    });
  }

  protected removeLink(index: number): void {
    this.commit({
      ...this.footer(),
      links: (this.footer().links ?? []).filter((_, i) => i !== index),
    });
  }

  protected setLinkLabel(index: number, label: LocalizedText): void {
    this.patchLink(index, (l) => ({ ...l, label }));
  }

  protected setLinkUrl(index: number, url: string): void {
    this.patchLink(index, (l) => ({ ...l, url }));
  }

  // --- internals ---
  private patchLink(
    index: number,
    updater: (l: FooterLink) => FooterLink,
  ): void {
    this.commit({
      ...this.footer(),
      links: (this.footer().links ?? []).map((l, i) =>
        i === index ? updater(l) : l,
      ),
    });
  }

  /** Update local state and persist to the store. */
  private commit(next: FooterConfig): void {
    this.footer.set(next);
    this.suppressSeed = true;
    void this.store
      .saveSite({ footer: this.cloneFooter(next) })
      .catch(() => {
        this.suppressSeed = false;
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Save failed', 'فشل الحفظ'),
        });
      });
  }

  private cloneFooter(f: FooterConfig): FooterConfig {
    return {
      ...f,
      tagline: f.tagline ? { ...f.tagline } : undefined,
      copyright: f.copyright ? { ...f.copyright } : undefined,
      links: f.links?.map((l) => ({ ...l, label: { ...l.label } })),
    };
  }
}
