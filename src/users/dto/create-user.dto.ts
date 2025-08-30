import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  page_id: string;

  @IsString()
  @IsNotEmpty()
  facebook_user_id: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  profile_pic: string;

  @IsString()
  @IsNotEmpty()
  access_token: string;
}
