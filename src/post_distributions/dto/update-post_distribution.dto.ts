import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDistributionDto } from './create-post_distribution.dto';

export class UpdatePostDistributionDto extends PartialType(CreatePostDistributionDto) {}
