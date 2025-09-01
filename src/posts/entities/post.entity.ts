import { PostDistribution } from "src/post_distributions/entities/post_distribution.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('posts')
export class Post {
 @PrimaryGeneratedColumn('uuid')
 id: string;

 @ManyToOne(()=> User,(user)=> user.posts)
 user:User;

 @Column()
 content: string;

 @Column()
 media_url: string;

 @Column({ type: 'timestamp', default: () => 'NOW()' })
 scheduled_time: Date;

 @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
 created_at: Date;

 @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
 updated_at: Date;

 @OneToMany(()=> PostDistribution,(pd)=> pd.post)
 distributions: PostDistribution[];
}
