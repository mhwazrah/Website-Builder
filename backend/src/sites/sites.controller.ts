import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  findAll() {
    return this.sites.findAll();
  }

  @Post()
  create(@Body() dto: CreateSiteDto) {
    return this.sites.create(dto);
  }

  /**
   * Subdomain availability. Declared BEFORE `:id` so "check-subdomain" is not
   * captured by the `:id` route param.
   */
  @Get('check-subdomain')
  checkSubdomain(
    @Query('value') value: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.sites.checkSubdomain(value ?? '', excludeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sites.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.sites.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sites.remove(id);
    return { deleted: true };
  }

  /** Promote the current draft tree to the published snapshot. */
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.sites.publish(id);
  }

  /**
   * Multipart logo upload. Field name `file`; `?mode=light|dark`. Reads the file
   * off the Fastify request via @fastify/multipart, then delegates to the
   * service which persists it and extracts a palette.
   */
  @Post(':id/logo')
  async uploadLogo(
    @Param('id') id: string,
    @Query('mode') mode: 'light' | 'dark',
    @Req() req: FastifyRequest,
  ) {
    const file = await (req as any).file(); // MultipartFile | undefined
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const buffer = await file.toBuffer();
    return this.sites.setLogo(
      id,
      mode === 'dark' ? 'dark' : 'light',
      buffer,
      file.mimetype,
      file.filename,
    );
  }
}
