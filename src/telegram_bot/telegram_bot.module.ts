import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OllamaAiModule } from 'src/ollama_ai/ollama_ai.module'
import { TelegramBotEntity } from './entities/telegram_bot.entity'
import { TelegramBotSettingEntity } from './entities/telegram_bot_setting_entity'
import { TelegramChatEntity } from './entities/telegram_chat.entity'
import { TelegramBotController } from './telegram_bot.controller'
import { TelegramBotService } from './telegram_bot.service'
import { TelegramBotUpdate } from './telegram_bot.update'

@Module({
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotUpdate, TelegramBotController],
  exports: [TelegramBotUpdate],
  imports: [
    OllamaAiModule,
    TypeOrmModule.forFeature([TelegramBotEntity, TelegramChatEntity, TelegramBotSettingEntity]),
  ],
})
export class TelegramBotModule {}
