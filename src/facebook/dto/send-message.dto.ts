import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FacebookQuickReply, FacebookButton } from '../facebook.service';

export class SendTextMessageDto {
  @IsString()
  recipientId: string;

  @IsString()
  text: string;

  @IsString()
  pageAccessToken: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  quickReplies?: FacebookQuickReply[];
}

export class SendAttachmentDto {
  @IsString()
  recipientId: string;

  @IsEnum(['image', 'audio', 'video', 'file'])
  attachmentType: 'image' | 'audio' | 'video' | 'file';

  @IsString()
  attachmentUrl: string;

  @IsString()
  pageAccessToken: string;

  @IsOptional()
  @IsBoolean()
  isReusable?: boolean;
}

export class SendGenericTemplateDto {
  @IsString()
  recipientId: string;

  @IsArray()
  elements: Array<{
    title: string;
    image_url?: string;
    subtitle?: string;
    default_action?: {
      type: 'web_url';
      url: string;
      messenger_extensions?: boolean;
      webview_height_ratio?: 'compact' | 'tall' | 'full';
    };
    buttons?: FacebookButton[];
  }>;

  @IsString()
  pageAccessToken: string;
}

export class SendButtonTemplateDto {
  @IsString()
  recipientId: string;

  @IsString()
  text: string;

  @IsArray()
  buttons: FacebookButton[];

  @IsString()
  pageAccessToken: string;
}

export class SendSenderActionDto {
  @IsString()
  recipientId: string;

  @IsEnum(['typing_on', 'typing_off', 'mark_seen'])
  action: 'typing_on' | 'typing_off' | 'mark_seen';

  @IsString()
  pageAccessToken: string;
}

export class SendMessageDto {
  @IsString()
  recipientId: string;

  @ValidateNested()
  @Type(() => Object)
  message: any; // Using any for flexibility, could be more specific

  @IsString()
  pageAccessToken: string;

  @IsOptional()
  @IsEnum(['RESPONSE', 'UPDATE', 'MESSAGE_TAG', 'NON_PROMOTIONAL_SUBSCRIPTION'])
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' | 'NON_PROMOTIONAL_SUBSCRIPTION';

  @IsOptional()
  @IsString()
  tag?: string;
}
