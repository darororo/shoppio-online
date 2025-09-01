import { Module } from '@nestjs/common';
import { PostDistributionsService } from './post_distributions.service';
import { PostDistributionsController } from './post_distributions.controller';

@Module({
  controllers: [PostDistributionsController],
  providers: [PostDistributionsService],
})
export class PostDistributionsModule {}
