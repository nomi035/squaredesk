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
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import { OutreachService } from './outreach.service';

@ApiTags('outreach')
@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

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
    @currentUser() user: { organization: number },
  ) {
    return this.outreachService.importFromContent(file.buffer.toString('utf-8'), user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@currentUser() user: { organization: number }) {
    return this.outreachService.findAll(user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('organization')
  removeAllByOrganization(@currentUser() user: { organization: number }) {
    return this.outreachService.removeAllByOrganization(user.organization);
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
