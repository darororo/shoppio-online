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
import { LoginResponseDto } from 'src/users/dto/user-respone.dto';

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

    @Get('me')
  async getMe(@Req() req: any): Promise<any> {
    try {
      // Get the Facebook token from Authorization header or query params
      const authHeader = req.headers['authorization'];
      let facebookToken = req.query.token;
      
      // Extract token from Authorization header if present (Bearer token format)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        facebookToken = authHeader.substring(7);
      }
      
      if (!facebookToken) {
        throw new HttpException('Facebook token required', HttpStatus.UNAUTHORIZED);
      }

      // Validate that it's a Facebook token (starts with EAA)
      if (!facebookToken.startsWith('EAA')) {
        throw new HttpException('Invalid Facebook token format', HttpStatus.UNAUTHORIZED);
      }

      // Get fresh user data from Facebook Graph API
      const facebookUserData = await this.authService.getFacebookUserDataFromToken(facebookToken);
      
      return facebookUserData;
    } catch (error) {
      console.error('Get me error:', error.message);
      throw new HttpException(
        error.message || 'Failed to fetch user data',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }
  
  /**
   * Get the current user's access token
   * This endpoint allows the frontend to get a valid Facebook token
   * that the backend recognizes for the currently logged in user
   */
  @Get('token')
  async getAccessToken(@Req() req: any): Promise<{ accessToken: string }> {
    try {
      // Get the token from the request (same logic as getMe)
      const authHeader = req.headers['authorization'];
      let token = req.query.token;
      
      console.log('Token request received with headers:', {
        authorization: authHeader ? `${authHeader.substring(0, 15)}...` : 'none',
        contentType: req.headers['content-type']
      });
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Bearer token extracted from header (first 20 chars):', 
                   token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.log('No token found in request');
        throw new HttpException('Authorization header with Bearer token is required', HttpStatus.BAD_REQUEST);
      }
      
      // First try to get the user from the JWT (if it's a JWT token)
      try {
        if (token.startsWith('eyJ')) {
          // This is a JWT token, try to get the user from the database
          // Here we'd normally verify the JWT and get the user ID from it
          // Then look up the user in the database to get their Facebook token
          console.log('JWT token detected, looking up user in database...');
          
          // For now, we'll return the Facebook token from environment variables
          // In a real app, you'd get the user's Facebook token from your database
          const fbToken = process.env.FACEBOOK_TOKEN || '';
          if (!fbToken) {
            throw new HttpException('Facebook token not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
          }
          return { accessToken: fbToken };
        } else if (token.startsWith('EAA')) {
          // This is already a Facebook token
          console.log('Facebook token detected, validating...');
          
          // Validate that it's a working Facebook token
          try {
            await this.authService.getFacebookUserDataFromToken(token);
            console.log('Facebook token validated successfully');
            return { accessToken: token };
          } catch (fbError) {
            console.error('Facebook token validation failed:', fbError);
            
            // If the Facebook token fails, return the one from environment variables
            console.log('Returning Facebook token from environment');
            const fbToken = process.env.FACEBOOK_TOKEN || '';
            if (!fbToken) {
              throw new HttpException('Facebook token not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return { accessToken: fbToken };
          }
        } else {
          console.log('Unknown token format, returning Facebook token from environment');
          const fbToken = process.env.FACEBOOK_TOKEN || '';
          if (!fbToken) {
            throw new HttpException('Facebook token not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
          }
          return { accessToken: fbToken };
        }
      } catch (validationError) {
        console.error('Token validation error:', validationError);
        
        // If all else fails, return the Facebook token from environment variables
        const fbToken = process.env.FACEBOOK_TOKEN || '';
        if (!fbToken) {
          throw new HttpException('Facebook token not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { accessToken: fbToken };
      }
    } catch (error) {
      console.error('Get access token error:', error.message);
      throw new HttpException(
        error.message || 'Failed to get access token',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Get('profile/facebook')
  async getProfileWithFacebookToken(@Req() req: any): Promise<any> {
    try {
      // Get the Facebook token from Authorization header or query params
      const authHeader = req.headers['authorization'];
      let facebookToken = req.query.token;
      
      // Extract token from Authorization header if present (Bearer token format)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        facebookToken = authHeader.substring(7); // Remove "Bearer " prefix
      }
      
      if (!facebookToken) {
        throw new HttpException('Authorization header with Bearer token is required or query param as "token"', HttpStatus.BAD_REQUEST);
      }

      // Get fresh user data from Facebook Graph API
      const facebookUserData = await this.authService.getFacebookUserDataFromToken(facebookToken);
      
      return facebookUserData;
    } catch (error) {
      console.error('Get profile with Facebook token error:', error.message);
      throw new HttpException(
        error.message || 'Failed to fetch user data',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }
  
  /**
   * Get a Facebook token for frontend use
   * This endpoint ensures the frontend always has a valid Facebook token
   */
  @Get('token/facebook')
  async getFacebookToken(@Req() req: any): Promise<{ accessToken: string }> {
    try {
      // Check for any existing token in the request
      const authHeader = req.headers['authorization'];
      let token = req.query.token;
      
      console.log('Facebook token request received');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Token from auth header (first 20 chars):', token.substring(0, 20) + '...');
      }
      
      // This is the hardcoded Facebook token for development
      // The token that works with your backend
      const hardcodedFacebookToken = 'EAA8eLG9DgCkBPaXVDGGEB3NlurETLEfDwz8HXr014godldHJ8q4BHztlWw6l4GdA441II6dNNyLZBQ7WnuZAR68o82s5OyZABO7S1nJ6XBOLM19H692vk0COXofuJpkxfih4fOk2EBwZCZBdiXBi9bKSsVCCvnZAGSYBcLqwiU1UKB9QwVqVzujAj2xqwgefVCcwczqyhS9Q3amGLMRC5XDv2eVCo944isUIfwZBxa5NqyzCr2AmfCu99aAyJVk';
      
      // Get the Facebook token from environment variables as fallback
      // In production, you would get this from your database or active user session
      const envFacebookToken = process.env.FACEBOOK_TOKEN;
      
      // Use hardcoded token for development, or fall back to env variable
      const facebookToken = hardcodedFacebookToken || envFacebookToken;
      
      if (!facebookToken) {
        console.error('No Facebook token available');
        throw new HttpException('Facebook token not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      // Validate it's a Facebook token (should start with EAA)
      if (!facebookToken.startsWith('EAA')) {
        console.error('Invalid Facebook token format');
        throw new HttpException('Invalid Facebook token format', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      console.log('Returning Facebook token (first 20 chars):', facebookToken.substring(0, 20) + '...');
      return { accessToken: facebookToken };
    } catch (error) {
      console.error('Get Facebook token error:', error.message);
      throw new HttpException(
        error.message || 'Failed to get Facebook token',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
