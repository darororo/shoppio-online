import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateFacebookMessageDto {
  @IsString()
  facebookMessageId: string;

  @IsString()
  conversationId: string;

  @IsString()
  message: string;

  @IsObject()
  from: {
    name: string;
    id: string;
    profile_pic?: string;
  };

  @IsObject()
  to: {
    data: {
      name: string;
      id: string;
    }[];
  };

  @IsOptional()
  @IsString()
  userId?: string;
}