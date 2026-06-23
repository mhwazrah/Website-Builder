import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ColorExtractionService } from './color-extraction.service';
import { UploadController } from './upload.controller';
import { AssetsModule } from '../assets/assets.module';

/**
 * Provides file-persistence and logo colour-extraction services. No TypeORM
 * entities are involved here. Both services are exported for use by other
 * modules (e.g. the sites module's logo endpoint).
 */
@Module({
  imports: [AssetsModule],
  controllers: [UploadController],
  providers: [UploadService, ColorExtractionService],
  exports: [UploadService, ColorExtractionService],
})
export class UploadModule {}
