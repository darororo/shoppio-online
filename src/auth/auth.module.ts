import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from 'src/auth/services/auth.service';
import { FacebookStrategy } from 'src/strategies/facebook/facebook.strategy';
import { JwtStrategy } from 'src/strategies/jwt/jwt.strategy';
import { User } from "src/users/entities/user.entity";
import { UsersService } from 'src/users/users.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, FacebookStrategy, JwtStrategy],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
