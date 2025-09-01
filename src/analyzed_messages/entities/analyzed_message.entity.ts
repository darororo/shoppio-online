import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IntentionEnum } from '../enum/intention_enum';
import { Message } from 'src/messages/entities/message.entity';
import { Order } from 'src/orders/entities/order.entity';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';

@Entity('analyze_messages')
export class AnalyzedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => SocialMessage, (msg) => msg.analyzedMessages, {
    onDelete: 'CASCADE',
  })
  message: SocialMessage;

  @Column({ type: 'varchar', length: 50, nullable: true })
  intent: string; // e.g., buy, info, complaint, support, others

  @Column({ type: 'varchar', length: 20, nullable: true })
  sentiment: string; // positive, negative, neutral

  @Column({ type: 'varchar', length: 20, nullable: true })
  language: string; // km, en, etc.

  @Column({ type: 'text', array: true, nullable: true })
  keywords: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence_score: number; // e.g. 0.95

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  analyzed_at: Date;
}
