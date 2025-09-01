import { Message } from 'src/messages/entities/message.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  page_id: string;

  @Column()
  page_name:
  string;

  @CreateDateColumn()
  create_at: Date;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @OneToMany(() => Message, (message) => message.id)
  message: Message[];

  @OneToMany(() => Order, (order) => order.id)
  order: Order[];
}
