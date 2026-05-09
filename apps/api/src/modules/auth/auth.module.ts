import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtAuthService } from './jwt-auth.service';
import { PasswordHasherService } from './password-hasher.service';
import { UsersLookupService } from './users-lookup.service';

@Module({
  imports: [AuditModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthService, PasswordHasherService, UsersLookupService, AuthGuard],
  exports: [AuthService, JwtAuthService, UsersLookupService, AuthGuard],
})
export class AuthModule {}
