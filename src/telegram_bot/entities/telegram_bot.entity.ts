import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TelegramChatEntity } from "./telegram_chat.entity";
import { TelegramBotSettingEntity } from "./telegram_bot_setting_entity";

@Entity()
export class TelegramBotEntity {
    @PrimaryColumn()
    botId: string;
    @Column()
    username: string;

    // @OneToMany(() => TelegramChatEntity, (chat) => chat.bot)
    // chats: TelegramChatEntity[];
}