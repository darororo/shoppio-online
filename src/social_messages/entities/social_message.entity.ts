import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { Post } from 'src/posts/entities/post.entity';
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

@Entity('social_messages') // Original messages table from social media platform
export class SocialMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SocialPage, (socialPage) => socialPage.messages, {
    onDelete: 'CASCADE',
  })
  socialPage: SocialPage;

  @ManyToOne(() => Post, { onDelete: 'SET NULL', nullable: true })
  post: Post;

  @OneToMany(
    () => AnalyzedMessage,
    (analyzedMessage) => analyzedMessage.message,
  )
  analyzedMessages: AnalyzedMessage[];

  @ManyToOne(() => Buyer, (buyer) => buyer.socialMessages, {
    onDelete: 'SET NULL',
  })
  buyer: Buyer;

  @Column({ type: 'varchar', nullable: true })
  sender_id: string;

  @Column({ type: 'varchar', nullable: true })
  facebook_comment_id: string; // Facebook's unique comment ID

  @Column({ type: 'varchar', nullable: true })
  facebook_post_id: string; // Facebook's post ID that this comment belongs to

  @Column({ type: 'varchar', nullable: true })
  parent_comment_id: string; // For reply comments, the parent comment ID

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
