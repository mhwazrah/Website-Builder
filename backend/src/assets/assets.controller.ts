import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';

/** Media-library browse/delete API used by the image picker. */
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.assets.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assets.remove(id);
  }
}
