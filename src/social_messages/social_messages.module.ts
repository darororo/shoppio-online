import { Module } from '@nestjs/common';
import { SocialMessagesService } from './social_messages.service';
import { SocialMessagesController } from './social_messages.controller';

@Module({
  controllers: [SocialMessagesController],
  providers: [SocialMessagesService],
})
export class SocialMessagesModule {}
