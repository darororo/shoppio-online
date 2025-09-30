import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { SHOPPIO_BOT_NAME } from './telegram_bot.constants';


@Controller('telegram-bot')
export class TelegramBotController {
  constructor(@InjectBot(SHOPPIO_BOT_NAME) private readonly bot: Telegraf<Context>, private readonly telegramBotService: TelegramBotService) {

  }



  @Get("/me")
  async me() {
    const botName = (await this.bot.telegram.getMe()).username;
    return botName;
  }

}
