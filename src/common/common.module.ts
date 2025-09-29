import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenSecurityService } from './services/token-security.service';
import { EncryptionUtil } from './utils/encryption.util';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    TokenSecurityService,
    {
      provide: 'EncryptionUtil',
      useClass: EncryptionUtil,
    },
  ],
  exports: [TokenSecurityService],
})
export class CommonModule {}
