import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { BuyersModule } from './buyers/buyers.module';
import { PagesModule } from './pages/pages.module';
import { MessagesModule } from './messages/messages.module';
import { AnalyzedMessagesModule } from './analyzed_messages/analyzed_messages.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, BuyersModule, PagesModule, MessagesModule, AnalyzedMessagesModule, OrdersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
