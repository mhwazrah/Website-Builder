import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../entities/page.entity';
import { Site } from '../entities/site.entity';
import { Section } from '../entities/section.entity';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Site, Section])],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
