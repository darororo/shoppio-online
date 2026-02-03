import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { telegrafSessionMiddleware } from 'middleware/telegraf-session.middleware'
import { TelegrafModule } from 'nestjs-telegraf'
// import { PagesModule } from './pages/pages.module';
// import { MessagesModule } from './messages/messages.module';
import { AnalyzedMessagesModule } from './analyzed_messages/analyzed_messages.module'
import { AnalyzerModule } from './analyzer/analyzer.module'
import { AnalyzerService } from './analyzer/analyzer.service'
import { GeminiService } from './analyzer/gemini.service'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
// import { UsersModule } from './users/users.module';
import { BuyersModule } from './buyers/buyers.module'
// import { PostsModule } from './posts/posts.module';
// import { PostDistributionsModule } from './post_distributions/post_distributions.module';
import { CommonModule } from './common/common.module'
import { UnhandledExceptionLogger } from './common/unhandled-exception.logger'
import { getDatabaseConfig } from './database/database.provider'
import { FacebookModule } from './facebook/facebook.module'
import { OllamaAiModule } from './ollama_ai/ollama_ai.module'
import { OrdersModule } from './orders/orders.module'
// import { SocialAccountModule } from './social_account/social_account.module';
import { SocialPagesModule } from './social_pages/social_pages.module'
import { SHOPPIO_BOT_NAME } from './telegram_bot/telegram_bot.constants'
import { TelegramBotModule } from './telegram_bot/telegram_bot.module'

@Module({
  imports: [
    CommonModule, // Add security services globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ScheduleModule.forRoot(),

    AuthModule,
    FacebookModule,
    AnalyzerModule,

    // Telegram bots
    TelegrafModule.forRootAsync({
      botName: SHOPPIO_BOT_NAME,
      useFactory: () => ({
        token: process.env.SHOPPIO_BOT_TOKEN?.toString() || '',
        middlewares: [telegrafSessionMiddleware],
        include: [TelegramBotModule],
        // options: {
        //   handlerTimeout: 1,
        // }
        // launchOptions: {
        //   webhook: {
        //     domain: process.env.BACKEND_HOST?.toString() || "",
        //     path: ''
        //   }
        // }
      }),
    }),
    OllamaAiModule,
    TelegramBotModule,
    // SocialAccountModule,
    SocialPagesModule,
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
  providers: [
    AppService,
    GeminiService,
    AnalyzerService,
    UnhandledExceptionLogger,
  ],
})
export class AppModule {}
