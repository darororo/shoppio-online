import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { StatusEnum } from '../enum/status_enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsNotEmpty()
  @IsEnum(StatusEnum)
  status: StatusEnum;
}
