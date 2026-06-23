import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderDto } from './dto/reorder.dto';

/**
 * Section endpoints. Paths are declared in full (no shared prefix) because
 * sections are addressed both nested under a page (create/reorder) and flat
 * by id (update/delete). The global `api` prefix is applied in main.ts.
 */
@Controller()
export class SectionsController {
  constructor(private readonly sections: SectionsService) {}

  /** POST /api/pages/:pageId/sections */
  @Post('pages/:pageId/sections')
  create(@Param('pageId') pageId: string, @Body() dto: CreateSectionDto) {
    return this.sections.create(pageId, dto);
  }

  /**
   * PATCH /api/pages/:pageId/sections/reorder
   * Declared before the flat `sections/:id` patch is irrelevant here (different
   * base segment), but kept grouped with the nested routes for clarity.
   */
  @Patch('pages/:pageId/sections/reorder')
  reorder(@Param('pageId') pageId: string, @Body() dto: ReorderDto) {
    return this.sections.reorder(pageId, dto.ids);
  }

  /** PATCH /api/sections/:id */
  @Patch('sections/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.sections.update(id, dto);
  }

  /** DELETE /api/sections/:id */
  @Delete('sections/:id')
  remove(@Param('id') id: string) {
    return this.sections.remove(id);
  }

  /** POST /api/sections/:id/duplicate */
  @Post('sections/:id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.sections.duplicate(id);
  }
}
