import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
// import { Post } from 'src/posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialMessage, SocialPage]),
  ],
  controllers: [FacebookController],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
