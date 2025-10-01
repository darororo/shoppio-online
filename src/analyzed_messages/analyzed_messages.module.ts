import { Module } from '@nestjs/common';
import { AnalyzedMessagesService } from './analyzed_messages.service';
import { AnalyzedMessagesController } from './analyzed_messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyzedMessage } from './entities/analyzed_message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyzedMessage])],
  controllers: [AnalyzedMessagesController],
  providers: [AnalyzedMessagesService],
  exports: [AnalyzedMessagesService],
})
export class AnalyzedMessagesModule {}
