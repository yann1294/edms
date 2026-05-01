import { Body, Controller, Get, NotImplementedException, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AuthGuard } from './auth.guard';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auditService: AuditService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    const emailHashPrefix = createHash('sha256')
      .update(body.email.trim().toLowerCase())
      .digest('hex')
      .slice(0, 12);

    this.auditService.record({
      actionCode: 'auth.login.attempt',
      metadata: {
        emailHashPrefix,
      },
    });

    throw new NotImplementedException('Login is not implemented yet (bootstrap scaffold).');
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me() {
    return {
      id: 'dev-user',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
    };
  }
}
