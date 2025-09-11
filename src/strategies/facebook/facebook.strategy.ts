import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: 'http://localhost:3000/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'name', 'email', 'picture.type(large)']
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any
  ): Promise<any> {
    try {
      console.log('Facebook strategy validation started:', {
        profileId: profile.id,
        profileName: profile.displayName,
        hasEmails: !!profile.emails?.length,
        hasPhotos: !!profile.photos?.length,
        accessTokenLength: accessToken?.length || 0
      });

      const { id, name, emails, photos } = profile;
      
      const user = {
        facebookId: id,
        email: emails?.[0]?.value,
        firstName: name?.givenName,
        lastName: name?.familyName,
        name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim() || profile.displayName,
        profilePicture: photos?.[0]?.value,
        accessToken
      };
      
      console.log('Facebook user object created:', {
        ...user,
        accessToken: user.accessToken ? '***HIDDEN***' : 'MISSING'
      });
      
      done(null, user);
    } catch (error) {
      console.error('Facebook strategy validation error:', error);
      done(error, null);
    }
  }
}
