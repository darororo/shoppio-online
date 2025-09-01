import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialMessageDto } from './create-social_message.dto';

export class UpdateSocialMessageDto extends PartialType(CreateSocialMessageDto) {}
