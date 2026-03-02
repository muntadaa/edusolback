import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SetupAdminDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
  
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNumber()
  @Type(() => Number)
  company_id: number;
}
