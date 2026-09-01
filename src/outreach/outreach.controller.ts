import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { CreateOutreachCommentDto } from './dto/create-outreach-comment.dto';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import { OutreachService } from './outreach.service';

@ApiTags('outreach')
@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('import')
  @ApiQuery({ name: 'file', required: false, description: 'CSV filename in project root (default: Psychiatry.csv)' })
  importFromFile(
    @Query('file') file: string | undefined,
    @currentUser() user: { organization: number },
  ) {
    return this.outreachService.importFromFile(file ?? 'Psychiatry.csv', user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('import/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('employeeId') employeeIdStr: string,
    @currentUser() user: { organization: number; userId: number },
  ) {
    const assignedToId = employeeIdStr ? parseInt(employeeIdStr, 10) : user.userId;
    return this.outreachService.importFromContent(
      file.buffer.toString('utf-8'),
      user.organization,
      user.userId,
      assignedToId,
      file.originalname,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('files')
  findAllFiles(
    @currentUser() user: { organization: number; userId: number; role: string },
    @Query('all') all?: string,
  ) {
    const fetchUserId = (['admin', 'manager'].includes(user.role?.toLowerCase()) && all === 'true') || user.role?.toLowerCase() === 'admin' ? undefined : user.userId;
    return this.outreachService.findAllFiles(user.organization, fetchUserId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('files/:id')
  removeFile(
    @Param('id') id: string,
    @currentUser() user: { organization: number },
  ) {
    return this.outreachService.removeFile(Number(id), user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state (e.g. CA, NY)' })
  @ApiQuery({ name: 'taxonomy', required: false, description: 'Filter by taxonomy (partial match)' })
  @ApiQuery({ name: 'disposition', required: false, description: 'Filter by disposition (partial match)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'providerFileId', required: false, description: 'Filter by file' })
  findAll(
    @currentUser() user: { organization: number },
    @Query('providerFileId') providerFileId?: string,
    @Query('state') state?: string,
    @Query('taxonomy') taxonomy?: string,
    @Query('disposition') disposition?: string,
    @Query('startDate') startDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.outreachService.findAll(user.organization, {
      providerFileId: providerFileId ? Number(providerFileId) : undefined,
      state,
      taxonomy,
      disposition,
      startDate,
      toDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('export')
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state (e.g. CA, NY)' })
  @ApiQuery({ name: 'taxonomy', required: false, description: 'Filter by taxonomy (partial match)' })
  @ApiQuery({ name: 'disposition', required: false, description: 'Filter by disposition (partial match)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'providerFileId', required: false, description: 'Filter by file' })
  exportAll(
    @currentUser() user: { organization: number },
    @Query('providerFileId') providerFileId?: string,
    @Query('state') state?: string,
    @Query('taxonomy') taxonomy?: string,
    @Query('disposition') disposition?: string,
    @Query('startDate') startDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.outreachService.findAllForExport(user.organization, {
      providerFileId: providerFileId ? Number(providerFileId) : undefined,
      state,
      taxonomy,
      disposition,
      startDate,
      toDate,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('graph')
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state (e.g. CA, NY)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to enumeration date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'taxonomy', required: false, description: 'Filter by taxonomy (partial match)' })
  @ApiQuery({ name: 'disposition', required: false, description: 'Filter by disposition (partial match)' })

  @ApiQuery({ name: 'providerFileId', required: false, description: 'Filter by file' })
  getGraphData(
    @currentUser() user: { organization: number },
    @Query('providerFileId') providerFileId?: string,
    @Query('state') state?: string,
    @Query('taxonomy') taxonomy?: string,
    @Query('disposition') disposition?: string,
    @Query('startDate') startDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.outreachService.getGraphData(user.organization, {
      providerFileId: providerFileId ? Number(providerFileId) : undefined,
      state,
      taxonomy,
      disposition,
      startDate,
      toDate,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('organization')
  removeAllByOrganization(@currentUser() user: { organization: number }) {
    return this.outreachService.removeAllByOrganization(user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/comments')
  findComments(
    @Param('id') id: string,
    @currentUser() user: { organization: number },
  ) {
    return this.outreachService.findComments(+id, user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() createDto: CreateOutreachCommentDto,
    @currentUser() user: { organization: number; userId: number },
  ) {
    return this.outreachService.addComment(
      +id,
      user.organization,
      user.userId,
      createDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outreachService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOutreachDto: UpdateOutreachDto) {
    return this.outreachService.update(+id, updateOutreachDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outreachService.remove(+id);
  }
}
