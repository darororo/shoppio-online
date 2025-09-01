import { Module } from '@nestjs/common';
import { SocialPagesService } from './social_pages.service';
import { SocialPagesController } from './social_pages.controller';

@Module({
  controllers: [SocialPagesController],
  providers: [SocialPagesService],
})
export class SocialPagesModule {}
