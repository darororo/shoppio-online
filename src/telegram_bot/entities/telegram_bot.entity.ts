import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TelegramChatEntity } from "./telegram_chat.entity";

@Entity()
export class TelegramBotEntity {
    @PrimaryGeneratedColumn()
    id: string;
    @Column({ type: 'bigint' })
    botId: number;

    @OneToMany(() => TelegramChatEntity, (chat) => chat.bot)
    chats: TelegramChatEntity[]
}