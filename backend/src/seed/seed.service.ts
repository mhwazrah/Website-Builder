import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { Language, LanguageMode, SectionType } from '../common/enums';
import type {
  AccordionContent,
  CardsContent,
  ContactContent,
} from '../common/section-content';
import { Page } from '../entities/page.entity';
import { Section } from '../entities/section.entity';
import { Site } from '../entities/site.entity';

/**
 * Seeds a single demo site on first boot. Runs once after the app has fully
 * bootstrapped (so the TypeORM connection + schema sync are ready). Idempotent:
 * it only acts when there are zero sites, and it never throws — a seed failure
 * must not crash the server.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Site) private readonly sites: Repository<Site>,
    @InjectRepository(Page) private readonly pages: Repository<Page>,
    @InjectRepository(Section) private readonly sections: Repository<Section>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const existing = await this.sites.count();
      if (existing > 0) {
        this.logger.log(`Seed skipped: ${existing} site(s) already present.`);
        return;
      }

      await this.createDemo();
      this.logger.log('Seed complete: created demo site "demo".');
    } catch (err) {
      // Never crash boot because of seeding — just log and continue.
      this.logger.error(
        `Seed failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /** Builds and persists the demo Site → home Page → three Sections graph. */
  private async createDemo(): Promise<void> {
    // 1) Site
    const site = await this.sites.save(
      this.sites.create({
        name: 'Demo Business',
        subdomain: 'demo',
        languageMode: LanguageMode.BOTH,
        defaultLanguage: Language.EN,
        primaryColor: '#2563eb',
        secondaryColor: '#9333ea',
        published: true,
      }),
    );

    // 2) Home page
    const page = await this.pages.save(
      this.pages.create({
        siteId: site.id,
        slug: 'home',
        isHome: true,
        order: 0,
        showInNav: true,
        title: { en: 'Home', ar: 'الرئيسية' },
      }),
    );

    // 3) Sections (order 0, 1, 2)
    const cardsContent: CardsContent = {
      columns: 3,
      items: [
        {
          id: randomUUID(),
          icon: 'pi pi-bolt',
          title: { en: 'Fast Delivery', ar: 'توصيل سريع' },
          body: {
            en: '<p>We deliver your orders quickly and reliably, every time.</p>',
            ar: '<p>نقوم بتوصيل طلباتك بسرعة وموثوقية في كل مرة.</p>',
          },
        },
        {
          id: randomUUID(),
          icon: 'pi pi-shield',
          title: { en: 'Trusted Quality', ar: 'جودة موثوقة' },
          body: {
            en: '<p>Every product is checked to meet our high quality standards.</p>',
            ar: '<p>يتم فحص كل منتج للتأكد من مطابقته لمعايير الجودة العالية لدينا.</p>',
          },
        },
        {
          id: randomUUID(),
          icon: 'pi pi-heart',
          title: { en: 'Friendly Support', ar: 'دعم ودود' },
          body: {
            en: '<p>Our team is always here to help you with a smile.</p>',
            ar: '<p>فريقنا موجود دائمًا لمساعدتك بابتسامة.</p>',
          },
        },
      ],
    };

    const accordionContent: AccordionContent = {
      multiple: false,
      items: [
        {
          id: randomUUID(),
          header: {
            en: 'What are your business hours?',
            ar: 'ما هي ساعات العمل لديكم؟',
          },
          body: {
            en: '<p>We are open Sunday to Thursday, 9:00 AM to 6:00 PM.</p>',
            ar: '<p>نحن مفتوحون من الأحد إلى الخميس، من 9:00 صباحًا حتى 6:00 مساءً.</p>',
          },
        },
        {
          id: randomUUID(),
          header: {
            en: 'Do you offer refunds?',
            ar: 'هل تقدمون استرداد الأموال؟',
          },
          body: {
            en: '<p>Yes, we offer full refunds within 14 days of purchase.</p>',
            ar: '<p>نعم، نقدم استردادًا كاملاً للأموال خلال 14 يومًا من الشراء.</p>',
          },
        },
      ],
    };

    const contactContent: ContactContent = {
      description: {
        en: '<p>Have a question? Send us a message and we will get back to you soon.</p>',
        ar: '<p>هل لديك سؤال؟ أرسل لنا رسالة وسنعاود الاتصال بك قريبًا.</p>',
      },
      recipientEmail: 'owner@example.com',
      showPhone: true,
      whatsappNumber: '15551234567',
      successMessage: {
        en: 'Thanks! Your message has been sent.',
        ar: 'شكرًا لك! تم إرسال رسالتك.',
      },
    };

    const cardsSection = this.sections.create({
      pageId: page.id,
      type: SectionType.CARDS,
      order: 0,
      showInNav: true,
      anchor: 'services',
      title: { en: 'Why Choose Us', ar: 'لماذا تختارنا' },
      subtitle: {
        en: 'The benefits that set us apart',
        ar: 'المزايا التي تميزنا',
      },
      content: cardsContent,
      settings: { background: 'none', paddingY: 'lg', align: 'center' },
    });

    const accordionSection = this.sections.create({
      pageId: page.id,
      type: SectionType.ACCORDION,
      order: 1,
      showInNav: true,
      anchor: 'faq',
      title: { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
      subtitle: {
        en: 'Answers to common questions',
        ar: 'إجابات على الأسئلة الشائعة',
      },
      content: accordionContent,
      settings: { background: 'muted', paddingY: 'lg', align: 'left' },
    });

    const contactSection = this.sections.create({
      pageId: page.id,
      type: SectionType.CONTACT,
      order: 2,
      showInNav: true,
      anchor: 'contact',
      title: { en: 'Get in Touch', ar: 'تواصل معنا' },
      subtitle: {
        en: 'We would love to hear from you',
        ar: 'يسعدنا أن نسمع منك',
      },
      content: contactContent,
      settings: { background: 'none', paddingY: 'lg', align: 'center' },
    });

    await this.sections.save([cardsSection, accordionSection, contactSection]);
  }
}
