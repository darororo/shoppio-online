import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { TelegramBotController } from './telegram_bot.controller';
import { TelegramBotUpdate } from './telegram_bot.update';
import { OllamaAiService } from 'src/ollama_ai/ollama_ai.service';
import { OllamaAiModule } from 'src/ollama_ai/ollama_ai.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotEntity } from './entities/telegram_bot.entity';
import { TelegramChatEntity } from './entities/telegram_chat.entity';
import { TelegramBotSettingEntity } from './entities/telegram_bot_setting_entity';

@Module({
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotUpdate, TelegramBotController],
  exports: [TelegramBotUpdate],
  imports: [OllamaAiModule, TypeOrmModule.forFeature([TelegramBotEntity, TelegramChatEntity, TelegramBotSettingEntity])]
})
export class TelegramBotModule { }
