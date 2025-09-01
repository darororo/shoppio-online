import { SocialPage } from "src/social_pages/entities/social_page.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ForeignKey, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity('social_accounts')
@Unique(['user','provider'])
export class SocialAccount {
 @PrimaryGeneratedColumn('uuid')
 id: string;

 @ManyToOne(()=> User,(user)=> user.socialAccount,{
    onDelete: 'CASCADE',
 })
 user: User;

@Column()
provider: string;

@Column()
provider_user_id: string;

@Column({ type: 'text', nullable: true })

access_token: string;

@Column({ type: 'text', nullable: true })
refresh_token: string;

@Column({ type: 'timestamp', nullable: true })
token_expires_at: Date;

@CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
created_at: Date;

@UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
updated_at: Date;

@OneToMany(()=> SocialPage,(socialPage)=> socialPage.socialAccount)
socialPages: SocialPage[];

}
