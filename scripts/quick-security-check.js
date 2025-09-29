// Simple Token Security Test
require('dotenv').config();

const crypto = require('crypto');

console.log('🔐 Quick Token Security Verification\n');

// 1. Check encryption key
const encryptionKey = process.env.ENCRYPTION_KEY;
console.log('1️⃣ Encryption Key Check:');
if (encryptionKey) {
  console.log(`✅ ENCRYPTION_KEY found (${encryptionKey.length} characters)`);
  if (encryptionKey.length >= 32) {
    console.log('✅ Key length is sufficient (32+ chars)');
  } else {
    console.log('❌ Key is too short (needs 32+ chars)');
  }
} else {
  console.log('❌ ENCRYPTION_KEY not found');
}

// 2. Test basic encryption
console.log('\n2️⃣ Basic Encryption Test:');
const testToken = 'EAAGhz0123456789_test_facebook_token';

try {
  // Simple AES encryption test
  const algorithm = 'aes-256-ctr';
  const secretKey = encryptionKey.substring(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(testToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  console.log('✅ Basic encryption works');
  console.log(`   Original: ${testToken.substring(0, 25)}...`);
  console.log(`   Encrypted: ${encrypted.substring(0, 30)}...`);
  
  // Test different encryptions produce different results
  const iv2 = crypto.randomBytes(16);
  const cipher2 = crypto.createCipheriv(algorithm, secretKey, iv2);
  let encrypted2 = cipher2.update(testToken, 'utf8', 'hex');
  encrypted2 += cipher2.final('hex');
  
  if (encrypted !== encrypted2) {
    console.log('✅ Multiple encryptions produce different results (good!)');
  } else {
    console.log('⚠️  Multiple encryptions produce same result');
  }
  
} catch (error) {
  console.log('❌ Encryption test failed:', error.message);
}

// 3. Check Facebook app configuration
console.log('\n3️⃣ Facebook Configuration Check:');
const fbAppId = process.env.FACEBOOK_APP_ID;
const fbAppSecret = process.env.FACEBOOK_APP_SECRET;

if (fbAppId) {
  console.log(`✅ FACEBOOK_APP_ID configured: ${fbAppId.substring(0, 8)}...`);
} else {
  console.log('❌ FACEBOOK_APP_ID not configured');
}

if (fbAppSecret) {
  console.log(`✅ FACEBOOK_APP_SECRET configured: ${fbAppSecret.substring(0, 8)}...`);
} else {
  console.log('❌ FACEBOOK_APP_SECRET not configured');
}

console.log('\n🎯 Summary:');
if (encryptionKey && encryptionKey.length >= 32 && fbAppId && fbAppSecret) {
  console.log('✅ Basic security configuration looks good!');
  console.log('📋 Next: Test with your NestJS application');
} else {
  console.log('⚠️  Some security configurations need attention');
}

console.log('\n📖 To run full verification:');
console.log('   npm run verify-token-security');
console.log('   npm run verify-database-security');
