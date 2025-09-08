import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../enum/roles';

export class CreateUserDto {
   @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password_hash?: string;

  @IsString()
  @IsOptional()
  role?: UserRole = UserRole.USER;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean = false;

  @IsString()
  name: string;

  @IsString()
  phone_number?: string;
}
