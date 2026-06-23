import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SectionType } from '../../common/enums';
import type { LocalizedText } from '../../common/types';
import type { SectionContent, SectionSettings } from '../../common/section-content';

/**
 * Payload for creating a section on a page. `type` is required and selects the
 * renderer; `content`/`settings` are loosely typed objects validated per type
 * at the service layer. Localized text fields validate as objects only (we do
 * not over-validate the inner `en`/`ar` keys).
 */
export class CreateSectionDto {
  @IsEnum(SectionType)
  type: SectionType;

  @IsObject()
  @IsOptional()
  title?: LocalizedText;

  @IsObject()
  @IsOptional()
  subtitle?: LocalizedText;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  anchor?: string | null;

  @IsBoolean()
  @IsOptional()
  showInNav?: boolean;

  @IsObject()
  @IsOptional()
  content?: SectionContent;

  @IsObject()
  @IsOptional()
  settings?: SectionSettings;
}
