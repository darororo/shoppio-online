import { Order } from 'src/orders/entities/order.entity';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IntentionEnum } from '../enum/intention_enum';

@Entity('analyze_messages')
export class AnalyzedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => SocialMessage, (msg) => msg.analyzedMessages, {
    onDelete: 'CASCADE',
  })
  message: SocialMessage;

  @Column({ type: 'varchar', enum: IntentionEnum, nullable: true })
  intent: IntentionEnum; // e.g., buy, info, complaint, support, others

  // @Column({ type: 'varchar', length: 20, nullable: true })
  // sentiment: string; // positive, negative, neutral

  // @Column({ type: 'varchar', length: 20, nullable: true })
  // language: string; // km, en, etc.

  // @Column({ type: 'text', array: true, nullable: true })
  // keywords: string[];

  @Column()
  buyerId: string;

  @Column()
  buyerName: string;

  @Column()
  analysisNote: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence_score: number; // e.g. 0.95

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  analyzed_at: Date;

  @OneToMany(() => Order, (order) => order.analyzed_message)
  orders: Order[];
}
