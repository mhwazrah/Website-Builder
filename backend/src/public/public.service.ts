import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Site } from '../entities/site.entity';
import { ContactMessage } from '../entities/contact-message.entity';
import { Section } from '../entities/section.entity';
import { SectionType } from '../common/enums';
import { ContactContent } from '../common/section-content';
import { MailService } from '../mail/mail.service';
import { ContactSubmissionDto } from './dto/contact-submission.dto';

/**
 * Read-only public surface for a published site plus contact-form intake.
 * No auth: only `published` sites are exposed.
 */
@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Site)
    private readonly sites: Repository<Site>,
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
    private readonly mailService: MailService,
  ) {}

  /** Normalize a subdomain the same way the sites module does (trim + lowercase). */
  private normalizeSubdomain(value: string): string {
    return (value ?? '').trim().toLowerCase();
  }

  /**
   * Load a published site (with pages + sections, ordered) by subdomain.
   * Throws NotFound if it doesn't exist or isn't published.
   */
  async getSite(subdomain: string): Promise<Site> {
    const site = await this.sites.findOne({
      where: { subdomain: this.normalizeSubdomain(subdomain), published: true },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    // Serve the frozen published snapshot (not the live draft).
    if (site.publishedData?.pages) {
      const { publishedData, ...rest } = site;
      return {
        ...rest,
        pages: publishedData.pages,
        navItems: publishedData.navItems ?? rest.navItems ?? [],
      } as unknown as Site;
    }

    // Fallback for sites that are flagged published but were never snapshotted
    // (e.g. legacy/seed data): serve the live tree.
    const live = await this.sites.findOne({
      where: { id: site.id },
      relations: { pages: { sections: true } },
      order: { pages: { order: 'ASC', sections: { order: 'ASC' } } },
    });
    return live!;
  }

  /**
   * Persist a contact message for a published site and, if the resolved contact
   * section declares a recipient email, dispatch a notification via MailService.
   */
  async submitContact(
    subdomain: string,
    dto: ContactSubmissionDto,
  ): Promise<{ ok: true }> {
    const site = await this.getSite(subdomain);

    // Persist the inbound message regardless of email delivery.
    const message = this.messages.create({
      siteId: site.id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      subject: dto.subject?.trim() || null,
      message: dto.message,
    });
    await this.messages.save(message);

    // Resolve the recipient from the targeted (or first) contact section.
    const recipientEmail = this.resolveRecipientEmail(site, dto.sectionId);
    if (recipientEmail) {
      await this.mailService.sendContactEmail({
        to: recipientEmail,
        siteName: site.name,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        subject: dto.subject?.trim() || null,
        message: dto.message,
      });
    }

    return { ok: true };
  }

  /**
   * Pick the contact section's recipient email: prefer the section matching
   * `sectionId`, else the first section of type `contact`. Returns null when
   * none is found or no recipientEmail is configured.
   */
  private resolveRecipientEmail(
    site: Site,
    sectionId?: string,
  ): string | null {
    const sections: Section[] = (site.pages ?? []).flatMap(
      (page) => page.sections ?? [],
    );

    let section: Section | undefined;
    if (sectionId) {
      section = sections.find((s) => s.id === sectionId);
    }
    if (!section) {
      section = sections.find((s) => s.type === SectionType.CONTACT);
    }
    if (!section) {
      return null;
    }

    const content = section.content as Partial<ContactContent> | undefined;
    const recipient = content?.recipientEmail;
    return typeof recipient === 'string' && recipient.trim().length > 0
      ? recipient.trim()
      : null;
  }
}
