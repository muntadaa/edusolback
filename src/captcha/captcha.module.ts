import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes in seconds (default TTL - actual TTL set per item)
      max: 10000, // Maximum number of CAPTCHAs in memory
      isGlobal: false, // Scoped to this module
    }),
  ],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService], // Export for use in AuthModule
})
export class CaptchaModule {}
