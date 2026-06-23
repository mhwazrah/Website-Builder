import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// Exposes the /api/health endpoint. DataSource is provided globally by TypeOrmModule.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
