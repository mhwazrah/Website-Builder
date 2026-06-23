import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Language, LanguageMode } from '../../common/enums';

/**
 * Payload to create a new Site. `name` and `subdomain` are required; language
 * options fall back to entity defaults when omitted. The subdomain is further
 * normalized/validated in SitesService before persistence.
 */
export class CreateSiteDto {
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

  @IsOptional()
  @IsEnum(LanguageMode)
  languageMode?: LanguageMode;

  @IsOptional()
  @IsEnum(Language)
  defaultLanguage?: Language;

  /** Optional starter template id to seed the home page (see templates catalog). */
  @IsOptional()
  @IsString()
  templateId?: string;
}
