import { DataSource } from 'typeorm';
import { FbComment } from './entities/fb_comment.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
// import { Post } from 'src/posts/entities/post.entity';

export const socialMessageProviders = [
  {
    provide: 'SOCIAL_MESSAGE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(FbComment),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'SOCIAL_PAGE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SocialPage),
    inject: ['DATA_SOURCE'],
  },
  // {
  //   provide: 'POST_REPOSITORY',
  //   useFactory: (dataSource: DataSource) => dataSource.getRepository(Post),
  //   inject: ['DATA_SOURCE'],
  // },
];
