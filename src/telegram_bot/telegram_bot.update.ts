// @ts-nocheck


import { Command, Ctx, Hears, Start, Update, Sender, InjectBot, On, Message, Next } from 'nestjs-telegraf';
import { BOT_AI, WIZARD_SCENE_ID } from './telegram_bot.constants';
import { Context } from './interface/context.interface';
import { UpdateType } from './decorator/update_type.decorator';
import { UpdateType as TelegrafUpdateType } from 'node_modules/telegraf/typings/telegram-types';
import { Telegraf } from 'telegraf';
import { TelegramBotService } from './telegram_bot.service';
import { OllamaAiService } from 'src/ollama_ai/ollama_ai.service';
import { Inject, Injectable } from '@nestjs/common';
import { OLLAMA_SERVICE } from 'src/ollama_ai/ollama_ai.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramChatEntity } from './entities/telegram_chat.entity';
import { Repository } from 'typeorm';
import { ChatFromGetChat } from 'node_modules/telegraf/typings/core/types/typegram';
import { TelegramBotEntity } from './entities/telegram_bot.entity';


const notCommandRegex = /\b(?!\/)\w+\b/g;
const wordsRegex = /\w+/g

@Update()
export class TelegramBotUpdate {
    constructor(
        @Inject(OLLAMA_SERVICE)
        private readonly ollama: OllamaAiService,
        @InjectRepository(TelegramChatEntity)
        private readonly chatRepo: Repository<TelegramChatEntity>,
        private readonly botService: TelegramBotService,
    ) { }
    @Start()
    async startCommand(@Ctx() ctx: Context,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,) {

        // this.bot.start((ctx) => ctx.reply('Welcome'))
        console.log(ctx)
        const chat = await ctx.getChat()
        console.log("chat")
        console.log(chat)
        console.log("CHAT ID")
        console.log(chat.id)

        return `Yatta desu ne OwO`;
    }


    @Hears(['hi', 'hello', 'hey', 'qq'])
    async onGreetings(
        @Ctx() ctx: Context,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,
    ) {
        // if (updateType != 'message') return;

        console.log('onGreetings')

        return `Hey ${firstName} ${lastName}`;
    }



    @Command("enableai")
    async onEnableAi(@Ctx() ctx: Context) {
        console.log('ENABLE AI')
        const bot = await ctx.telegram.getMe();
        const botId = bot.id;
        await this.botService.enableAi(botId);
        return "I LOVE JESUS";
    };

    @Command("disableai")
    async onDisableAi(@Ctx() ctx: Context) {
        const bot = await ctx.telegram.getMe();
        const botId = bot.id;
        await this.botService.disableAi(botId);

        return "CHRIST IS DEAD"
    };


    @Hears([wordsRegex])
    async onGreetings(
        @Ctx() ctx: Context,
        @Next() next: Function,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,
    ) {
        if (ctx.message.text.startsWith("/")) return next();
        const bot = await ctx.telegram.getMe();
        const botId = bot.id;
        const aiEnabled = await this.botService.isSettingEnabled(botId, BOT_AI);
        if (!aiEnabled) return "AI IS DEAD"

        const text = ctx.text
        const result = await this.ollama.sendPrompt(text || 'hello');
        console.log(result)
        return `Hey ${firstName} ${lastName} ${result}`;
    }


    //   @Command('scene')
    //   async onSceneCommand(@Ctx() ctx: Context): Promise<void> {
    //     await ctx.scene.enter(HELLO_SCENE_ID);
    //   }

    @Command('wizard')
    async onWizardCommand(@Ctx() ctx: Context) {
        return "gyatt damn";
    }

    @Command('hello')
    async helloCommand(@Ctx() ctx: Context,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,) {

        // this.bot.start((ctx) => ctx.reply('Welcome'))

        return `ជម្រាបលា ${firstName} ${lastName} ${updateType}`;
    }



    @On("new_chat_members")
    async onAddedToChat(@Ctx() ctx: Context) {
        const chat = await ctx.getChat();
        const type = chat.type;
        const id = chat.id;


        const chatId = chat.id;
        const botId = (await ctx.telegram.getMe()).id;

        const bruh = await this.chatRepo.save({
            chatId: chatId,
            title: chat.title,
            type: type
        });

        console.log("I AM ADDED TO A NEW CHAT")
        console.log(ctx)
        console.log((await ctx.getChat()).id)
        return "BONJOUR"
    }
}