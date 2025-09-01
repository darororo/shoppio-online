// import { Post } from '@nestjs/common';
// import { UpdateBuyerDto } from 'src/buyers/dto/update-buyer.dto';
// import { Page } from 'src/pages/entities/page.entity';
import { Post } from 'src/posts/entities/post.entity';
import { SocialAccount } from 'src/social_account/entities/social_account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enum/roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({unique: true})
  email:string;
 
  @Column({unique: true})
  password_hash:string;
  
  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  is_active:boolean;

  @Column()
  name:string;

  @Column()
  phone_number:string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  updated_at: Date;
  
  @OneToMany(()=> SocialAccount,(socialAccount)=> socialAccount.user,{
    cascade:true,
  })
  socialAccount: SocialAccount[];

  @OneToMany(()=> Post,(post)=> post.user)
  posts: Post[];
  // @Column()
  // page_id: string;

  // @Column({ unique: true })
  // facebook_user_id: string;

  // @Column()
  // profile_pic: string;

  // @Column()
  // access_token: string;

  // @CreateDateColumn()
  // create_at: Date;

  // @OneToMany(() => Page, (page) => page.id)
  // page: Page[];

}
