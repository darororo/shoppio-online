import { PostDistribution } from 'src/post_distributions/entities/post_distribution.entity';
import { SocialAccount } from 'src/social_account/entities/social_account.entity';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('social_pages')
@Unique(['socialAccount', 'page_id'])
export class SocialPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SocialAccount,
    (social_account) => social_account.socialPages,
    {
    onDelete: 'CASCADE',
    },
  )
  socialAccount: SocialAccount;

  @Column({ type: 'varchar'})
  page_id: string;

  @Column({ type: 'varchar', nullable: true })
  page_name: string;

  @Column({ type: 'text', nullable: true })
  access_token: string;

  @Column({ type: 'timestamp', nullable: true })
  token_expires: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  updated_at: Date;

  @OneToMany(
    () => PostDistribution,
    (postDistributions) => postDistributions.socialPage,
  )
  postDistributions: PostDistribution[];

  @OneToMany(() => SocialMessage, (socialMessage) => socialMessage.socialPage)
  messages: SocialMessage[];
}
