import { PartialType } from '@nestjs/mapped-types';
import { CreateAnalyzedMessageDto } from './create-analyzed_message.dto';

export class UpdateAnalyzedMessageDto extends PartialType(CreateAnalyzedMessageDto) {}
