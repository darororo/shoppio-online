import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class FbMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  facebookMessageId: string;

  // @Column({ nullable: false })
  // userId: string;

  @Column({ default: false })
  is_processed: boolean;

  @ManyToOne(() => User, (user) => user.fbMessages)
  user: User;

  @ManyToOne(() => Buyer, (buyer) => buyer.fbMessages)
  buyer: Buyer;

  @OneToMany(
    () => AnalyzedMessage,
    (analyzedMessage) => analyzedMessage.message,
  )
  analyzedMessages: AnalyzedMessage[];

  @Column({ nullable: false })
  conversationId: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'jsonb', nullable: false })
  from: {
    name: string;
    id: string;
    profile_pic?: string;
  };

  @Column({ type: 'jsonb', nullable: false })
  to: {
    data: {
      name: string;
      id: string;
    }[];
  };

  @Column()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;
}
