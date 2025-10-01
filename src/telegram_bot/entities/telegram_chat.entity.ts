import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TelegramBotEntity } from "./telegram_bot.entity";

@Entity()
export class TelegramChatEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ type: 'bigint' })
    chatId: number;

    @Column()
    title: string;

    @Column()
    type: string;

    @ManyToOne(() => TelegramBotEntity, (bot) => bot.chats)
    bot: TelegramBotEntity
}