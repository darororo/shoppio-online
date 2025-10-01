

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
    @InjectRepository(TelegramChatEntity) private readonly chatRepo: Repository<TelegramChatEntity>,
    @InjectBot(SHOPPIO_BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly telegramBotService: TelegramBotService,
  ) {

  }


  @Get("/me")
  async me() {
    const botName = (await this.bot.telegram.getMe()).username;
    return botName;
  }

  @Get("/chat")
  async getChat(@Query("chatId") chatId: String): Promise<any> {
    const id = Number(chatId)
    const chat = (await this.bot.telegram.getChat(id));
    return chat;
  }

  @Get("/chats")
  async getAllChats(): Promise<any> {
    return this.chatRepo.find()
  }

  // @Get("/chats")
  // async getChats() {
  //   const botName = await this.bot.telegram.getChat();
  //   return botName;
  // }
}
