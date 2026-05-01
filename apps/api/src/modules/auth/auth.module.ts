import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
