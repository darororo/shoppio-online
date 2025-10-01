import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IntentionEnum } from '../enum/intention_enum';

export class CreateAnalyzedMessageDto {
  @IsString()
  buyerId: string;

  @IsString()
  buyerName: string;

  @IsString()
  phoneNumber?: string;

  @IsString()
  location?: string;

  @IsString()
  analysisNote: string;

  @IsNotEmpty()
  @IsNumber()
  confidence_score: number;

  @IsNotEmpty()
  @IsEnum(IntentionEnum)
  intention: IntentionEnum;
}
