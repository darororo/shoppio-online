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
        const botId = bot.id.toString();

        const chat = await ctx.getChat();
        const chatId = chat.id;

        await this.botService.enableAi(botId, chatId);
        return "AI Mode ON";
    };

    @Command("disableai")
    async onDisableAi(@Ctx() ctx: Context) {
        const chat = await ctx.getChat();
        const chatId = chat.id;

        const bot = await ctx.telegram.getMe();
        const botId = bot.id.toString();

        await this.botService.disableAi(botId, chatId);
        return "AI Mode OFF"
    };


    @Hears([wordsRegex])
    async onMessage(
        @Ctx() ctx: Context,
        @Next() next: Function,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('username') username: string,
    ) {
        if (ctx.message.text.startsWith("/")) return next();
        const bot = await ctx.telegram.getMe();
        const botId = bot.id.toString();

        const update = await ctx.update;

        const chat = await ctx.getChat();
        const chatId = chat.id.toString()
        const aiEnabled = await this.botService.isSettingEnabled(botId, chatId, BOT_AI);
        // if ai mode is off, don't respond
        if (!aiEnabled) return;

        const text = ctx.text
        const result = await this.ollama.sendPrompt(text || 'hello');
        console.log(result)
        return `@${username} ${result}`;
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



    // Proper handler for when bot's membership status changes
    @On("my_chat_member")
    async onMyChatMemberUpdate(@Ctx() ctx: Context) {
        try {
            const update = ctx.update as any;
            const oldStatus = update.my_chat_member?.old_chat_member?.status;
            const newStatus = update.my_chat_member?.new_chat_member?.status;

            const chat = update.my_chat_member?.chat;
            if (!chat) return;

            const botId = (await ctx.telegram.getMe()).id.toString();

            // Determine proper chat title
            const title = chat.title ||
                (chat.first_name ? `${chat.first_name} ${chat.last_name || ''}`.trim() : 'Private Chat');

            // Bot was added to chat (became member or admin)
            if ((oldStatus === 'left' || oldStatus === 'kicked') &&
                (newStatus === 'member' || newStatus === 'administrator')) {

                await this.botService.saveChat({
                    chatId: chat.id.toString(),
                    botId: botId,
                    title: title,
                    type: chat.type,
                });

                console.log(`✅ Bot added to chat: ${chat.id} (${title}) - Type: ${chat.type}`);

                // Send welcome message
                await ctx.reply('👋 Hello! I\'m now ready to help in this chat!');
            }

            // Bot was removed from chat (left or kicked)
            else if ((newStatus === 'left' || newStatus === 'kicked') &&
                (oldStatus === 'member' || oldStatus === 'administrator')) {

                await this.botService.deleteChat({
                    chatId: chat.id.toString(),
                    botId: botId,
                    title: title,
                    type: chat.type,
                });

                console.log(`❌ Bot removed from chat: ${chat.id} (${title})`);
            }

            // Bot became admin
            else if (oldStatus === 'member' && newStatus === 'administrator') {
                console.log(`⭐ Bot promoted to admin in chat: ${chat.id} (${title})`);
            }

        } catch (e) {
            console.error('Error handling my_chat_member update:', e);
        }
    }

    // Fallback handler for when other members join (kept for compatibility)
    @On("new_chat_members")
    async onNewChatMembers(@Ctx() ctx: Context) {
        try {
            const message = ctx.message as any;
            const newMembers = message?.new_chat_members || [];
            const botId = (await ctx.telegram.getMe()).id;

            // Check if the bot itself was added
            const botAdded = newMembers.some((member: any) => member.id === botId);

            if (botAdded) {
                console.log('🤖 Bot detected in new_chat_members (backup handler)');
                const chat = await ctx.getChat();
                const botIdStr = botId.toString();

                const title = chat.title ||
                    (chat.first_name ? `${chat.first_name} ${chat.last_name || ''}`.trim() : 'Private Chat');

                await this.botService.saveChat({
                    chatId: chat.id.toString(),
                    botId: botIdStr,
                    title: title,
                    type: chat.type,
                });
            }

        } catch (e) {
            console.error('Error in new_chat_members handler:', e);
        }
    }

    @On("left_chat_member")
    async onLeftChatMember(@Ctx() ctx: Context) {
        try {
            const message = ctx.message as any;
            const leftMember = message?.left_chat_member;
            const botId = (await ctx.telegram.getMe()).id;

            // Check if the bot itself was removed
            if (leftMember && leftMember.id === botId) {
                console.log('🤖 Bot detected in left_chat_member (backup handler)');
                const chat = await ctx.getChat();
                const botIdStr = botId.toString();

                const title = chat.title ||
                    (chat.first_name ? `${chat.first_name} ${chat.last_name || ''}`.trim() : 'Private Chat');

                await this.botService.deleteChat({
                    chatId: chat.id.toString(),
                    botId: botIdStr,
                    title: title,
                    type: chat.type,
                });
            }

        } catch (e) {
            console.error('Error in left_chat_member handler:', e);
        }
    }
}