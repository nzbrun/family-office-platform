import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
