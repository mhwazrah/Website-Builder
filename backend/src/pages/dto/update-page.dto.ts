import { PartialType } from '@nestjs/mapped-types';
import { CreatePageDto } from './create-page.dto';

/**
 * All CreatePageDto fields become optional for partial updates.
 */
export class UpdatePageDto extends PartialType(CreatePageDto) {}
