import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { FacebookLoginDto } from "src/users/dto/facebook-login.dto";
import { LoginResponseDto, UserResponseDto } from "src/users/dto/user-respone.dto";
import { UsersService } from "src/users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async facebookLogin(facebookData: FacebookLoginDto): Promise<LoginResponseDto> {
    // Create or update user in database
    const user = await this.usersService.createOrUpdateUser(facebookData);
    
    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email,
      facebookId: user.facebookId 
    };
    
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    
    // Map user to response DTO
    const userResponse: UserResponseDto = {
      id: user.id,
      facebookId: user.facebookId,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
    
    return {
      user: userResponse,
      accessToken,
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
}
