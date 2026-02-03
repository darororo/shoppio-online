import { Body, Controller, Get, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { TelegramBotService } from './telegram_bot.service'

@Controller('telegram-bot')
export class TelegramBotController {
  constructor(
    private readonly botService: TelegramBotService,
  ) {

  }

  @Get('/me')
  async me() {
    return this.botService.getMe()
  }

  @Get('/chat')
  async getChat(@Query('chatId') chatId: string): Promise<any> {
    return this.botService.getChat(chatId)
  }

  @Get('/chats')
  async getAllChats(): Promise<any> {
    return this.botService.getAllChats()
  }

  @Post('/send-message')
  async sendText(@Body('chatId') chatId: string, @Body('message') message: string) {
    if (message)
      return this.botService.sendMessage(chatId, message)
  }

  @Post('/send-message-to-chats')
  async sendTextToChats(@Body('chatIds') chatIds: string[], @Body('message') message) {
    if (message)
      return this.botService.sendMessageToChats(chatIds, message)
  }

  @Post('/send-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async sendPhoto(@Body('chatId') chatId: string, @Body('photoUrl') photoUrl: string, @UploadedFile() photo: Express.Multer.File) {
    if (photoUrl)
      return this.botService.sendPhotoUrl(chatId, photoUrl)

    return this.botService.sendPhotoFile(chatId, photo)
  }

  @Post('/send-photo-many')
  @UseInterceptors(FilesInterceptor('photos'))
  async sendPhotoMany(@Body('chatId') chatId: string, @Body('photoUrls') photoUrls: string[], @UploadedFiles() photos: Express.Multer.File[]) {
    if (photoUrls.length > 0)
      return this.botService.sendPhotoUrlMany(chatId, photoUrls)

    return this.botService.sendPhotoFileMany(chatId, photos)
  }

  @Post('/send-photo-many-to-chats')
  @UseInterceptors(FilesInterceptor('photos'))
  async sendPhotoManyToChats(@Body() body: any, @UploadedFiles() photos: Express.Multer.File[]) {
    // if (photoUrls.length > 0) return this.botService.sendPhotoUrlManyToChats(chatIds, photoUrls);
    const chatIds = Array.isArray(body.chatIds) ? body.chatIds : [body.chatIds]
    return this.botService.sendPhotoFileManyToChats(chatIds, photos)
  }

  @Post('/send-video')
  @UseInterceptors(FileInterceptor('video'))
  async sendVideo(@Body('chatId') chatId: string, @UploadedFile() video: Express.Multer.File) {
    return this.botService.sendVideoFile(chatId, video)
  }
}
