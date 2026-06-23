import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from '../entities/site.entity';
import { Page } from '../entities/page.entity';
import { Section } from '../entities/section.entity';
import { UploadModule } from '../upload/upload.module';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Site, Page, Section]), UploadModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
