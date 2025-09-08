import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/services/auth.service';
import { FacebookLoginDto } from 'src/users/dto/facebook-login.dto';
import { LoginResponseDto, UserResponseDto } from 'src/users/dto/user-respone.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('facebook/auth-code')
  @UsePipes(new ValidationPipe({ transform: true }))
  async facebookAuthCode(@Body() body: { code: string; redirectUri: string }): Promise<LoginResponseDto> {
    try {
      console.log('Received Facebook auth code request:', {
        code: body.code ? '***PROVIDED***' : 'MISSING',
        redirectUri: body.redirectUri
      });

      if (!body.code || !body.redirectUri) {
        throw new HttpException('Authorization code and redirect URI are required', HttpStatus.BAD_REQUEST);
      }

      // Exchange authorization code for access token
      const tokenData = await this.authService.exchangeCodeForToken(body.code, body.redirectUri);
      console.log('Token exchange successful');

      // Get user data from Facebook
      const facebookUser = await this.authService.validateFacebookToken(tokenData.access_token);
      console.log('Facebook user validation successful:', {
        id: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email
      });

      // Create login data
      const loginData: FacebookLoginDto = {
        userID: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email,
        profilePicture: facebookUser.picture?.data?.url,
        accessToken: tokenData.access_token,
      };

      return await this.authService.facebookLogin(loginData);
    } catch (error) {
      console.error('Facebook auth code processing error:', error.message);
      throw new HttpException(
        error.message || 'Facebook authentication failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('facebook/login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async facebookLogin(@Body() facebookLoginDto: FacebookLoginDto): Promise<LoginResponseDto> {
    try {
      console.log('Received Facebook login request:', {
        ...facebookLoginDto,
        accessToken: facebookLoginDto.accessToken ? '***HIDDEN***' : undefined
      });

      // Validate Facebook token
      const facebookUser = await this.authService.validateFacebookToken(
        facebookLoginDto.accessToken
      );
      
      console.log('Facebook user validation successful:', {
        id: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email
      });
      
      // Ensure the Facebook ID matches
      if (facebookUser.id !== facebookLoginDto.userID) {
        console.error('Facebook ID mismatch:', {
          fromToken: facebookUser.id,
          fromRequest: facebookLoginDto.userID
        });
        throw new HttpException('Invalid Facebook token', HttpStatus.UNAUTHORIZED);
      }
      
      // Create login data with validated information
      const loginData: FacebookLoginDto = {
        userID: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email,
        profilePicture: facebookUser.picture?.data?.url || facebookLoginDto.profilePicture,
        accessToken: facebookLoginDto.accessToken,
      };
      
      console.log('Proceeding with login data:', {
        ...loginData,
        accessToken: '***HIDDEN***'
      });
      
      return await this.authService.facebookLogin(loginData);
    } catch (error) {
      console.error('Facebook login error:', error.message);
      console.error('Error details:', error);
      throw new HttpException(
        error.message || 'Facebook login failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // This route is just to initiate the Facebook OAuth flow
    // The actual logic is in the FacebookStrategy
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any): Promise<LoginResponseDto> {
    try {
      const facebookData: FacebookLoginDto = {
        userID: req.user.facebookId,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        accessToken: req.user.accessToken,
      };
      
      return await this.authService.facebookLogin(facebookData);
    } catch (error) {
      throw new HttpException(
        'Facebook callback processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any): Promise<UserResponseDto> {
    try {
      return await this.authService.getUserProfile(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Unable to fetch user profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the JWT token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return { message: 'Logged out successfully' };
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyToken(@Req() req: any): Promise<{ valid: boolean; user: UserResponseDto }> {
    try {
      const user = await this.authService.getUserProfile(req.user.id);
      return { valid: true, user };
    } catch (error) {
      throw new HttpException('Token verification failed', HttpStatus.UNAUTHORIZED);
    }
  }
}
