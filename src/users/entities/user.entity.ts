// import { Post } from '@nestjs/common';
// import { UpdateBuyerDto } from 'src/buyers/dto/update-buyer.dto';
// import { Page } from 'src/pages/entities/page.entity';
// import { Post } from 'src/posts/entities/post.entity';
// import { SocialAccount } from 'src/social_account/entities/social_account.entity';
import { EncryptionUtil } from 'src/common/utils/encryption.util';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enum/roles';
import { TelegramChatEntity } from 'src/telegram_bot/entities/telegram_chat.entity';

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

  // Encrypted Facebook access token storage
  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: string) => (value ? EncryptionUtil.encrypt(value) : null),
      from: (value: string) => (value ? EncryptionUtil.decrypt(value) : null),
    },
  })
  accessToken: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true, unique: true })
  phone_number: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // socialAccount: SocialAccount[];

  // @ManyToMany(() => TelegramChatEntity, (chat) => chat.users)
  // telegramChats: TelegramChatEntity[]
}
