import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from '../utils/encryption.util';
import * as crypto from 'crypto';

@Injectable()
export class TokenSecurityService {
  private readonly logger = new Logger(TokenSecurityService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Securely store Facebook access token
   */
  encryptFacebookToken(token: string): string {
    try {
      if (!token) {
        throw new Error('Token cannot be empty');
      }

      // Validate token format (Facebook tokens typically start with specific patterns)
      if (!this.isValidFacebookToken(token)) {
        throw new Error('Invalid Facebook token format');
      }

      return EncryptionUtil.encrypt(token);
    } catch (error) {
      this.logger.error('Failed to encrypt Facebook token:', error);
      throw new Error('Token encryption failed');
    }
  }

  /**
   * Retrieve and decrypt Facebook access token
   */
  decryptFacebookToken(encryptedToken: string): string | null {
    try {
      if (!encryptedToken) {
        return null;
      }

      const decryptedToken = EncryptionUtil.decrypt(encryptedToken);
      
      // Validate decrypted token
      if (!this.isValidFacebookToken(decryptedToken)) {
        throw new Error('Decrypted token is invalid');
      }

      return decryptedToken;
    } catch (error) {
      this.logger.error('Failed to decrypt Facebook token:', error);
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Validate Facebook token format
   */
  private isValidFacebookToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Facebook access tokens typically:
    // - Start with 'EAA' for app access tokens
    // - Start with 'EAAG' for page access tokens  
    // - Have minimum length requirements
    const facebookTokenPattern = /^EAA[A-Za-z0-9+/=_-]+$/;
    return facebookTokenPattern.test(token) && token.length >= 50;
  }

  /**
   * Hash token for comparison (one-way)
   */
  hashToken(token: string): string {
    return EncryptionUtil.hash(token);
  }

  /**
   * Generate secure session token
   */
  generateSecureSessionToken(): string {
    return EncryptionUtil.generateSecureToken(64);
  }

  /**
   * Validate token expiration (for future use)
   */
  isTokenExpired(tokenData: any): boolean {
    if (!tokenData?.expires_at) {
      return false; // No expiration set
    }

    return new Date() > new Date(tokenData.expires_at);
  }

  /**
   * Sanitize token for logging (replace with asterisks)
   */
  sanitizeTokenForLog(token: string): string {
    if (!token || token.length < 10) {
      return '***';
    }

    return token.substring(0, 6) + '*'.repeat(token.length - 12) + token.substring(token.length - 6);
  }

  /**
   * Validate environment encryption setup
   */
  validateEncryptionSetup(): boolean {
    try {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
      
      if (!encryptionKey) {
        this.logger.error('ENCRYPTION_KEY environment variable is missing');
        return false;
      }

      if (encryptionKey.length < 32) {
        this.logger.error('ENCRYPTION_KEY is too short (minimum 32 characters)');
        return false;
      }

      // Test encryption/decryption
      const testData = 'test_token_12345';
      const encrypted = EncryptionUtil.encrypt(testData);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      if (decrypted !== testData) {
        this.logger.error('Encryption/decryption test failed');
        return false;
      }

      this.logger.log('✅ Encryption setup validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Encryption setup validation failed:', error);
      return false;
    }
  }
}
