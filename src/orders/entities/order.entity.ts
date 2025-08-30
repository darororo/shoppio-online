import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusEnum } from '../enum/status_enum';
import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { Page } from 'src/pages/entities/page.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_name: string;

  @Column()
  quantity: number;

  @Column({ type: 'enum', enum: StatusEnum })
  status: StatusEnum;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(() => AnalyzedMessage, (analyzed_message) => analyzed_message.id)
  analyzed_message: AnalyzedMessage;

  @ManyToOne(() => Buyer, (buyer) => buyer.id)
  buyer: Buyer;

  @ManyToOne(() => Page, (page) => page.id)
  page: Page[];
}
