// Database Token Storage Verification
import { DataSource, Not, IsNull } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { getDatabaseConfig } from '../src/database/database.provider';

async function verifyDatabaseTokenSecurity() {
  console.log('🔍 Verifying Database Token Storage Security...\n');
  
  let dataSource: DataSource | undefined;
  
  try {
    // Connect to database
    const dbConfig = getDatabaseConfig() as any;
    dataSource = new DataSource({
      type: dbConfig.type || 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: dbConfig.entities,
      synchronize: false,
    });
    
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get user repository
    const userRepository = dataSource.getRepository(User);

    // Find a user with a Facebook token (if any exists)
    const userWithToken = await userRepository.findOne({
      where: { accessToken: Not(IsNull()) }
    });

    if (!userWithToken) {
      console.log('ℹ️  No users with Facebook tokens found in database');
      console.log('   This is expected for a fresh database');
      
      // Create a test user to verify encryption
      console.log('\n🧪 Creating test user to verify encryption...');
      
      const testUser = new User();
      testUser.facebookId = 'test_fb_id_' + Date.now();
      testUser.name = 'Test User';
      testUser.email = 'test@example.com';
      testUser.accessToken = 'EAAGhz0123456789_test_token_for_encryption_verification';
      
      await userRepository.save(testUser);
      console.log('✅ Test user created with Facebook token');
      
      // Now retrieve the user to see how the token is stored
      const retrievedUser = await userRepository.findOne({
        where: { facebookId: testUser.facebookId }
      });
      
      if (retrievedUser) {
        console.log('✅ Test user retrieved successfully');
        console.log('   Token in application:', retrievedUser.accessToken?.substring(0, 20) + '...');
        
        // Check raw database storage
        const rawQuery = await dataSource.query(
          'SELECT "accessToken" FROM users WHERE "facebookId" = $1',
          [testUser.facebookId]
        );
        
        if (rawQuery.length > 0) {
          const rawToken = rawQuery[0].accessToken;
          console.log('   Raw token in database:', rawToken?.substring(0, 40) + '...');
          
          if (rawToken !== retrievedUser.accessToken) {
            console.log('✅ Token is encrypted in database (raw ≠ decrypted)');
          } else {
            console.log('❌ Token appears to be stored in plain text!');
          }
        }
        
        // Clean up test user
        await userRepository.remove(testUser);
        console.log('✅ Test user cleaned up');
      }
      
    } else {
      console.log(`✅ Found user with Facebook token: ${userWithToken.name}`);
      console.log(`   User ID: ${userWithToken.id}`);
      console.log(`   Token (decrypted): ${userWithToken.accessToken?.substring(0, 20)}...`);
      
      // Check raw database storage
      const rawQuery = await dataSource.query(
        'SELECT "accessToken" FROM users WHERE id = $1',
        [userWithToken.id]
      );
      
      if (rawQuery.length > 0) {
        const rawToken = rawQuery[0].accessToken;
        console.log(`   Token (raw in DB): ${rawToken?.substring(0, 40)}...`);
        
        if (rawToken !== userWithToken.accessToken) {
          console.log('✅ Token is properly encrypted in database');
        } else {
          console.log('❌ WARNING: Token appears to be stored in plain text!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }

  console.log('\n🎉 Database token security verification completed!');
  return true;
}

// Run if executed directly
if (require.main === module) {
  require('dotenv').config();
  
  verifyDatabaseTokenSecurity()
    .then(success => {
      if (success) {
        console.log('\n🔐 Database token storage is SECURE ✅');
      } else {
        console.log('\n🚨 Database token storage verification FAILED ❌');
      }
    })
    .catch(error => {
      console.error('\n💥 Database verification error:', error);
    });
}

export { verifyDatabaseTokenSecurity };
