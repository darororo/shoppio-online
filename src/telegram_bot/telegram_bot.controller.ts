

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { TelegramBotService } from './telegram_bot.service';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { SHOPPIO_BOT_NAME } from './telegram_bot.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramChatEntity } from './entities/telegram_chat.entity';
import { Repository } from 'typeorm';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';


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
  async getChat(@Query("chatId") chatId: string): Promise<any> {
    return this.botService.getChat(chatId);
  }

  @Get("/chats")
  async getAllChats(): Promise<any> {
    return this.botService.getAllChats()
  }

  @Post("/send-photo")
  @UseInterceptors(FileInterceptor('photo'))
  async sendPhoto(@Body("chatId") chatId: string, @Body("photoUrl") photoUrl: string, @UploadedFile() photo: Express.Multer.File) {
    if (photoUrl) return this.botService.sendPhotoUrl(chatId, photoUrl);

    return this.botService.sendPhotoFile(chatId, photo);
  }

  @Post("/send-photo-many")
  @UseInterceptors(FilesInterceptor('photos'))
  async sendPhotoMany(@Body("chatId") chatId: string, @Body("photoUrls") photoUrls: string[], @UploadedFiles() photos: Express.Multer.File[]) {
    if (photoUrls.length > 0) return this.botService.sendPhotoUrlMany(chatId, photoUrls);

    return this.botService.sendPhotoFileMany(chatId, photos);
  }

  @Post("/send-photo-many-to-chats")
  @UseInterceptors(FilesInterceptor('photos'))
  async sendPhotoManyToChats(@Body("chatIds") chatIds: string[], @UploadedFiles() photos: Express.Multer.File[]) {
    // if (photoUrls.length > 0) return this.botService.sendPhotoUrlManyToChats(chatIds, photoUrls);
    return this.botService.sendPhotoFileManyToChats(chatIds, photos);
  }

  @Post("/send-video")
  @UseInterceptors(FileInterceptor('video'))
  async sendVideo(@Body("chatId") chatId: string, @UploadedFile() video: Express.Multer.File) {
    return this.botService.sendVideoFile(chatId, video);
  }
}
