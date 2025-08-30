import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IntentionEnum } from '../enum/intention_enum';

export class CreateAnalyzedMessageDto {
  @IsString()
  phone_number: string;

  @IsString()
  location: string;

  @IsNotEmpty()
  @IsNumber()
  intention_score: number;

  @IsNotEmpty()
  @IsEnum(IntentionEnum)
  intention: IntentionEnum;
}
