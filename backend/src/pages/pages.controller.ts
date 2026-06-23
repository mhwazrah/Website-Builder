import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ReorderDto } from './dto/reorder.dto';

/**
 * Page routes use full method-level paths (no controller prefix) because they
 * span two resource roots: `sites/:siteId/pages` and `pages/:id`.
 * The global `api` prefix is applied in main.ts.
 */
@Controller()
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Post('sites/:siteId/pages')
  create(@Param('siteId') siteId: string, @Body() dto: CreatePageDto) {
    return this.pages.create(siteId, dto);
  }

  // Reorder is declared before the generic `:id` patch isn't a concern here
  // since the paths differ structurally, but keep it grouped for clarity.
  @Patch('sites/:siteId/pages/reorder')
  reorder(@Param('siteId') siteId: string, @Body() dto: ReorderDto) {
    return this.pages.reorder(siteId, dto.ids);
  }

  @Patch('pages/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  @Delete('pages/:id')
  remove(@Param('id') id: string) {
    return this.pages.remove(id);
  }

  @Post('pages/:id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.pages.duplicate(id);
  }
}
