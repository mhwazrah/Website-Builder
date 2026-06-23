import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * Payload posted from a public site's Contact section.
 * `sectionId` lets the submission target a specific contact section's recipient;
 * if omitted, the service falls back to the site's first contact section.
 */
export class ContactSubmissionDto {
  @IsString()
  @Length(1, 160)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @Length(1, 5000)
  message: string;

  @IsOptional()
  @IsString()
  sectionId?: string;
}
