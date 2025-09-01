import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialAccountDto } from './create-social_account.dto';

export class UpdateSocialAccountDto extends PartialType(CreateSocialAccountDto) {}
