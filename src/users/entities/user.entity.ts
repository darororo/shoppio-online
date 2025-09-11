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

@Entity('users') // main user table for login and manage system
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  facebookId: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  profilePicture: string | null;

  @Column({ type: 'varchar', nullable: true })
  accessToken: string;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({nullable:true, unique:true})
  phone_number:string;
 
  @Column({ type: 'boolean', default: false })
  isActive:boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
  

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @OneToMany(()=> SocialAccount,(socialAccount)=> socialAccount.user,{
    cascade:true,
  })
  socialAccount: SocialAccount[];

  @OneToMany(()=> Post,(post)=> post.user)
  posts: Post[];
}
