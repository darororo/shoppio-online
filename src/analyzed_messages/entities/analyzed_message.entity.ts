import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IntentionEnum } from '../enum/intention_enum';
import { Message } from 'src/messages/entities/message.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity()
export class AnalyzedMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  intent_score: number;

  @Column({ type: 'enum', enum: IntentionEnum })
  intention: IntentionEnum;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @OneToOne(() => Message, (message) => message.id)
  message: Message;

  @OneToMany(() => Order, (order) => order.id)
  order: Order[];
}
