import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import {
  AccordionContent,
  CardsContent,
  CarouselContent,
  ContactContent,
  CtaContent,
  EmailContent,
  FeaturesContent,
  GalleryContent,
  HeroContent,
  Language,
  LocalizedText,
  LogosContent,
  MapContent,
  PricingContent,
  RichTextContent,
  Section,
  SectionContent,
  SectionSettings,
  SocialContent,
  StatsContent,
  StepsContent,
  TeamContent,
  TestimonialsContent,
  VideoContent,
  WhatsappContent,
} from '../../core/models';
import { LocalizedTextInputComponent } from '../../shared/localized-text-input';
import { FieldLabel } from '../../shared/field-label';
import { AdminI18n } from '../../core/admin-i18n';
import { HeroEditor } from './editors/hero-editor';
import { CardsEditor } from './editors/cards-editor';
import { FeaturesEditor } from './editors/features-editor';
import { AccordionEditor } from './editors/accordion-editor';
import { GalleryEditor } from './editors/gallery-editor';
import { CarouselEditor } from './editors/carousel-editor';
import { TestimonialsEditor } from './editors/testimonials-editor';
import { StatsEditor } from './editors/stats-editor';
import { CtaEditor } from './editors/cta-editor';
import { RichTextEditor } from './editors/richtext-editor';
import { ContactEditor } from './editors/contact-editor';
import { SocialEditor } from './editors/social-editor';
import { WhatsappEditor } from './editors/whatsapp-editor';
import { EmailEditor } from './editors/email-editor';
import { PricingEditor } from './editors/pricing-editor';
import { TeamEditor } from './editors/team-editor';
import { LogosEditor } from './editors/logos-editor';
import { VideoEditor } from './editors/video-editor';
import { MapEditor } from './editors/map-editor';
import { StepsEditor } from './editors/steps-editor';

/** The editable buffer for a section, emitted live as the user edits. */
export interface SectionDraft {
  title: LocalizedText;
  subtitle: LocalizedText;
  settings: SectionSettings;
  content: SectionContent;
}

/**
 * The full editing form for one section: heading, appearance and the
 * type-specific content editor. Seeds local signals from the input `section`
 * and emits a {@link SectionDraft} on every change so a host can drive a live
 * preview. Anchor/nav placement are managed elsewhere (auto-generated anchor +
 * the navbar manager), so they are intentionally absent here.
 */
