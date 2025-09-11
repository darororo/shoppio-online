import { Order } from 'src/orders/entities/order.entity';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
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

  @OneToMany(() => SocialMessage, (socialMessage) => socialMessage.buyer)
  socialMessages: SocialMessage[];

  @OneToMany(() => Order, (order) => order.buyer)
  order: Order[];
}
