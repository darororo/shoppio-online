import { Module } from '@nestjs/common';
import { AnalyzedMessagesService } from './analyzed_messages.service';
import { AnalyzedMessagesController } from './analyzed_messages.controller';

@Module({
  controllers: [AnalyzedMessagesController],
  providers: [AnalyzedMessagesService],
})
export class AnalyzedMessagesModule {}
