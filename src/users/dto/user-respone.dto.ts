export class UserResponseDto {
  id: string;
  facebookId: string;
  name: string;
  email: string | null;
  profilePicture: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  accessToken?: string; // Facebook access token
}

export class LoginResponseDto {
  user: UserResponseDto;
  accessToken: string; // JWT token for backend auth
  facebookToken: string; // Facebook token for API calls
  expiresIn: string;
}
