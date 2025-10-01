import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UsersModule } from './users/users.module';
import { BuyersModule } from './buyers/buyers.module';
// import { PagesModule } from './pages/pages.module';
// import { MessagesModule } from './messages/messages.module';
import { AnalyzedMessagesModule } from './analyzed_messages/analyzed_messages.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { FacebookModule } from './facebook/facebook.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database/database.provider';
// import { SocialAccountModule } from './social_account/social_account.module';
// import { SocialPagesModule } from './social_pages/social_pages.module';
// import { PostsModule } from './posts/posts.module';
// import { PostDistributionsModule } from './post_distributions/post_distributions.module';
import { SocialMessagesModule } from './social_messages/social_messages.module';
import { CommonModule } from './common/common.module';
import { GeminiService } from './analyzer/gemini.service';
import { AnalyzerService } from './analyzer/analyzer.service';
import { AnalyzerModule } from './analyzer/analyzer.module';

@Module({
  imports: [
    CommonModule, // Add security services globally
    ConfigModule.forRoot(
      {
        isGlobal: true,
        envFilePath: `.env`,
      }
    ),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    FacebookModule,
    SocialMessagesModule,
    AnalyzerModule,
    // SocialAccountModule,
    // SocialPagesModule,
    // PostsModule,
    // PostDistributionsModule,
    // UsersModule,
    BuyersModule,
    // PagesModule,
    // MessagesModule,
    AnalyzedMessagesModule,
    OrdersModule,
    // AuthModule,
  ],
  // imports: [UsersModule, BuyersModule, PagesModule, MessagesModule, AnalyzedMessagesModule, OrdersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, GeminiService, AnalyzerService],
})
export class AppModule { }
