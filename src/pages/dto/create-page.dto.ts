import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePageDto {
  @IsNotEmpty()
  @IsString()
  page_id: string;

  @IsNotEmpty()
  @IsString()
  page_name;
}
