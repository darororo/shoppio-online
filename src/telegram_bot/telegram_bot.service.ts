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

  async getChat(chatId: number): Promise<any> {
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
      return this.chatRepo.find();
    } catch (e) {
      return {
        ok: false,
        error: (e as Error).message
      }
    }
  }

  async enableAi(botId: number) {
    try {
      const newSetting = { setting: BOT_AI, state: true, botId: botId }
      const result = await this.settingRepo.save(newSetting);
      return result
    } catch (e) {
      console.error(e)
    }
  }

  async disableAi(botId: number) {
    try {
      const newSetting = { setting: BOT_AI, state: false, botId: botId }
      const result = await this.settingRepo.save(newSetting);
      return result
    } catch (e) {
      console.error(e)
    }
  }

  async getSettings(botId: number) {
    try {
      const result = await this.settingRepo.find({ where: { botId: botId } });
      return result
    } catch (e) {
      return {};
    }
  }

  async isSettingEnabled(botId: number, setting: string) {
    try {
      const result = await this.settingRepo.findOne({ where: { botId: botId, setting: setting } });
      return result?.state ?? false;
    } catch (e) {
      return false;
    }
  }

  async sendPhoto(chatId: number, photoUrl: string): Promise<any> {
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
}
