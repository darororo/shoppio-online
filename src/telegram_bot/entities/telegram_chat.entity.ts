import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TelegramBotEntity } from "./telegram_bot.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class TelegramChatEntity {
    @PrimaryColumn()
    chatId: string;
    @PrimaryColumn()
    botId: string

    @Column()
    title: string;

    @Column()
    type: string;


    @ManyToMany(() => User, (user) => user.telegramChats)
    @JoinTable()
    users: User[]

    // @ManyToOne(() => TelegramBotEntity, (bot) => bot.chats)
    // @JoinColumn({ name: 'botId' })
    // bot: TelegramBotEntity
}