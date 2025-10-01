import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { TelegramBotController } from './telegram_bot.controller';
import { TelegramBotUpdate } from './telegram_bot.update';
import { OllamaAiService } from 'src/ollama_ai/ollama_ai.service';
import { OllamaAiModule } from 'src/ollama_ai/ollama_ai.module';

@Module({
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotUpdate, TelegramBotController],
  exports: [TelegramBotUpdate],
  imports: [OllamaAiModule]
})
export class TelegramBotModule { }
