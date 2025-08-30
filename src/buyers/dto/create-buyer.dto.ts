import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBuyerDto {
  @IsNotEmpty()
  @IsString()
  facebook_user_id: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  profile_pic: string;
}
