import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentVersionsService } from './document-versions.service';

class CreateDocumentVersionDto {
  @IsUUID()
  fileAssetId!: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsBoolean()
  isMajorVersion?: boolean;
}

@Controller('documents/:id/versions')
export class DocumentVersionsController {
  constructor(private readonly versions: DocumentVersionsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Param('id') documentId: string, @Body() body: CreateDocumentVersionDto) {
    return this.versions.createVersion({
      documentId,
      fileAssetId: body.fileAssetId,
      changeSummary: body.changeSummary ?? null,
      isMajorVersion: body.isMajorVersion ?? false,
    });
  }
}

