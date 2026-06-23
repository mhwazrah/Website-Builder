import { IsArray, IsString } from 'class-validator';

/**
 * Ordered list of entity ids. Each id's new `order` is its index in this array.
 */
export class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
