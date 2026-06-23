import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Persists uploaded image buffers to the local `uploads/` directory and returns
 * a public path that the static-file middleware serves under `/uploads/...`.
 */
@Injectable()
export class UploadService {
  /**
   * Write an image buffer to disk under `process.cwd()/uploads` with a random
   * UUID filename, preserving the original extension. Returns the public path.
   */
  async saveImage(buffer: Buffer, originalName: string): Promise<string> {
    const dir = path.join(process.cwd(), 'uploads');
    // Ensure the uploads directory exists (no-op if already present).
    fs.mkdirSync(dir, { recursive: true });

    // Derive an extension from the original filename, defaulting to .png.
    let ext = path.extname(originalName || '').toLowerCase();
    if (!ext || ext.length > 5) {
      ext = '.png';
    }

    const filename = crypto.randomUUID() + ext;
    const fullPath = path.join(dir, filename);

    await fs.promises.writeFile(fullPath, buffer);

    // Public URL path served statically by the app.
    return `/uploads/${filename}`;
  }

  /**
   * Resize + recompress an uploaded image to a sensible web size (max 1600px
   * wide, WebP) before persisting. Falls back to a raw save if the buffer
   * cannot be processed as an image.
   */
  async saveOptimizedImage(buffer: Buffer, originalName: string): Promise<string> {
    const dir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    try {
      const out = await sharp(buffer)
        .rotate() // honour EXIF orientation
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const filename = crypto.randomUUID() + '.webp';
      await fs.promises.writeFile(path.join(dir, filename), out);
      return `/uploads/${filename}`;
    } catch {
      // Not a processable image — store the original bytes as-is.
      return this.saveImage(buffer, originalName);
    }
  }

  /**
   * Generate a square favicon (64x64 PNG, transparent padding) from a logo
   * buffer and persist it. Returns the public path, or null if it can't be
   * generated.
   */
  async saveFavicon(buffer: Buffer): Promise<string | null> {
    const dir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    try {
      const out = await sharp(buffer)
        .resize(64, 64, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      const filename = `favicon-${crypto.randomUUID()}.png`;
      await fs.promises.writeFile(path.join(dir, filename), out);
      return `/uploads/${filename}`;
    } catch {
      return null;
    }
  }
}
