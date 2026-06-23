import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Page } from '../entities/page.entity';
import { Section } from '../entities/section.entity';
import { Site } from '../entities/site.entity';
import { SeedService } from './seed.service';

/**
 * Wires up the demo-data seeder. Registers the repositories it needs and
 * provides SeedService, which runs OnApplicationBootstrap.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Site, Page, Section])],
  providers: [SeedService],
})
export class SeedModule {}
