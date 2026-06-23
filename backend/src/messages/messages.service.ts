import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../entities/contact-message.entity';

export interface MessageListResult {
  items: ContactMessage[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

/** Admin read/manage access to contact-form submissions for a site. */
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  async list(
    siteId: string,
    opts: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ): Promise<MessageListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const where = opts.unreadOnly
      ? { siteId, read: false }
      : { siteId };
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unread = await this.repo.count({ where: { siteId, read: false } });
    return { items, total, unread, page, limit };
  }

  async unreadCount(siteId: string): Promise<{ count: number }> {
    return { count: await this.repo.count({ where: { siteId, read: false } }) };
  }

  async setRead(id: string, read: boolean): Promise<ContactMessage> {
    const message = await this.repo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    message.read = read;
    return this.repo.save(message);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    return { deleted: true };
  }
}
