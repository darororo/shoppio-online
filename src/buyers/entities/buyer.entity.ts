import { Message } from 'src/messages/entities/message.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  facebook_user_id: string;

  @Column()
  username: string;

  @Column()
  profile_pic: string;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @OneToMany(() => Message, (message) => message.id)
  message: Message[];

  @OneToMany(() => Order, (order) => order.id)
  order: Order[];
}
