import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import type { LocalizedText } from '../../common/types';

/**
 * Payload for creating a page under a site. `title` is a LocalizedText object;
 * we validate it as a plain object (don't over-validate the inner en/ar keys).
 */
export class CreatePageDto {
  // Bilingual page title; optional inner keys validated loosely.
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  // URL-safe slug: lowercase letters, digits and dashes only.
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, digits and dashes',
  })
  slug: string;

  @IsOptional()
  @IsBoolean()
  showInNav?: boolean;

  @IsOptional()
  @IsBoolean()
  isHome?: boolean;
}
