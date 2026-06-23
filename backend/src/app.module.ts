import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactMessage } from './entities/contact-message.entity';
import { Page } from './entities/page.entity';
import { Section } from './entities/section.entity';
import { Site } from './entities/site.entity';

import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { PagesModule } from './pages/pages.module';
import { PublicModule } from './public/public.module';
import { SeedModule } from './seed/seed.module';
import { SectionsModule } from './sections/sections.module';
import { SitesModule } from './sites/sites.module';
import { TasksModule } from './tasks/tasks.module';
import { UploadModule } from './upload/upload.module';
import { TemplatesModule } from './templates/templates.module';
import { MessagesModule } from './messages/messages.module';
import { AssetsModule } from './assets/assets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // NOTE: uploaded files are served by UploadController's GET /uploads/:file
    // (streamed from disk per request) — NOT @nestjs/serve-static, which only
    // serves files that existed at startup and 404s anything uploaded after.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'builder'),
        password: config.get<string>('DB_PASSWORD', 'builder_pass'),
        database: config.get<string>('DB_DATABASE', 'website_builder'),
        entities: [Site, Page, Section, ContactMessage],
        synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
        autoLoadEntities: true,
      }),
    }),

    SitesModule,
    PagesModule,
    SectionsModule,
    UploadModule,
    MailModule,
    PublicModule,
    TasksModule,
    SeedModule,
    HealthModule,
    TemplatesModule,
    MessagesModule,
    AssetsModule,
  ],
})
export class AppModule {}
