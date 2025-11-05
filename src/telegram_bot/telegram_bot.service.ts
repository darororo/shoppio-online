import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TelegramBotEntity } from './entities/telegram_bot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramBotSettingEntity } from './entities/telegram_bot_setting_entity';
import { Context, Telegraf } from 'telegraf';
import { error, log } from 'console';
import { BOT_AI, SHOPPIO_BOT_NAME } from './telegram_bot.constants';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { TelegramChatEntity } from './entities/telegram_chat.entity';
import { CreateTelegramChatDto } from './dto/create-telegram-chat.dto';

@Injectable()
export class TelegramBotService {
  constructor(
    @InjectRepository(TelegramBotEntity)
    private readonly botRepo: Repository<TelegramBotEntity>,
    @InjectRepository(TelegramChatEntity)
    private readonly chatRepo: Repository<TelegramChatEntity>,
    @InjectRepository(TelegramBotSettingEntity)
    private readonly settingRepo: Repository<TelegramBotSettingEntity>,
    @InjectBot(SHOPPIO_BOT_NAME) private readonly bot: Telegraf<Context>,
  ) { }

  create() {
    return 'This action adds a new telegramBot';
  }

  async getMe(): Promise<any> {
    try {
      const bot = await this.bot.telegram.getMe();
      return bot;
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message
      }
    }
  }

  async getChat(chatId: string): Promise<any> {
    try {
      const chat = (await this.bot.telegram.getChat(chatId));
      return chat;
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message
      }
    }
  }

  async getAllChats(): Promise<any> {
    try {
      console.log("LOL");
      const botId = (await this.bot.telegram.getMe()).id.toString();
      console.log("LOL2");
      console.log(botId)
      return this.chatRepo.find({ where: { botId } });
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message
      }
    }
  }

  async enableAi(botId: string, chatId: string) {
    try {
      let setting = await this.getSetting(botId, chatId, BOT_AI)
      if (!setting) {
        setting = { setting: BOT_AI, botId: botId, chatId: chatId }
      }
      setting = { ...setting, state: true }
      const result = await this.settingRepo.save(setting);
      return result;

    } catch (e) {
      console.error(e)
    }
  }

  async disableAi(botId: string, chatId: string) {
    try {
      let setting = await this.getSetting(botId, chatId, BOT_AI)
      if (!setting) {
        setting = { setting: BOT_AI, botId: botId, chatId: chatId }
      }
      setting = { ...setting, state: false }
      const result = await this.settingRepo.save(setting);
      return result;

    } catch (e) {
      console.error(e)
    }
  }

  async getSettings(botId: string, chatId: string) {
    try {
      const result = await this.settingRepo.find({ where: { botId: botId, chatId: chatId } });
      return result
    } catch (e) {
      return {};
    }
  }

  async getSetting(botId: string, chatId: string, setting: string) {
    try {
      const result = await this.settingRepo.findOne({ where: { botId: botId, setting: setting, chatId: chatId } });
      return result
    } catch (e) {
      return {};
    }
  }

  async isSettingEnabled(botId: string, chatId: string, setting: string) {
    try {
      const result = await this.settingRepo.findOne({ where: { botId: botId, setting: setting, chatId: chatId } });
      return result?.state ?? false;
    } catch (e) {
      return false;
    }
  }

  async sendPhotoUrl(chatId: string, photoUrl: string): Promise<any> {
    try {
      const result = await this.bot.telegram.sendPhoto(chatId, photoUrl);
      return {
        ok: true,
        from: result.from,
        chat: result.chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async sendPhotoFile(chatId: string, photo: Express.Multer.File): Promise<any> {
    try {
      const file = {
        source: photo.buffer,
      }
      const result = await this.bot.telegram.sendPhoto(chatId, file);
      return {
        ok: true,
        from: result.from,
        chat: result.chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }


  async sendPhotoUrlMany(chatId: string, photoUrl: string[]): Promise<any> {
    try {
      const asyncResults: Promise<any>[] = [];
      for (const photo of photoUrl) {
        const result = this.bot.telegram.sendPhoto(chatId, photo);
        asyncResults.push(result);
      }
      const results = await Promise.all(asyncResults);

      return {
        ok: true,
        from: results[0].from,
        chat: results[0].chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }


  async sendPhotoFileMany(chatId: string, photos: Express.Multer.File[]): Promise<any> {
    try {
      const asyncResults: Promise<any>[] = [];
      for (const photo of photos) {
        const file = {
          source: photo.buffer
        }
        const result = this.bot.telegram.sendPhoto(chatId, file);
        asyncResults.push(result);
      }
      const results = await Promise.all(asyncResults);

      return {
        ok: true,
        from: results[0].from,
        chat: results[0].chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async sendPhotoFileManyToChats(chatIds: string[], photos: Express.Multer.File[]): Promise<any> {
    try {
      const results: any[] = [];
      for (const chatId of chatIds) {
        for (const photo of photos) {
          const file = {
            source: photo.buffer
          }
          const result = await this.bot.telegram.sendPhoto(chatId, file);
          results.push(result);
        }
      }

      return {
        ok: true,
        from: results[0].from,
        chat: results[0].chat,
      };
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async sendPhotoUrlManyToChats(chatIds: string[], photoUrls: string[]): Promise<any> {
    try {
      const results: any[] = [];
      for (const chatId of chatIds) {
        for (const photo of photoUrls) {
          const result = await this.bot.telegram.sendPhoto(chatId, photo);
          results.push(result);
        }
      }

      return {
        ok: true,
        from: results[0].from,
        chat: results[0].chat,
      };
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async sendVideoFile(chatId: string, photo: Express.Multer.File): Promise<any> {
    try {
      const file = {
        source: photo.buffer,
      }
      const result = await this.bot.telegram.sendVideo(chatId, file);
      return {
        ok: true,
        from: result.from,
        chat: result.chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async saveChat(chat: CreateTelegramChatDto) {
    try {
      // Ensure chatId is stored as string
      const chatToSave = {
        ...chat,
        chatId: chat.chatId.toString(),
        botId: chat.botId.toString()
      };

      const result = await this.chatRepo.save(chatToSave);
      console.log('💾 Chat saved to database:', {
        chatId: result.chatId,
        title: result.title,
        type: result.type
      });

      return {
        ok: true,
        result: result
      }
    } catch (e) {
      console.error('❌ Error saving chat:', e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      };
    }
  }

  async deleteChat(chat: CreateTelegramChatDto) {
    try {
      const chatToDelete = {
        chatId: chat.chatId.toString(),
        botId: chat.botId.toString()
      };

      const result = await this.chatRepo.delete(chatToDelete);
      console.log('🗑️ Chat deleted from database:', {
        chatId: chat.chatId,
        title: chat.title,
        affected: result.affected
      });

      return {
        ok: true,
        result: result
      }
    } catch (e) {
      console.error('❌ Error deleting chat:', e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      };
    }
  }

  async sendMessage(chatId: string, message: string): Promise<any> {
    try {
      const result = await this.bot.telegram.sendMessage(chatId, message);
      return {
        ok: true,
        from: result.from,
        chat: result.chat,
      };
    } catch (e) {
      await this.bot.telegram.sendMessage(chatId, "nuh uh")
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  async sendMessageToChats(chatIds: string[], message: string): Promise<any> {
    try {
      const results: any[] = [];

      for (const chatId of chatIds) {
        const result = await this.bot.telegram.sendMessage(chatId, message);
        results.push(result);
      }
      return {
        ok: true,
        from: results[0].from,
        chat: results[0].chat,
      };
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message,
      };
    }
  }


}
