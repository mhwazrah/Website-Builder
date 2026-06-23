import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../entities/contact-message.entity';

/** Number of days after which read contact messages are eligible for pruning. */
const RETENTION_DAYS = 90;

/** Scheduled maintenance jobs (cron-driven cleanup). */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactMessages: Repository<ContactMessage>,
  ) {}

  /**
   * Deletes read contact messages older than the retention window.
   * Runs once per day at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pruneOldReadMessages(): Promise<void> {
    try {
      // Compute the cutoff: now minus the retention window.
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

      const result = await this.contactMessages
        .createQueryBuilder()
        .delete()
        .from(ContactMessage)
        .where('read = :read', { read: true })
        .andWhere('createdAt < :cutoff', { cutoff })
        .execute();

      // result.affected may be null on drivers that don't report it.
      const removed = result.affected ?? 0;
      this.logger.log(
        `Pruned ${removed} read contact message(s) older than ${RETENTION_DAYS} days.`,
      );
    } catch (err) {
      this.logger.error(
        'Failed to prune old read contact messages',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
