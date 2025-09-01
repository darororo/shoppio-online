import { SocialPage } from './../../social_pages/entities/social_page.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PostStatus } from '../enum/post_status';

@Entity('post_distributions')
export class PostDistribution {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(()=> Post,(post)=>post.distributions,{
        onDelete: 'CASCADE',
    })
    post: Post;

    @ManyToOne(()=> SocialPage,(social_page)=> social_page.postDistributions,{
        onDelete: 'CASCADE',
    })
    
    socialPage: SocialPage;
    @Column({ type: 'varchar',
        enum: PostStatus,
        default: PostStatus.PENDING
     })
    platform_status: string; // pending, posted, failed

    @Column({ type: 'varchar', nullable: true })
    platform_post_id: string;

    @Column({ type: 'timestamp', nullable: true })
    posted_at: Date;
}
