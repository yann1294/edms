import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RequestWithContext } from '../../shared/request-context';

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
  me(@Req() request: RequestWithContext) {
    const user = request.context?.user;
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
