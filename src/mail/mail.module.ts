import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, MailTemplateService],
  exports: [MailService, MailTemplateService],
})
export class MailModule {}
