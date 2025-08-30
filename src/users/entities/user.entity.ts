import { Page } from 'src/pages/entities/page.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  page_id: string;

  @Column({ unique: true })
  facebook_user_id: string;

  @Column()
  profile_pic: string;

  @Column()
  access_token: string;

  @CreateDateColumn()
  create_at: Date;

  @OneToMany(() => Page, (page) => page.id)
  page: Page[];
}
