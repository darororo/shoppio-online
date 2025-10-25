import { FbMessage } from 'src/facebook_message/entities/facebook_message.entity';
import { Order } from 'src/orders/entities/order.entity';
import { FbComment } from 'src/fb_comment/entities/fb_comment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('buyers')
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  facebook_user_id: string;

  @Column()
  name: string;

  @Column()
  profile_pic: string;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @OneToMany(() => FbComment, (fbComment) => fbComment.buyer)
  socialMessages: FbComment[];

  @OneToMany(() => FbMessage, (fbMessages) => fbMessages.buyer)
  fbMessages: FbMessage[];

  @OneToMany(() => Order, (order) => order.buyer)
  order: Order[];
}
