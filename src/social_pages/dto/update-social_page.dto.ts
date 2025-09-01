import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialPageDto } from './create-social_page.dto';

export class UpdateSocialPageDto extends PartialType(CreateSocialPageDto) {}
