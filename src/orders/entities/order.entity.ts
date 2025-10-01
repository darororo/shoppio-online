import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusEnum } from '../enum/status_enum';
// this table used when analyzed by AI message contain order information
@Entity()
export class Order {
  // orders created from analyzed messages
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_name: string;

  @Column()
  quantity: number;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
  status: StatusEnum;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @ManyToOne(
    () => AnalyzedMessage,
    (analyzed_message) => analyzed_message.orders,
  )
  analyzed_message: AnalyzedMessage;

  @ManyToOne(() => Buyer, (buyer) => buyer.order)
  buyer: Buyer;

  @ManyToOne(() => SocialPage, (page) => page.id)
  page: SocialPage;
}
