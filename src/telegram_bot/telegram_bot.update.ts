import { Command, Ctx, Hears, Start, Update, Sender, InjectBot } from 'nestjs-telegraf';
import { WIZARD_SCENE_ID } from './telegram_bot.constants';
import { Context } from './interface/context.interface';
import { UpdateType } from './decorator/update_type.decorator';
import { UpdateType as TelegrafUpdateType } from 'node_modules/telegraf/typings/telegram-types';
import { Telegraf } from 'telegraf';
import { TelegramBotService } from './telegram_bot.service';

@Update()
export class TelegramBotUpdate {
    @Start()
    async startCommand(@Ctx() ctx: Context,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,) {

        // this.bot.start((ctx) => ctx.reply('Welcome'))

        return `Yatta desu ne OwO`;
    }


    @Hears(['hi', 'hello', 'hey', 'qq'])
    onGreetings(
        @Ctx() ctx: Context,
        @UpdateType() updateType: TelegrafUpdateType,
        @Sender('first_name') firstName: string,
        @Sender('last_name') lastName: string,
    ): string {

        return `Hey ${firstName} ${lastName} ${updateType}`;
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
}