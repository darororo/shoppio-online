import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TelegramBotSettingEnum } from "../telegram_bot.enum";
import { TelegramBotEntity } from "./telegram_bot.entity";

@Entity()
export class TelegramBotSettingEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    setting: string;
    @Column()
    state: boolean;

    @Column({ type: 'bigint' })
    botId: number;
}