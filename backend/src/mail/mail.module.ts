import { Module } from '@nestjs/common';

import { MailService } from './mail.service';

/**
 * MailModule — provides MailService (Nodemailer wrapper).
 * ConfigService is available globally (ConfigModule.forRoot({ isGlobal: true })),
 * so no extra imports are required here.
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
