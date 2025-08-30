import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SourceEmun } from '../enum/source_enum';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { Page } from 'src/pages/entities/page.entity';
import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  facebook_message_id: string;

  @Column({ type: 'enum', enum: SourceEmun })
  source: SourceEmun;

  @Column({ type: 'array' })
  content: string[];

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(() => Buyer, (buyer) => buyer.id)
  buyer: Buyer;

  @ManyToOne(() => Page, (page) => page.id)
  page: Page;

  @OneToOne(() => AnalyzedMessage, (analyzed_message) => analyzed_message.id)
  analyzed_message = AnalyzedMessage;
}
