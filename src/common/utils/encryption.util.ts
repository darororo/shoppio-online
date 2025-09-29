import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;
  private static readonly TAG_POSITION = EncryptionUtil.SALT_LENGTH + EncryptionUtil.IV_LENGTH;
  private static readonly ENCRYPTED_POSITION = EncryptionUtil.TAG_POSITION + EncryptionUtil.TAG_LENGTH;

  /**
   * Encrypt sensitive data like access tokens
   */
  static encrypt(text: string, encryptionKey?: string): string {
    if (!text) return text;
    
    try {
      const key = encryptionKey || process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
      }

      const salt = crypto.randomBytes(EncryptionUtil.SALT_LENGTH);
      const iv = crypto.randomBytes(EncryptionUtil.IV_LENGTH);
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');
      
      const cipher = crypto.createCipheriv(EncryptionUtil.ALGORITHM, derivedKey, iv);
      cipher.setAAD(salt);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine salt + iv + tag + encrypted
      const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data like access tokens
   */
  static decrypt(encryptedData: string, encryptionKey?: string): string {
    if (!encryptedData) return encryptedData;
    
    try {
      const key = encryptionKey || process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
      }

      const combined = Buffer.from(encryptedData, 'base64');
      
      const salt = combined.subarray(0, EncryptionUtil.SALT_LENGTH);
      const iv = combined.subarray(EncryptionUtil.SALT_LENGTH, EncryptionUtil.TAG_POSITION);
      const tag = combined.subarray(EncryptionUtil.TAG_POSITION, EncryptionUtil.ENCRYPTED_POSITION);
      const encrypted = combined.subarray(EncryptionUtil.ENCRYPTED_POSITION);
      
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');
      
      const decipher = crypto.createDecipheriv(EncryptionUtil.ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Generate a secure encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
