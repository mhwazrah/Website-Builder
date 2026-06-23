import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from '../entities/contact-message.entity';
import { TasksService } from './tasks.service';

/**
 * Hosts scheduled background jobs.
 * ScheduleModule.forRoot() is registered globally in AppModule, so this
 * module only needs the entity repo and the cron-bearing service.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage])],
  providers: [TasksService],
})
export class TasksModule {}