@Component({
  selector: 'app-section-form',
  imports: [
    FormsModule,
    SelectModule,
    LocalizedTextInputComponent,
    FieldLabel,
    HeroEditor,
    CardsEditor,
    FeaturesEditor,
    AccordionEditor,
    GalleryEditor,
    CarouselEditor,
    TestimonialsEditor,
    StatsEditor,
    CtaEditor,
    RichTextEditor,
    ContactEditor,
    SocialEditor,
    WhatsappEditor,
    EmailEditor,
    PricingEditor,
    TeamEditor,
    LogosEditor,
    VideoEditor,
    MapEditor,
    StepsEditor,
  ],
  template: `
    @if (section(); as sec) {
      <div class="flex flex-col gap-6">
        <!-- Heading -->
        <section class="flex flex-col gap-4">
          <app-localized-text-input
            [label]="i18n.t('Title', 'العنوان')"
            [hint]="
              i18n.t(
                'The big heading shown at the top of this section. Leave empty for no heading.',
                'العنوان الكبير الذي يظهر أعلى هذا القسم. اتركه فارغاً لإخفاء العنوان.'
              )
            "
            [languages]="languages()"
            [value]="title()"
            (valueChange)="setTitle($event)"
          />
          <app-localized-text-input
            [label]="i18n.t('Subtitle', 'العنوان الفرعي')"
            [hint]="
              i18n.t(
                'A short line of supporting text shown under the title.',
                'سطر قصير من النص الداعم يظهر أسفل العنوان.'
              )
            "
            [languages]="languages()"
            [value]="subtitle()"
            (valueChange)="setSubtitle($event)"
          />
        </section>

        <hr class="border-surface-200" />

        <!-- Appearance -->
        <section class="flex flex-col gap-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-surface-500">
            {{ i18n.t('Appearance', 'المظهر') }}
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <app-field-label
                [text]="i18n.t('Background', 'الخلفية')"
                [hint]="
                  i18n.t(
                    'The section background. The tint options use a soft shade of your brand colours.',
                    'خلفية القسم. تستخدم خيارات التدرّج درجة خفيفة من ألوان علامتك التجارية.'
                  )
                "
              />
              <p-select
                [options]="backgroundOptions()"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                [ngModel]="settings().background ?? 'none'"
                (ngModelChange)="patchSettings({ background: $event })"
              />
            </div>
            <div>
              <app-field-label
                [text]="i18n.t('Spacing', 'التباعد')"
                [hint]="
                  i18n.t(
                    'How much vertical breathing room the section has.',
                    'مقدار المساحة العمودية المخصصة لهذا القسم.'
                  )
                "
              />
              <p-select
                [options]="paddingOptions()"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                [ngModel]="settings().paddingY ?? 'md'"
                (ngModelChange)="patchSettings({ paddingY: $event })"
              />
            </div>
            <div>
              <app-field-label
                [text]="i18n.t('Alignment', 'المحاذاة')"
                [hint]="
                  i18n.t(
                    'Align this section text and content left or centre.',
                    'محاذاة نص ومحتوى هذا القسم إلى اليسار أو إلى الوسط.'
                  )
                "
              />
              <p-select
                [options]="alignOptions()"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                [ngModel]="settings().align ?? 'left'"
                (ngModelChange)="patchSettings({ align: $event })"
              />
            </div>
          </div>
        </section>

        <hr class="border-surface-200" />

        <!-- Type-specific content editor -->
        <section>
          @switch (sec.type) {
            @case ('hero') {
              <app-hero-editor [languages]="languages()" [content]="asHero()" (contentChange)="setContent($event)" />
            }
            @case ('cards') {
              <app-cards-editor [languages]="languages()" [content]="asCards()" (contentChange)="setContent($event)" />
            }
            @case ('features') {
              <app-features-editor [languages]="languages()" [content]="asFeatures()" (contentChange)="setContent($event)" />
            }
            @case ('accordion') {
              <app-accordion-editor [languages]="languages()" [content]="asAccordion()" (contentChange)="setContent($event)" />
            }
            @case ('gallery') {
              <app-gallery-editor [languages]="languages()" [content]="asGallery()" (contentChange)="setContent($event)" />
            }
            @case ('carousel') {
              <app-carousel-editor [languages]="languages()" [content]="asCarousel()" (contentChange)="setContent($event)" />
            }
            @case ('testimonials') {
              <app-testimonials-editor [languages]="languages()" [content]="asTestimonials()" (contentChange)="setContent($event)" />
            }
            @case ('stats') {
              <app-stats-editor [languages]="languages()" [content]="asStats()" (contentChange)="setContent($event)" />
            }
            @case ('cta') {
              <app-cta-editor [languages]="languages()" [content]="asCta()" (contentChange)="setContent($event)" />
            }
            @case ('richtext') {
              <app-richtext-editor [languages]="languages()" [content]="asRichText()" (contentChange)="setContent($event)" />
            }
            @case ('contact') {
              <app-contact-editor [languages]="languages()" [content]="asContact()" (contentChange)="setContent($event)" />
            }
            @case ('social') {
              <app-social-editor [languages]="languages()" [content]="asSocial()" (contentChange)="setContent($event)" />
            }
            @case ('whatsapp') {
              <app-whatsapp-editor [languages]="languages()" [content]="asWhatsapp()" (contentChange)="setContent($event)" />
            }
            @case ('email') {
              <app-email-editor [languages]="languages()" [content]="asEmail()" (contentChange)="setContent($event)" />
            }
            @case ('pricing') {
              <app-pricing-editor [languages]="languages()" [content]="asPricing()" (contentChange)="setContent($event)" />
            }
            @case ('team') {
              <app-team-editor [languages]="languages()" [content]="asTeam()" (contentChange)="setContent($event)" />
            }
            @case ('logos') {
              <app-logos-editor [languages]="languages()" [content]="asLogos()" (contentChange)="setContent($event)" />
            }
            @case ('video') {
              <app-video-editor [languages]="languages()" [content]="asVideo()" (contentChange)="setContent($event)" />
            }
            @case ('map') {
              <app-map-editor [languages]="languages()" [content]="asMap()" (contentChange)="setContent($event)" />
            }
            @case ('steps') {
              <app-steps-editor [languages]="languages()" [content]="asSteps()" (contentChange)="setContent($event)" />
            }
            @default {
              <p class="text-sm text-surface-500">
                {{ i18n.t('This section type has no editor yet.', 'لا يتوفر محرّر لهذا النوع بعد.') }}
              </p>
            }
          }
        </section>
      </div>
    }
  `,
})
export class SectionForm {
  protected readonly i18n = inject(AdminI18n);

