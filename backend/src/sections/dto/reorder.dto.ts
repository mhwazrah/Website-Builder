import { IsArray, IsString } from 'class-validator';

/**
 * Reorder payload: the full ordered list of section ids for a page. The
 * section's `order` is set to the id's index in this array.
 */
export class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
