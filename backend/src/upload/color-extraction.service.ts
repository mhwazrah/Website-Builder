import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import type { ColorPalette } from '../common/types';

/** A quantized colour bucket with its frequency and average RGB. */
interface ColorBucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

/** Safe default palette used whenever extraction fails or yields nothing. */
const FALLBACK_PALETTE: ColorPalette = {
  colors: ['#2563eb', '#9333ea'],
  primary: '#2563eb',
  secondary: '#9333ea',
};

@Injectable()
export class ColorExtractionService {
  /**
   * Extract a small brand palette from an uploaded logo buffer. Resizes to a
   * tiny thumbnail, reads raw RGBA pixels, ignores transparent / near-white /
   * near-black pixels, quantizes the rest into buckets and ranks by frequency.
   */
  async extractFromBuffer(buffer: Buffer): Promise<ColorPalette> {
    try {
      const { data, info } = await sharp(buffer)
        .resize(64, 64, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const channels = info.channels; // 4 after ensureAlpha()
      const buckets = new Map<string, ColorBucket>();

      for (let i = 0; i + channels - 1 < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = channels >= 4 ? data[i + 3] : 255;

        // Skip near-transparent pixels.
        if (a < 32) continue;
        // Skip near-white and near-black pixels (likely background / outline).
        if (r > 235 && g > 235 && b > 235) continue;
        if (r < 16 && g < 16 && b < 16) continue;

        // Quantize each channel to the nearest 32 to merge similar colours.
        const qr = this.quantize(r);
        const qg = this.quantize(g);
        const qb = this.quantize(b);
        const key = `${qr},${qg},${qb}`;

        const existing = buckets.get(key);
        if (existing) {
          // Track running totals so we can average back to a representative RGB.
          existing.r += r;
          existing.g += g;
          existing.b += b;
          existing.count += 1;
        } else {
          buckets.set(key, { r, g, b, count: 1 });
        }
      }

      if (buckets.size === 0) {
        return FALLBACK_PALETTE;
      }

      // Order buckets by frequency (most dominant first) and take the top ~6.
      const ordered = Array.from(buckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((bucket) => ({
          r: Math.round(bucket.r / bucket.count),
          g: Math.round(bucket.g / bucket.count),
          b: Math.round(bucket.b / bucket.count),
        }));

      const colors = ordered.map((c) => this.rgbToHex(c.r, c.g, c.b));

      // Prefer vibrant, not-too-light colours for the brand picks; fall back to
      // the full set only if nothing vibrant was found.
      const vibrant = ordered.filter((c) => this.isVibrant(c));
      const pool = vibrant.length ? vibrant : ordered;

      // Primary = the most dominant vibrant colour. If it is still too light to
      // read as a brand colour, fall back to a sensible default.
      const primaryRgb = this.pickVibrant(pool) ?? pool[0];
      let primary = this.rgbToHex(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      if (this.relLuminance(primaryRgb) > 0.82) {
        primary = FALLBACK_PALETTE.primary;
      }

      // Secondary = the pool colour most different from the primary.
      let secondaryRgb: { r: number; g: number; b: number } | undefined;
      let maxDist = -1;
      for (const c of pool) {
        if (c === primaryRgb) continue;
        const dist = this.distance(c, primaryRgb);
        if (dist > maxDist) {
          maxDist = dist;
          secondaryRgb = c;
        }
      }
      let secondary =
        secondaryRgb && this.relLuminance(secondaryRgb) <= 0.85
          ? this.rgbToHex(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
          : FALLBACK_PALETTE.secondary;
      if (secondary === primary) secondary = FALLBACK_PALETTE.secondary;

      return { colors, primary, secondary };
    } catch {
      // Any decoding / processing error yields the safe fallback palette.
      return FALLBACK_PALETTE;
    }
  }

  /** Round a 0–255 channel value to the nearest multiple of 32. */
  private quantize(value: number): number {
    return Math.min(255, Math.round(value / 32) * 32);
  }

  /** Euclidean distance in RGB space between two colours. */
  private distance(
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
  ): number {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Pick the most "vibrant" colour from the dominant candidates, biased toward
   * the more dominant ones. Vibrancy here = HSL-style saturation scaled by how
   * far it sits from the mid grey line.
   */
  private pickVibrant(
    colors: Array<{ r: number; g: number; b: number }>,
  ): { r: number; g: number; b: number } | null {
    let best: { r: number; g: number; b: number } | null = null;
    let bestScore = -1;
    // Weight earlier (more dominant) candidates higher so we don't pick a rare
    // but extremely saturated speck over the real brand colour.
    colors.forEach((c, index) => {
      const sat = this.saturation(c);
      const weight = 1 - index * 0.1; // dominance falloff
      const score = sat * weight;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    });
    return best;
  }

  /** Approximate HSL saturation (0–1) for an RGB colour. */
  private saturation(c: { r: number; g: number; b: number }): number {
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const l = (max + min) / 2;
    const d = max - min;
    return l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }

  /** Relative luminance (0–1) — how light a colour reads. */
  private relLuminance(c: { r: number; g: number; b: number }): number {
    return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  }

  /** A colour usable as a brand colour: saturated enough and mid-toned. */
  private isVibrant(c: { r: number; g: number; b: number }): boolean {
    const lum = this.relLuminance(c);
    return this.saturation(c) >= 0.18 && lum >= 0.06 && lum <= 0.82;
  }

  /** Convert a single 0–255 channel to a 2-char hex string. */
  private channelToHex(value: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, '0');
  }

  /** Convert RGB to a `#rrggbb` hex string. */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${this.channelToHex(r)}${this.channelToHex(g)}${this.channelToHex(b)}`;
  }
}
