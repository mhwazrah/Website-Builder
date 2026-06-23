import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionDto } from './create-section.dto';

/**
 * Partial update for a section. Every field from CreateSectionDto becomes
 * optional; the `type` enum guard still applies when provided.
 */
export class UpdateSectionDto extends PartialType(CreateSectionDto) {}
