import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** Arguments for composing/sending a contact-form notification email. */
export interface SendContactEmailArgs {
  to: string;
  siteName: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}

/**
 * MailService — wraps a Nodemailer transport built from environment config.
 *
 * If MAIL_HOST is empty/undefined the service falls back to a JSON transport so
 * that local/dev environments never attempt a real SMTP connection; the composed
 * message is logged to the console instead of being delivered.
 *
 * sendContactEmail never throws — delivery failures are caught and logged so the
 * public contact endpoint can always return success to the visitor.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  /** True when running without a real SMTP host (JSON/console fallback). */
  private readonly jsonOnly: boolean;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'no-reply@example.com');

    const host = (this.config.get<string>('MAIL_HOST') ?? '').trim();

    if (!host) {
      // No SMTP host configured — log emails instead of sending them.
      this.jsonOnly = true;
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn(
        'MAIL_HOST not set — using JSON transport (emails will be logged, not sent).',
      );
    } else {
      this.jsonOnly = false;
      const port = Number(this.config.get('MAIL_PORT', 587));
      // MAIL_SECURE === 'true' enables implicit TLS (typically port 465).
      const secure = String(this.config.get('MAIL_SECURE', 'false')) === 'true';
      const user = this.config.get<string>('MAIL_USER');
      const pass = this.config.get<string>('MAIL_PASSWORD');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        // Only attach auth when credentials are actually provided.
        auth: user ? { user, pass } : undefined,
      });
    }
  }

  /**
   * Compose and send a contact-form notification. Always resolves; errors are
   * caught and logged so the caller (public contact endpoint) never fails.
   */
  async sendContactEmail(args: SendContactEmailArgs): Promise<void> {
    try {
      const subject = args.subject
        ? `${args.subject} — ${args.siteName}`
        : `New contact message — ${args.siteName}`;
      const text = this.buildText(args);
      const html = this.buildHtml(args);

      const info = await this.transporter.sendMail({
        from: this.from,
        to: args.to,
        replyTo: args.email,
        subject,
        text,
        html,
      });

      if (this.jsonOnly) {
        // jsonTransport exposes the serialized message on info.message.
        const payload =
          (info as { message?: unknown }).message ?? JSON.stringify(info);
        this.logger.log(
          `Contact email (not sent — JSON transport) to ${args.to}:\n${payload}`,
        );
      } else {
        this.logger.log(
          `Contact email sent to ${args.to} (messageId=${(info as { messageId?: string }).messageId ?? 'n/a'}).`,
        );
      }
    } catch (err) {
      // Never propagate mail errors to the caller.
      this.logger.error(
        `Failed to send contact email to ${args.to}: ${(err as Error)?.message ?? err}`,
        (err as Error)?.stack,
      );
    }
  }

  /** Plain-text body for clients that don't render HTML. */
  private buildText(args: SendContactEmailArgs): string {
    const lines = [
      `New contact message from ${args.siteName}`,
      '',
      `Name:    ${args.name}`,
      `Email:   ${args.email}`,
    ];
    if (args.phone) {
      lines.push(`Phone:   ${args.phone}`);
    }
    if (args.subject) {
      lines.push(`Subject: ${args.subject}`);
    }
    lines.push('', 'Message:', args.message, '');
    return lines.join('\n');
  }

  /** Readable HTML body. */
  private buildHtml(args: SendContactEmailArgs): string {
    const phoneRow = args.phone
      ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#374151;">Phone</td><td style="padding:4px 0;color:#111827;">${this.escape(args.phone)}</td></tr>`
      : '';
    const subjectRow = args.subject
      ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#374151;">Subject</td><td style="padding:4px 0;color:#111827;">${this.escape(args.subject)}</td></tr>`
      : '';

    return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 4px;font-size:18px;">New contact message</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">via ${this.escape(args.siteName)}</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#374151;">Name</td><td style="padding:4px 0;color:#111827;">${this.escape(args.name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#374151;">Email</td><td style="padding:4px 0;color:#111827;"><a href="mailto:${this.escape(args.email)}" style="color:#2563eb;text-decoration:none;">${this.escape(args.email)}</a></td></tr>
        ${phoneRow}
        ${subjectRow}
      </table>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <div style="font-weight:600;color:#374151;font-size:14px;margin-bottom:6px;">Message</div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.5;color:#111827;">${this.escape(args.message)}</div>
      </div>
    </div>
  </body>
</html>`;
  }

  /** Escape user-supplied text for safe inclusion in HTML. */
  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
