import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { Order } from 'src/orders/entities/order.entity';
// import { Auth } from 'src/auth/entities/auth.entity';
// import { Buyer } from 'src/buyers/entities/buyer.entity';
// import { Message } from 'src/messages/entities/message.entity';
// import { Order } from 'src/orders/entities/order.entity';
// import { Page } from 'src/pages/entities/page.entity';
import { PostDistribution } from 'src/post_distributions/entities/post_distribution.entity';
import { Post } from 'src/posts/entities/post.entity';
import { SocialAccount } from 'src/social_account/entities/social_account.entity';
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
import { TelegramBotEntity } from 'src/telegram_bot/entities/telegram_bot.entity';
import { TelegramChatEntity } from 'src/telegram_bot/entities/telegram_chat.entity';
import { User } from 'src/users/entities/user.entity';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  // Debug: Log environment variables used for DB connection
  console.log('[DEBUG] Raw environment variables:');
  console.log('[DEBUG] DATABASE_HOST:', process.env.DATABASE_HOST);
  console.log('[DEBUG] DATABASE_PORT:', process.env.DATABASE_PORT);
  console.log('[DEBUG] DB_HOST:', process.env.DB_HOST);
  console.log('[DEBUG] DB_PORT:', process.env.DB_PORT);

  // Prefer Docker Compose envs (DATABASE_*) over local .env (DB_*) when both exist
  const host = process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(
    process.env.DATABASE_PORT || process.env.DB_PORT || '5432',
  );
  const username =
    process.env.DATABASE_USER || process.env.DB_USERNAME || 'postgres';
  const password =
    process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.DATABASE_NAME || process.env.DB_NAME || '';

  console.log('[DB CONFIG] host:', host);
  console.log('[DB CONFIG] port:', port);
  console.log('[DB CONFIG] username:', username);
  console.log('[DB CONFIG] database:', database);
  const rawSchema =
    process.env.DATABASE_SCHEMA || process.env.DB_SCHEMA || 'public';
  const schema = rawSchema.replace(/^['"]|['"]$/g, '');
  console.log('[DB CONFIG] schema:', schema);

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [
      User,
      Post,
      SocialAccount,
      SocialMessage,
      SocialPage,
      AnalyzedMessage,
      PostDistribution,
      Buyer,
      Order,
      TelegramChatEntity,
      TelegramBotEntity
    ],
    // Set synchronize to true for development only. NEVER use true in production!
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    retryAttempts: 3,
    retryDelay: 3000,
    // Don't drop schema by default; preserves local DB when restarting dev containers
    dropSchema: true,
    schema,
  };
}
