import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Site } from '../entities/site.entity';
import { ContactMessage } from '../entities/contact-message.entity';
import { MailModule } from '../mail/mail.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/** Read-only public site access + contact form intake. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Site, ContactMessage]),
    MailModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
