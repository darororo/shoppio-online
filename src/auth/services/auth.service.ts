import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { FacebookLoginDto } from "src/users/dto/facebook-login.dto";
import { LoginResponseDto, UserResponseDto } from "src/users/dto/user-respone.dto";
import { UsersService } from "src/users/users.service";
import { TokenSecurityService } from "src/common/services/token-security.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenSecurityService: TokenSecurityService,
  ) {
    // Validate encryption setup on service initialization
    this.tokenSecurityService.validateEncryptionSetup();
  }

  async facebookLogin(facebookData: FacebookLoginDto): Promise<LoginResponseDto> {
    // Create or update user in database with Facebook access token
    const user = await this.usersService.createOrUpdateUser(facebookData);
    
    // Generate JWT token for backend authentication
    const payload = { 
      sub: user.id, 
      email: user.email,
      facebookId: user.facebookId 
    };
    
    const jwtToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    
    // Map user to response DTO with Facebook token
    const userResponse: UserResponseDto = {
      id: user.id,
      facebookId: user.facebookId,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      accessToken: facebookData.accessToken, // Return Facebook token to frontend
    };
    
    return {
      user: userResponse,
      accessToken: jwtToken, // JWT for backend auth
      facebookToken: facebookData.accessToken, // Facebook token for API calls
      expiresIn,
    };
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
      
      if (!appId || !appSecret) {
        throw new Error('Facebook app credentials not configured');
      }
      
      console.log('Exchanging authorization code for access token...');
      console.log('App ID:', appId);
      console.log('Code length:', code?.length || 0);
      console.log('Code preview:', code?.substring(0, 20) + '...' || 'NO CODE');
      console.log('Redirect URI:', redirectUri);
      
      const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;
      
      console.log('Making request to Facebook...');
      const response = await fetch(tokenUrl, {
        method: 'GET',
      });
      
      const data = await response.json();
      console.log('Facebook response:', data);
      
      if (data.error) {
        console.error('Facebook token exchange error:', data.error);
        throw new Error(`Facebook token exchange failed: ${data.error.message}`);
      }
      
      console.log('Token exchange successful');
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  async validateFacebookToken(accessToken: string): Promise<any> {
    try {
      // Verify Facebook access token by making a request to Facebook Graph API
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
      );
      
      if (!response.ok) {
        throw new Error('Invalid Facebook token');
      }
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      throw new Error('Facebook token validation failed');
    }
  }

  async getFacebookUserData(accessToken: string): Promise<any> {
    try {
      console.log('🔍 Fetching comprehensive user data from Facebook Graph API...');
      
      // Get comprehensive user data from Facebook Graph API
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large),cover,birthday,location,hometown,relationship_status,about,website,link,locale,timezone,verified,updated_time`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Facebook API error:', errorData);
        throw new Error(`Facebook API error: ${errorData.error?.message || 'Invalid token'}`);
      }
      
      const userData = await response.json();
      console.log('✅ Facebook user data retrieved:', {
        id: userData.id,
        name: userData.name,
        email: userData.email
      });
      
      return userData;
    } catch (error) {
      console.error('❌ Facebook user data fetch failed:', error.message);
      throw new Error(`Facebook user data fetch failed: ${error.message}`);
    }
  }

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      facebookId: user.facebookId,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async getFacebookUserDataFromToken(accessToken: string): Promise<any> {
    try {
      console.log('🔍 Fetching basic user data from Facebook Graph API...');
      
      // Get only basic user info - name and email
      const userResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`
      );
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('Facebook API error:', errorData);
        throw new Error(`Invalid Facebook token: ${errorData.error?.message || 'Token verification failed'}`);
      }
      
      const userData = await userResponse.json();
      console.log('✅ Basic user data retrieved:', {
        id: userData.id,
        name: userData.name,
        email: userData.email
      });

      // Verify that this token belongs to a user in our database
      const dbUser = await this.usersService.findByFacebookId(userData.id);
      if (!dbUser) {
        throw new Error('User not found in our database');
      }

      // Return simplified data with only name and email
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
        dbUser: {
          id: dbUser.id,
          facebookId: dbUser.facebookId,
          name: dbUser.name,
          email: dbUser.email,
          profilePicture: dbUser.profilePicture,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt,
          lastLoginAt: dbUser.lastLoginAt,
        }
      };
    } catch (error) {
      console.error('❌ Facebook user data fetch failed:', error.message);
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
  }

  async getFacebookUserDataWithStoredToken(userId: string): Promise<any> {
    try {
      console.log('🔍 Fetching user data using stored Facebook token...');
      
      // Get user from database
      const dbUser = await this.usersService.findById(userId);
      if (!dbUser) {
        throw new Error('User not found in our database');
      }

      if (!dbUser.accessToken) {
        throw new Error('No Facebook token stored for this user');
      }

      // Use the stored token to fetch fresh data from Facebook
      return await this.getFacebookUserDataFromToken(dbUser.accessToken);
    } catch (error) {
      console.error('❌ Failed to fetch user data with stored token:', error.message);
      throw new Error(`Failed to fetch user data with stored token: ${error.message}`);
    }
  }
}
