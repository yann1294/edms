import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsUUID } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../shared/current-user';
import { AuthGuard } from '../auth/auth.guard';
import { FileAssetsService } from './file-assets.service';

class UploadFileAssetDto {
  @IsUUID()
  organizationId!: string;
}

@Controller('file-assets')
export class FileAssetsController {
  constructor(private readonly fileAssets: FileAssetsService) {}

  @UseGuards(AuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Body() body: UploadFileAssetDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return this.fileAssets.upload({ organizationId: body.organizationId, file, actor });
  }

  @UseGuards(AuthGuard)
  @Get(':id/download-url')
  downloadUrl(@Param('id') id: string, @CurrentUser() actor: CurrentUserType) {
    return this.fileAssets.createDownloadUrl({ fileAssetId: id, actor });
  }
}