  readonly section = input.required<Section>();
  readonly languages = input.required<Language[]>();
  /** Emitted on seed and on every edit, so a host can drive a live preview. */
  readonly draftChange = output<SectionDraft>();

  protected readonly title = signal<LocalizedText>({});
  protected readonly subtitle = signal<LocalizedText>({});
  protected readonly settings = signal<SectionSettings>({});
  protected readonly content = signal<SectionContent>({});

  protected readonly backgroundOptions = () => [
    { label: this.i18n.t('None', 'بدون'), value: 'none' },
    { label: this.i18n.t('Muted', 'باهت'), value: 'muted' },
    { label: this.i18n.t('Primary tint', 'تدرج اللون الأساسي'), value: 'primary' },
    { label: this.i18n.t('Secondary tint', 'تدرج اللون الثانوي'), value: 'secondary' },
  ];
  protected readonly paddingOptions = () => [
    { label: this.i18n.t('Small', 'صغير'), value: 'sm' },
    { label: this.i18n.t('Medium', 'متوسط'), value: 'md' },
    { label: this.i18n.t('Large', 'كبير'), value: 'lg' },
  ];
  protected readonly alignOptions = () => [
    { label: this.i18n.t('Left', 'يسار'), value: 'left' },
    { label: this.i18n.t('Center', 'وسط'), value: 'center' },
  ];

  // Typed views of the content buffer for each editor.
  protected readonly asHero = () => this.content() as HeroContent;
  protected readonly asCards = () => this.content() as CardsContent;
  protected readonly asFeatures = () => this.content() as FeaturesContent;
  protected readonly asAccordion = () => this.content() as AccordionContent;
  protected readonly asGallery = () => this.content() as GalleryContent;
  protected readonly asCarousel = () => this.content() as CarouselContent;
  protected readonly asTestimonials = () => this.content() as TestimonialsContent;
  protected readonly asStats = () => this.content() as StatsContent;
  protected readonly asCta = () => this.content() as CtaContent;
  protected readonly asRichText = () => this.content() as RichTextContent;
  protected readonly asContact = () => this.content() as ContactContent;
  protected readonly asSocial = () => this.content() as SocialContent;
  protected readonly asWhatsapp = () => this.content() as WhatsappContent;
  protected readonly asEmail = () => this.content() as EmailContent;
  protected readonly asPricing = () => this.content() as PricingContent;
  protected readonly asTeam = () => this.content() as TeamContent;
  protected readonly asLogos = () => this.content() as LogosContent;
  protected readonly asVideo = () => this.content() as VideoContent;
  protected readonly asMap = () => this.content() as MapContent;
  protected readonly asSteps = () => this.content() as StepsContent;

  constructor() {
    // Seed local buffers whenever the section identity changes, then emit once.
    effect(() => {
      const sec = this.section();
      this.title.set(this.clone(sec.title ?? {}));
      this.subtitle.set(this.clone(sec.subtitle ?? {}));
      this.settings.set(this.clone(sec.settings ?? {}));
      this.content.set(this.clone(sec.content ?? {}));
      this.emit();
    });
  }

  protected setTitle(value: LocalizedText): void {
    this.title.set(value);
    this.emit();
  }

  protected setSubtitle(value: LocalizedText): void {
    this.subtitle.set(value);
    this.emit();
  }

  protected setContent(value: SectionContent): void {
    this.content.set(value);
    this.emit();
  }

  protected patchSettings(patch: Partial<SectionSettings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    this.emit();
  }

  private emit(): void {
    this.draftChange.emit({
      title: this.title(),
      subtitle: this.subtitle(),
      settings: this.settings(),
      content: this.content(),
    });
  }

  private clone<T>(value: T): T {
    const sc = (globalThis as { structuredClone?: <U>(v: U) => U }).structuredClone;
    return sc ? sc(value) : (JSON.parse(JSON.stringify(value)) as T);
  }
}
