import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { StatusEnum } from '../enum/status_enum';

export class CreateOrderDto {
  @IsString()
  product_name?: string;

  @IsInt()
  quantity?: number;

  // @IsEnum(StatusEnum)
  // status: StatusEnum;
}
