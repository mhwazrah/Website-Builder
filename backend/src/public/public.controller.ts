import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { Site } from '../entities/site.entity';
import { PublicService } from './public.service';
import { ContactSubmissionDto } from './dto/contact-submission.dto';

/** Public, unauthenticated endpoints under /api/public. */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /** GET /api/public/sites/:subdomain → published site tree (404 otherwise). */
  @Get('sites/:subdomain')
  async getSite(@Param('subdomain') subdomain: string): Promise<Site> {
    return this.publicService.getSite(subdomain);
  }

  /** POST /api/public/sites/:subdomain/contact → records + emails a contact message. */
  @Post('sites/:subdomain/contact')
  async submitContact(
    @Param('subdomain') subdomain: string,
    @Body() dto: ContactSubmissionDto,
  ): Promise<{ ok: true }> {
    return this.publicService.submitContact(subdomain, dto);
  }
}
