import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Language, LanguageMode } from '../../common/enums';
import type {
  FooterConfig,
  FooterSocialLink,
  LocalizedText,
  NavItem,
} from '../../common/types';

/**
 * Full set of mutable Site fields. UpdateSiteDto is a PartialType of this, so
 * every field becomes optional on PATCH while retaining its validators.
 */
class UpdateSiteFields {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 63)
  @Matches(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/, {
    message:
      'subdomain must be lowercase letters, digits, "-" or "." and cannot start/end with "-"/"."',
  })
  subdomain: string;

  @IsEnum(LanguageMode)
  languageMode: LanguageMode;

  @IsEnum(Language)
  defaultLanguage: Language;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'primaryColor must be a 6-digit hex color' })
  primaryColor: string;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'secondaryColor must be a 6-digit hex color' })
  secondaryColor: string;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'lightBackground must be a 6-digit hex color' })
  lightBackground: string;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, { message: 'darkBackground must be a 6-digit hex color' })
  darkBackground: string;

  @IsInt()
  @Min(0)
  @Max(100)
  borderRadius: number;

  @IsIn(['start', 'center', 'end'])
  navAlign: string;

  @IsIn(['light', 'dark', 'both'])
  themeMode: string;

  @IsBoolean()
  published: boolean;

  @IsObject()
  metaTitle: LocalizedText;

  @IsObject()
  metaDescription: LocalizedText;

  @IsOptional()
  @IsString()
  faviconUrl: string | null;

  @IsOptional()
  @IsString()
  logoLightUrl: string | null;

  @IsOptional()
  @IsString()
  logoDarkUrl: string | null;

  @IsOptional()
  @IsArray()
  // Keep the raw array of nav-item objects: the global ValidationPipe's
  // implicit conversion would otherwise coerce each object element into [].
  @Transform(({ value }) => value)
  navItems: NavItem[];

  @IsOptional()
  @IsString()
  @Length(0, 80)
  fontFamily: string | null;

  @IsOptional()
  @IsObject()
  // Preserve the nested arrays (links) verbatim.
  @Transform(({ value }) => value)
  footer: FooterConfig;

  @IsOptional()
  @IsArray()
  // Keep the raw array of social-link objects (see navItems note above).
  @Transform(({ value }) => value)
  socialLinks: FooterSocialLink[];
}

/**
 * PATCH payload for a Site. PartialType makes every field of UpdateSiteFields
 * optional while keeping each field's validators (applied only when present).
 */
export class UpdateSiteDto extends PartialType(UpdateSiteFields) {}
