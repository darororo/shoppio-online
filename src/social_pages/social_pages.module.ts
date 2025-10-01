import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialPage } from './entities/social_page.entity';
import { SocialPagesService } from './social_pages.service';
import { SocialPagesController } from './social_pages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocialPage])],
  controllers: [SocialPagesController],
  providers: [SocialPagesService],
  exports: [SocialPagesService],
})
export class SocialPagesModule {}
