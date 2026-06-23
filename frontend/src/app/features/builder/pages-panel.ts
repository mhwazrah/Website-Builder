import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SiteStore } from '../../core/site-store';
import { AdminI18n } from '../../core/admin-i18n';
import { resolveText } from '../../core/i18n';
import { LocalizedText, Page } from '../../core/models';
import { LocalizedTextInputComponent } from '../../shared/localized-text-input';

/**
 * Pages manager for the builder: list, switch, add, rename, reorder (drag),
 * toggle nav visibility, set the home page, and delete pages. The selected
 * page drives which sections the rest of the builder edits.
 */
@Component({
  selector: 'app-pages-panel',
  imports: [
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    DialogModule,
    ButtonModule,
    InputTextModule,
    LocalizedTextInputComponent,
  ],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-600">{{ i18n.t('Pages', 'الصفحات') }}</h2>
        <p-button
          [label]="i18n.t('Add', 'إضافة')"
          icon="pi pi-plus"
          size="small"
          [text]="true"
          (onClick)="openAdd()"
        />
      </div>

      <div cdkDropList (cdkDropListDropped)="drop($event)" class="flex flex-col gap-1">
        @for (p of store.pages(); track p.id) {
          <div
            cdkDrag
            class="group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer border"
            [class]="
              p.id === activeId()
                ? 'border-gray-300 bg-gray-50'
                : 'border-transparent hover:bg-gray-50'
            "
            (click)="store.setActivePage(p.id)"
          >
            <i
              class="pi pi-bars text-gray-300 cursor-move"
              cdkDragHandle
              (click)="$event.stopPropagation()"
            ></i>
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <span class="min-w-0 truncate text-sm text-gray-800">
                {{ titleOf(p) }}
              </span>
              @if (p.isHome) {
                <i
                  class="pi pi-home shrink-0 text-xs text-amber-500"
                  [title]="i18n.t('Home page', 'الصفحة الرئيسية')"
                ></i>
              }
            </div>
            <div
              class="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              (click)="$event.stopPropagation()"
            >
              <p-button
                icon="pi pi-chevron-up"
                [text]="true"
                [rounded]="true"
                size="small"
                severity="secondary"
                [disabled]="$first"
                (onClick)="move(p, -1)"
                [ariaLabel]="i18n.t('Move page up', 'تحريك الصفحة للأعلى')"
              />
              <p-button
                icon="pi pi-chevron-down"
                [text]="true"
                [rounded]="true"
                size="small"
                severity="secondary"
                [disabled]="$last"
                (onClick)="move(p, 1)"
                [ariaLabel]="i18n.t('Move page down', 'تحريك الصفحة للأسفل')"
              />
              <p-button
                icon="pi pi-copy"
                [text]="true"
                [rounded]="true"
                size="small"
                severity="secondary"
                (onClick)="duplicate(p)"
                [ariaLabel]="i18n.t('Duplicate page', 'تكرار الصفحة')"
              />
              @if (!p.isHome) {
                <p-button
                  icon="pi pi-home"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="setHome(p)"
                  [ariaLabel]="i18n.t('Set as home page', 'تعيين كصفحة رئيسية')"
                />
              }
              <p-button
                [icon]="p.showInNav ? 'pi pi-eye' : 'pi pi-eye-slash'"
                [text]="true"
                [rounded]="true"
                size="small"
                severity="secondary"
                (onClick)="toggleNav(p)"
                [ariaLabel]="i18n.t('Toggle in navigation', 'إظهار/إخفاء في شريط التنقل')"
              />
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                [rounded]="true"
                size="small"
                severity="secondary"
                (onClick)="openEdit(p)"
                [ariaLabel]="i18n.t('Rename page', 'إعادة تسمية الصفحة')"
              />
              @if (store.pages().length > 1) {
                <p-button
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  severity="danger"
                  (onClick)="remove(p)"
                  [ariaLabel]="i18n.t('Delete page', 'حذف الصفحة')"
                />
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Add / edit dialog -->
    <p-dialog
      [(visible)]="dialogOpen"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '460px', maxWidth: '95vw' }"
      [header]="editingId() ? i18n.t('Rename page', 'إعادة تسمية الصفحة') : i18n.t('New page', 'صفحة جديدة')"
    >
      <div class="flex flex-col gap-4 py-1">
        <app-localized-text-input
          [label]="i18n.t('Page title', 'عنوان الصفحة')"
          [languages]="store.languages()"
          [value]="formTitle()"
          (valueChange)="formTitle.set($event)"
        />
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700">{{ i18n.t('Slug', 'المعرف') }}</label>
          <input
            pInputText
            class="w-full"
            [placeholder]="i18n.t('about', 'about')"
            [ngModel]="formSlug()"
            (ngModelChange)="formSlug.set($event)"
          />
          <p class="text-xs text-gray-400 mt-1">
            {{ i18n.t('Lowercase letters, digits and dashes. Used in the page URL.', 'حروف صغيرة وأرقام وشرطات. يُستخدم في رابط الصفحة.') }}
          </p>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button [label]="i18n.t('Cancel', 'إلغاء')" [text]="true" severity="secondary" (onClick)="close()" />
        <p-button
          [label]="editingId() ? i18n.t('Save', 'حفظ') : i18n.t('Create', 'إنشاء')"
          icon="pi pi-check"
          [disabled]="!validSlug()"
          (onClick)="submit()"
        />
      </ng-template>
    </p-dialog>
  `,
})
export class PagesPanel {
  protected readonly store = inject(SiteStore);
  protected readonly i18n = inject(AdminI18n);
  private readonly messages = inject(MessageService);

  protected readonly activeId = computed(() => this.store.activePage()?.id);

  protected readonly dialogOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formTitle = signal<LocalizedText>({});
  protected readonly formSlug = signal<string>('');

  protected readonly validSlug = computed(() =>
    /^[a-z0-9-]+$/.test(this.formSlug().trim()),
  );

  protected titleOf(p: Page): string {
    return resolveText(p.title, this.store.editLanguage()) || p.slug;
  }

  protected drop(e: CdkDragDrop<Page[]>): void {
    const ids = this.store.pages().map((p) => p.id);
    moveItemInArray(ids, e.previousIndex, e.currentIndex);
    void this.store
      .reorderPages(ids)
      .catch(() =>
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Reorder failed', 'فشل إعادة الترتيب'),
        }),
      );
  }

  protected async duplicate(p: Page): Promise<void> {
    try {
      await this.store.duplicatePage(p.id);
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Page duplicated', 'تم تكرار الصفحة'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Duplicate failed', 'فشل التكرار'),
      });
    }
  }

  /** Keyboard-accessible reorder: move the page one step up (-1) or down (+1). */
  protected async move(p: Page, delta: number): Promise<void> {
    const ids = this.store.pages().map((page) => page.id);
    const from = ids.indexOf(p.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    moveItemInArray(ids, from, to);
    try {
      await this.store.reorderPages(ids);
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Reorder failed', 'فشل إعادة الترتيب'),
      });
    }
  }

  protected async setHome(p: Page): Promise<void> {
    try {
      await this.store.setHomePage(p.id);
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Home page updated', 'تم تحديث الصفحة الرئيسية'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Update failed', 'فشل التحديث'),
      });
    }
  }

  protected async toggleNav(p: Page): Promise<void> {
    try {
      await this.store.updatePage(p.id, { showInNav: !p.showInNav });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Update failed', 'فشل التحديث'),
      });
    }
  }

  protected async remove(p: Page): Promise<void> {
    if (
      !confirm(
        this.i18n.t(
          `Delete the "${this.titleOf(p)}" page and all its sections?`,
          `حذف صفحة "${this.titleOf(p)}" وجميع أقسامها؟`,
        ),
      )
    )
      return;
    try {
      await this.store.deletePage(p.id);
      this.messages.add({
        severity: 'info',
        summary: this.i18n.t('Page deleted', 'تم حذف الصفحة'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Delete failed', 'فشل الحذف'),
      });
    }
  }

  protected openAdd(): void {
    this.editingId.set(null);
    this.formTitle.set({});
    this.formSlug.set('');
    this.dialogOpen.set(true);
  }

  protected openEdit(p: Page): void {
    this.editingId.set(p.id);
    this.formTitle.set({ ...p.title });
    this.formSlug.set(p.slug);
    this.dialogOpen.set(true);
  }

  protected close(): void {
    this.dialogOpen.set(false);
  }

  protected async submit(): Promise<void> {
    const slug = this.formSlug().trim();
    if (!/^[a-z0-9-]+$/.test(slug)) return;
    const id = this.editingId();
    try {
      if (id) {
        await this.store.updatePage(id, { title: this.formTitle(), slug });
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('Page updated', 'تم تحديث الصفحة'),
        });
      } else {
        const page = await this.store.addPage({
          title: this.formTitle(),
          slug,
          showInNav: true,
        });
        this.store.setActivePage(page.id);
        this.messages.add({
          severity: 'success',
          summary: this.i18n.t('Page created', 'تم إنشاء الصفحة'),
        });
      }
      this.close();
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Save failed', 'فشل الحفظ'),
      });
    }
  }
}
