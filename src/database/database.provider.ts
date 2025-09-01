import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
import { Auth } from 'src/auth/entities/auth.entity';
import { Buyer } from 'src/buyers/entities/buyer.entity';
import { Message } from 'src/messages/entities/message.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Page } from 'src/pages/entities/page.entity';
import { User } from 'src/users/entities/user.entity';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  // Debug: Log environment variables used for DB connection
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
  console.log('DB_NAME:', process.env.DB_NAME);
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    entities: [Auth, AnalyzedMessage, Buyer, Message, Order, Page, User],
    // Set synchronize to true for development only. NEVER use true in production!
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    retryAttempts: 3,
    retryDelay: 3000,
    dropSchema: false,
    schema: process.env.DB_SCHEMA || 'public',
  };
}
