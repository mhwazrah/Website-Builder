import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../entities/section.entity';
import { Page } from '../entities/page.entity';
import { SitesModule } from '../sites/sites.module';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';

/**
 * Section CRUD + reorder + duplicate. Touches Section + Page, and uses
 * SitesService (via SitesModule) to flag the owning site's draft dirty.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Section, Page]), SitesModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
