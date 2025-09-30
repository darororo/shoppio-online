import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { TelegramBotController } from './telegram_bot.controller';
import { TelegramBotUpdate } from './telegram_bot.update';

@Module({
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotUpdate, TelegramBotController],
  exports: [TelegramBotUpdate]
})
export class TelegramBotModule { }
