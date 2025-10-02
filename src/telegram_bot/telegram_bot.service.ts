import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TelegramBotEntity } from './entities/telegram_bot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramBotSettingEntity } from './entities/telegram_bot_setting_entity';
import { Context } from 'telegraf';
import { error, log } from 'console';
import { BOT_AI } from './telegram_bot.constants';

@Injectable()
export class TelegramBotService {
  constructor(
    @InjectRepository(TelegramBotEntity)
    private readonly botRepo: Repository<TelegramBotEntity>,
    @InjectRepository(TelegramBotSettingEntity)
    private readonly settingRepo: Repository<TelegramBotSettingEntity>,
  ) { }

  create() {
    return 'This action adds a new telegramBot';
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
}
