import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { StatusEnum } from '../enum/status_enum';

export class CreateOrderDto {
  @IsString()
  product_name?: string;

  @IsInt()
  quantity?: number;

  @IsString()
  buyerId?: string;

  @IsString()
  buyerName?: string;

  // @IsEnum(StatusEnum)
  // status: StatusEnum;
}
