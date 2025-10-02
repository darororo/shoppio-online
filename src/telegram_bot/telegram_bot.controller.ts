

import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { SHOPPIO_BOT_NAME } from './telegram_bot.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramChatEntity } from './entities/telegram_chat.entity';
import { Repository } from 'typeorm';


@Controller('telegram-bot')
export class TelegramBotController {
  constructor(
    private readonly botService: TelegramBotService,
  ) {

  }

  @Get("/me")
  async me() {
    return this.botService.getMe();
  }

  @Get("/chat")
  async getChat(@Query("chatId") chatId: String): Promise<any> {
    return this.botService.getChat(Number(chatId));
  }

  @Get("/chats")
  async getAllChats(): Promise<any> {
    return this.botService.getAllChats()
  }

  @Post("/send-photo")
  async sendPhoto(@Body("chatId") chatId: number, @Body("photoUrl") photoUrl: string) {
    return this.botService.sendPhoto(chatId, photoUrl)
  }
}
