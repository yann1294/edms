import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../shared/current-user';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
