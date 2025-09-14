import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialMessagesService } from './social_messages.service';
import { SocialMessagesController } from './social_messages.controller';
import { SocialMessage } from './entities/social_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
import { Post } from 'src/posts/entities/post.entity';
import { FacebookModule } from 'src/facebook/facebook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialMessage, SocialPage, Post]),
    FacebookModule
  ],
  controllers: [SocialMessagesController],
  providers: [SocialMessagesService],
  exports: [SocialMessagesService],
})
export class SocialMessagesModule {}
