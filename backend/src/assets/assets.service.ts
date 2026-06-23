import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Asset } from '../entities/asset.entity';

const IMAGE_EXT = /\.(png|webp|jpe?g|gif|avif)$/i;
const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/** Media-library store: records uploaded images and lists them for reuse. */
@Injectable()
export class AssetsService implements OnModuleInit {
  constructor(
    @InjectRepository(Asset) private readonly repo: Repository<Asset>,
  ) {}

  /** On boot, ensure every image already on disk shows in the library, even
   *  those uploaded before they were recorded (e.g. logos, or older sessions).
   *  Favicons are auto-generated, so they're excluded. Idempotent by URL. */
  async onModuleInit(): Promise<void> {
    try {
      const dir = join(process.cwd(), 'uploads');
      if (!existsSync(dir)) return;
      const files = (await readdir(dir)).filter(
        (f) => IMAGE_EXT.test(f) && !f.startsWith('favicon-'),
      );
      const onDisk = new Set(files.map((f) => `/uploads/${f}`));

      // Prune library records whose underlying file no longer exists (so the
      // gallery never shows broken/black thumbnails for deleted files).
      const all = await this.repo.find({ select: { id: true, url: true } });
      const orphans = all.filter((a) => !onDisk.has(a.url)).map((a) => a.id);
      if (orphans.length) await this.repo.delete(orphans);

      if (!files.length) return;
      const known = new Set(all.map((a) => a.url));
      const missing = files.filter((f) => !known.has(`/uploads/${f}`));
      if (!missing.length) return;
      const rows = await Promise.all(
        missing.map(async (f) => {
          let size = 0;
          try {
            size = (await stat(join(dir, f))).size;
          } catch {
            /* ignore */
          }
          return this.repo.create({
            url: `/uploads/${f}`,
            filename: f,
            mimetype: MIME_BY_EXT[extname(f).toLowerCase()] ?? null,
            size,
          });
        }),
      );
      await this.repo.save(rows);
    } catch {
      /* best-effort backfill — never block startup */
    }
  }

  /** Persist a media-library entry for an uploaded image (best-effort). */
  async record(data: {
    url: string;
    filename?: string | null;
    mimetype?: string | null;
    size?: number;
    width?: number | null;
    height?: number | null;
  }): Promise<Asset> {
    return this.repo.save(
      this.repo.create({
        url: data.url,
        filename: data.filename ?? null,
        mimetype: data.mimetype ?? null,
        size: data.size ?? 0,
        width: data.width ?? null,
        height: data.height ?? null,
      }),
    );
  }

  async list(
    opts: { page?: number; limit?: number } = {},
  ): Promise<{ items: Asset[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 40));
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Asset ${id} not found`);
    }
    return { deleted: true };
  }
}
