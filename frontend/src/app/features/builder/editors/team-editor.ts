import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { Language, TeamContent, TeamMember } from '../../../core/models';
import { LocalizedTextInputComponent } from '../../../shared/localized-text-input';
import { LocalizedQuillComponent } from '../../../shared/localized-quill';
import { ImagePickerComponent } from '../../../shared/image-picker';
import { FieldLabel } from '../../../shared/field-label';
import { AdminI18n } from '../../../core/admin-i18n';

/** Per-type editor for a `team` section’s content. */
@Component({
  selector: 'app-team-editor',
  imports: [
    FormsModule,
    SelectModule,
    ButtonModule,
    LocalizedTextInputComponent,
    LocalizedQuillComponent,
    ImagePickerComponent,
    FieldLabel,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <!-- Column count -->
      <div>
        <app-field-label
          [text]="i18n.t('Columns', 'الأعمدة')"
          [hint]="
            i18n.t(
              'How many member cards sit side by side in each row.',
              'عدد بطاقات الأعضاء التي تظهر جنبًا إلى جنب في كل صف.'
            )
          "
        />
        <p-select
          [options]="columnOptions"
          optionLabel="label"
          optionValue="value"
          [ngModel]="content().columns"
          (ngModelChange)="setColumns($event)"
          styleClass="w-40"
        />
      </div>

      <!-- Team members -->
      <div class="flex flex-col gap-4">
        @for (member of content().members; track member.id; let i = $index) {
          <div class="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-600">
                {{ i18n.t('Member', 'العضو') }} {{ i + 1 }}
              </span>
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (onClick)="removeMember(member.id)"
                [ariaLabel]="i18n.t('Remove member', 'إزالة العضو')"
              />
            </div>

            <app-localized-text-input
              [label]="i18n.t('Name', 'الاسم')"
              [hint]="
                i18n.t(
                  'The team member’s full name shown under their photo.',
                  'الاسم الكامل لعضو الفريق المعروض أسفل صورته.'
                )
              "
              [languages]="languages()"
              [value]="member.name"
              (valueChange)="patchMember(member.id, { name: $event })"
            />

            <app-localized-text-input
              [label]="i18n.t('Role', 'المنصب')"
              [hint]="
                i18n.t(
                  'Their job title or position, e.g. Lead Designer.',
                  'المسمى الوظيفي أو المنصب، مثل: كبير المصممين.'
                )
              "
              [languages]="languages()"
              [value]="member.role"
              (valueChange)="patchMember(member.id, { role: $event })"
            />

            <app-image-picker
              [aspectRatio]="1"
              [label]="i18n.t('Photo', 'الصورة')"
              [hint]="
                i18n.t(
                  'A square photo works best; shown as a round avatar.',
                  'الصورة المربعة هي الأفضل؛ تظهر كصورة دائرية.'
                )
              "
              [value]="member.photoUrl ?? ''"
              (valueChange)="patchMember(member.id, { photoUrl: $event })"
            />

            <app-localized-quill
              [label]="i18n.t('Bio', 'نبذة')"
              [hint]="
                i18n.t(
                  'A short biography or description for this member.',
                  'سيرة ذاتية قصيرة أو وصف لهذا العضو.'
                )
              "
              [languages]="languages()"
              [value]="member.bio"
              (valueChange)="patchMember(member.id, { bio: $event })"
            />
          </div>
        }
      </div>

      <div>
        <p-button
          [label]="i18n.t('Add member', 'إضافة عضو')"
          icon="pi pi-plus"
          [outlined]="true"
          (onClick)="addMember()"
        />
      </div>
    </div>
  `,
})
export class TeamEditor {
  protected readonly i18n = inject(AdminI18n);

  readonly content = model.required<TeamContent>();
  readonly languages = input.required<Language[]>();

  protected get columnOptions() {
    return [
      { label: this.i18n.t('2 columns', 'عمودان'), value: 2 },
      { label: this.i18n.t('3 columns', '3 أعمدة'), value: 3 },
      { label: this.i18n.t('4 columns', '4 أعمدة'), value: 4 },
    ];
  }

  protected setColumns(columns: number): void {
    this.content.update((c) => ({ ...c, columns }));
  }

  /** Immutably patch a single member by id. */
  protected patchMember(id: string, patch: Partial<TeamMember>): void {
    this.content.update((c) => ({
      ...c,
      members: c.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  protected removeMember(id: string): void {
    this.content.update((c) => ({
      ...c,
      members: c.members.filter((m) => m.id !== id),
    }));
  }

  protected addMember(): void {
    const member: TeamMember = {
      id: crypto.randomUUID(),
      name: {},
      role: {},
      bio: {},
      photoUrl: '',
    };
    this.content.update((c) => ({ ...c, members: [...c.members, member] }));
  }
}
