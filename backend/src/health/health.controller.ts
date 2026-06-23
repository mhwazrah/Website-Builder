import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Liveness/readiness probe. Returns DB connectivity status.
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // GET /api/health → { status, db } — pings the DB with a trivial query.
  @Get()
  async check(): Promise<{ status: 'ok' | 'error'; db: boolean }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: true };
    } catch {
      return { status: 'error', db: false };
    }
  }
}
