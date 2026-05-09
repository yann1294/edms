import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsEmpty, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../shared/current-user';
import { RequestWithContext } from '../../shared/request-context';
import { DocumentsService } from './documents.service';

class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;
}

class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  // Explicitly reject attempts to change status.
  @IsOptional()
  @IsEmpty()
  status?: unknown;
}

class ListDocumentsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  private orgIdFromContext(req: RequestWithContext): string {
    const orgId = req?.context?.organizationId;
    if (!orgId) throw new BadRequestException('organizationId is required (x-organization-id header).');
    return orgId;
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() body: CreateDocumentDto,
    @Req() req: RequestWithContext,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const organizationId = this.orgIdFromContext(req);
    return this.documents.createDocument({
      organizationId,
      actor,
      title: body.title,
      description: body.description ?? null,
      folderId: body.folderId ?? null,
      documentTypeId: body.documentTypeId ?? null,
    });
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  get(@Param('id') id: string, @Req() req: RequestWithContext) {
    return this.documents.getDocumentById({ id, organizationId: this.orgIdFromContext(req) });
  }

  @UseGuards(AuthGuard)
  @Get()
  list(@Query() query: ListDocumentsQueryDto, @Req() req: RequestWithContext) {
    const organizationId = this.orgIdFromContext(req);
    return this.documents.listDocuments({
      organizationId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
    @Req() req: RequestWithContext,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const organizationId = this.orgIdFromContext(req);
    return this.documents.updateDocument({
      id,
      organizationId,
      actor,
      title: body.title,
      description: body.description,
      folderId: body.folderId,
    });
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: RequestWithContext, @CurrentUser() actor: CurrentUserType) {
    const organizationId = this.orgIdFromContext(req);
    return this.documents.deleteDocument({ id, organizationId, actor });
  }
}
