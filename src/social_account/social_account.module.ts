import { Module } from '@nestjs/common';
import { SocialAccountService } from './social_account.service';
import { SocialAccountController } from './social_account.controller';

@Module({
  controllers: [SocialAccountController],
  providers: [SocialAccountService],
})
export class SocialAccountModule {}
