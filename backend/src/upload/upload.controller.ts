import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { UploadService } from './upload.service';
import { AssetsService } from '../assets/assets.service';

/** Content types for the file extensions we persist. */
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
};

/**
 * Generic image upload used by section editors (card images, gallery, hero,
 * carousel, avatars). Accepts a single multipart `file` and returns its public
 * URL. Logos have their own endpoint on the sites controller.
 */
@Controller('uploads')
export class UploadController {
  constructor(
    private readonly upload: UploadService,
    private readonly assets: AssetsService,
  ) {}

  @Post('image')
  async uploadImage(@Req() req: FastifyRequest): Promise<{ url: string }> {
    const file = await (req as unknown as {
      file: () => Promise<
        | { toBuffer: () => Promise<Buffer>; mimetype: string; filename: string }
        | undefined
      >;
    }).file();

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!String(file.mimetype ?? '').startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const buffer = await file.toBuffer();
    const url = await this.upload.saveOptimizedImage(buffer, file.filename);
    // Record in the media library for reuse (best-effort).
    await this.assets.record({
      url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length,
    });
    return { url };
  }

  /**
   * Serve an uploaded file by name, streamed from disk on every request so
   * files uploaded after the server started are served too (the reason this
   * replaces @nestjs/serve-static). Excluded from the global `/api` prefix in
   * main.ts so it resolves at `/uploads/:filename`.
   */
  @Get(':filename')
  serveFile(
    @Param('filename') filename: string,
    @Res() reply: FastifyReply,
  ): void {
    // `basename` strips any path components, preventing `../` traversal.
    const safe = basename(filename);
    const fullPath = join(process.cwd(), 'uploads', safe);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }
    const type = MIME_TYPES[extname(safe).toLowerCase()] ?? 'application/octet-stream';
    void reply
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .type(type)
      .send(createReadStream(fullPath));
  }
}
