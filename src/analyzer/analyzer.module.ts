import { Module } from '@nestjs/common';
import { AnalyzerController } from './analyzer.controller';
import { FacebookModule } from 'src/facebook/facebook.module';
import { AnalyzedMessagesModule } from 'src/analyzed_messages/analyzed_messages.module';
import { ConfigModule } from '@nestjs/config';
import { AnalyzerService } from './analyzer.service';
import { GeminiService } from './gemini.service';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    FacebookModule,
    AnalyzedMessagesModule,
    OrdersModule,
    ConfigModule,
  ],
  controllers: [AnalyzerController],
  providers: [AnalyzerService, GeminiService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
