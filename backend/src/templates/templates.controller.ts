import { Controller, Get } from '@nestjs/common';
import { TEMPLATE_CATALOG, TemplateMeta } from './templates.catalog';

/** Exposes the starter-template catalogue for the create-site dialog. */
@Controller('templates')
export class TemplatesController {
  @Get()
  list(): TemplateMeta[] {
    return TEMPLATE_CATALOG;
  }
}
