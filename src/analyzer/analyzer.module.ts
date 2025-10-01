import { Module } from '@nestjs/common';
import { AnalyzerController } from './analyzer.controller';
import { SocialMessagesModule } from 'src/social_messages/social_messages.module';
import { AnalyzedMessagesModule } from 'src/analyzed_messages/analyzed_messages.module';
import { ConfigModule } from '@nestjs/config';
import { AnalyzerService } from './analyzer.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [SocialMessagesModule, AnalyzedMessagesModule, ConfigModule],
  controllers: [AnalyzerController],
  providers: [AnalyzerService, GeminiService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
