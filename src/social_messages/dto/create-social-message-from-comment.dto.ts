import { IsString, IsOptional } from 'class-validator';

export class CreateSocialMessageFromCommentDto {
  @IsString()
  facebook_comment_id: string;

  @IsString()
  facebook_post_id: string;

  @IsString()
  message_text: string;

  @IsString()
  sender_id: string;

  @IsOptional()
  @IsString()
  parent_comment_id?: string;

  @IsString()
  social_page_id: string;

  @IsOptional()
  @IsString()
  post_id?: string; // Internal post ID if we have it
}
