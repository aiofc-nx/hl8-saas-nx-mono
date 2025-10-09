import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';
import { USERNAME_VALIDATION, PASSWORD_VALIDATION } from '../../../constants/user.constants';

export class RegisterUserDto {
  @IsString()
  @Length(USERNAME_VALIDATION.MIN_LENGTH, USERNAME_VALIDATION.MAX_LENGTH)
  @Matches(USERNAME_VALIDATION.PATTERN)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(PASSWORD_VALIDATION.MIN_LENGTH, PASSWORD_VALIDATION.MAX_LENGTH)
  password!: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

