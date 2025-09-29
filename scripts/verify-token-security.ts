// Token Security Verification Script
import { EncryptionUtil } from '../src/common/utils/encryption.util';
import { TokenSecurityService } from '../src/common/services/token-security.service';
import { ConfigService } from '@nestjs/config';

async function verifyTokenSecurity() {
  console.log('🔐 Starting Token Security Verification...\n');

  // Test 1: Environment Setup Verification
  console.log('1️⃣ Verifying Environment Setup:');
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.log('❌ ENCRYPTION_KEY not found in environment');
    return false;
  }
  
  if (encryptionKey.length < 32) {
    console.log('❌ ENCRYPTION_KEY is too short (minimum 32 characters)');
    return false;
  }
  
  console.log('✅ ENCRYPTION_KEY found and has proper length');
  console.log(`   Key length: ${encryptionKey.length} characters\n`);

  // Test 2: Basic Encryption/Decryption
  console.log('2️⃣ Testing Basic Encryption/Decryption:');
  const testToken = 'EAAGhz0123456789_test_facebook_token_abcdefghijklmnopqrstuvwxyz';
  
  try {
    const encrypted = EncryptionUtil.encrypt(testToken);
    console.log('✅ Token encryption successful');
    console.log(`   Original: ${testToken.substring(0, 20)}...`);
    console.log(`   Encrypted: ${encrypted.substring(0, 40)}...`);
    
    const decrypted = EncryptionUtil.decrypt(encrypted);
    console.log('✅ Token decryption successful');
    
    if (decrypted === testToken) {
      console.log('✅ Encryption/Decryption roundtrip successful\n');
    } else {
      console.log('❌ Decrypted token does not match original');
      return false;
    }
  } catch (error) {
    console.log('❌ Encryption/Decryption failed:', error.message);
    return false;
  }

  // Test 3: Multiple Encryptions Produce Different Results
  console.log('3️⃣ Testing Encryption Randomness:');
  const encrypted1 = EncryptionUtil.encrypt(testToken);
  const encrypted2 = EncryptionUtil.encrypt(testToken);
  
  if (encrypted1 !== encrypted2) {
    console.log('✅ Multiple encryptions produce different ciphertext (good security)');
    console.log(`   Encryption 1: ${encrypted1.substring(0, 30)}...`);
    console.log(`   Encryption 2: ${encrypted2.substring(0, 30)}...\n`);
  } else {
    console.log('❌ Multiple encryptions produce same result (security concern)');
    return false;
  }

  // Test 4: TokenSecurityService Validation
  console.log('4️⃣ Testing TokenSecurityService:');
  const configService = new ConfigService();
  const tokenService = new TokenSecurityService(configService);
  
  try {
    const isValid = tokenService.validateEncryptionSetup();
    if (isValid) {
      console.log('✅ TokenSecurityService validation passed');
    } else {
      console.log('❌ TokenSecurityService validation failed');
      return false;
    }
  } catch (error) {
    console.log('❌ TokenSecurityService error:', error.message);
    return false;
  }

  // Test 5: Facebook Token Format Validation
  console.log('\n5️⃣ Testing Facebook Token Validation:');
  const validFbToken = 'EAAGhz0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const invalidToken = 'invalid_token_format';
  
  try {
    tokenService.encryptFacebookToken(validFbToken);
    console.log('✅ Valid Facebook token accepted');
    
    try {
      tokenService.encryptFacebookToken(invalidToken);
      console.log('❌ Invalid token was accepted (should be rejected)');
      return false;
    } catch (error) {
      console.log('✅ Invalid Facebook token properly rejected');
    }
  } catch (error) {
    console.log('❌ Token validation error:', error.message);
    return false;
  }

  // Test 6: Token Sanitization
  console.log('\n6️⃣ Testing Token Sanitization:');
  const sensitiveToken = 'EAAGhz0123456789abcdefghijklmnopqrstuvwxyz';
  const sanitized = tokenService.sanitizeTokenForLog(sensitiveToken);
  
  if (sanitized.includes('*') && !sanitized.includes(sensitiveToken.substring(7, -7))) {
    console.log('✅ Token sanitization working correctly');
    console.log(`   Original: ${sensitiveToken}`);
    console.log(`   Sanitized: ${sanitized}`);
  } else {
    console.log('❌ Token sanitization not working properly');
    return false;
  }

  console.log('\n🎉 All security verification tests passed!');
  console.log('✅ Facebook tokens are now stored securely with AES-256-GCM encryption');
  return true;
}

// Run verification if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  verifyTokenSecurity()
    .then(success => {
      if (success) {
        console.log('\n🔐 Token security implementation is SECURE ✅');
        process.exit(0);
      } else {
        console.log('\n🚨 Token security verification FAILED ❌');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Verification script error:', error);
      process.exit(1);
    });
}

export { verifyTokenSecurity };
