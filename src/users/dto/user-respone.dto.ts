export class UserResponseDto {
  id: string;
  facebookId: string;
  name: string;
  email: string | null;
  profilePicture: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export class LoginResponseDto {
  user: UserResponseDto;
  accessToken: string;
  expiresIn: string;
}
