import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageType } from '../enum/message_type';

@Entity('social_messages')
export class SocialMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SocialPage, (socialPage) => socialPage.messages, {
    onDelete: 'CASCADE',
  })
  socialPage: SocialPage;

  @OneToMany(
    () => AnalyzedMessage,
    (analyzedMessage) => analyzedMessage.message,
  )
  analyzedMessages: AnalyzedMessage[];

  @Column({ type: 'varchar', nullable: true })
  sender_id: string;

  @Column({ type: 'text', nullable: true })
  message_text: string; // The text content of the message

  @Column({ type: 'enum', enum: MessageType, nullable: true })
  message_type: MessageType; // comment, message

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date;

  @Column({ type: 'varchar', nullable: true })
  analyzed_intent: string; //

  @Column({ type: 'varchar', nullable: true })
  sentiment: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;
}
