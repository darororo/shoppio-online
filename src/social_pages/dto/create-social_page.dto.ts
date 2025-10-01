import { IsString, IsOptional } from 'class-validator';

export class CreateSocialPageDto {
  @IsString()
  page_id: string;

  @IsString()
  @IsOptional()
  page_name?: string;

  @IsString()
  @IsOptional()
  access_token?: string;

  @IsString()
  @IsOptional()
  social_account_id?: string;
}
