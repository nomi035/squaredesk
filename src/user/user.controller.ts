import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { PermissionName } from 'src/permission/entities/permission.entity';
import { PermissionService } from 'src/permission/permission.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'password', 'email', 'phone', 'role'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        password: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        address1: { type: 'string' },
        address2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        ptoDays: { type: 'number' },
        emergencyName: { type: 'string' },
        emergencyPhone: { type: 'string' },
        emergencyRelation: { type: 'string' },
        role: { type: 'string', enum: Object.values(Role) },
        salaryAmount: { type: 'number' },
        employeeId: { type: 'string' },
        bloodGroup: { type: 'string' },
        department: { type: 'string' },
        cnicNumber: { type: 'string' },
        reportsToId: { type: 'number', description: 'Manager user id' },
        designation: { type: 'string' },
        documentNames: {
          type: 'string',
          description: 'JSON array or comma-separated names matching documents order',
          example: '["ID Card","Contract"]',
        },
        profilePic: { type: 'string', format: 'binary' },
        documents: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePic', maxCount: 1 },
      { name: 'documents', maxCount: 10 },
    ]),
  )
  async create(
    @Body() body: Record<string, string>,
    @UploadedFiles()
    files: {
      profilePic?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
    @currentUser() user: { organization: number },
  ) {
    const createUserDto = this.userService.parseCreateUserBody(body);
    const userExists = await this.userService.findByEmail(createUserDto.email);
    if (userExists) {
      throw new HttpException('User already exists', 400);
    }

    const documentNames = this.userService.parseDocumentNames(body.documentNames);

    return this.userService.createWithFiles(
      {
        ...createUserDto,
        organizationId: user.organization,
      },
      files.profilePic?.[0],
      files.documents ?? [],
      documentNames,
    );
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('/office/based')
  @UseGuards(JwtAuthGuard)
  async findAllOffice(
    @Query('role') role: Role, 
    @Query('includeInactive') includeInactive: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @currentUser() user?: any
  ) {
    const activeUser = await this.userService.findOne(user.userId);
    const pageNum = page ? Number(page) : undefined;
    const limitNum = limit ? Number(limit) : undefined;
    return this.userService.findAllByOffice(role, activeUser.organizationId, includeInactive === 'true', pageNum, limitNum);
  }

  @Get('/organization/based')
  @UseGuards(JwtAuthGuard)
  findAllByOrganization(
    @Query('role') role: Role, 
    @Query('includeInactive') includeInactive: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @currentUser() user?: any
  ) {
    const pageNum = page ? Number(page) : undefined;
    const limitNum = limit ? Number(limit) : undefined;
    return this.userService.findAllByOrganization(role, user.organization, includeInactive === 'true', pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('reporting')
  getReportingStructure(@currentUser() user: { organization: number }) {
    return this.userService.getReportingStructure(user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/reporting')
  getUserReporting(
    @Param('id') id: string,
    @currentUser() user: { organization: number },
  ) {
    return this.userService.getUserReporting(+id, user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('permission/check')
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiQuery({ name: 'permission', enum: PermissionName, required: true })
  checkPermission(
    @Query('userId') userId: string,
    @Query('permission') permission: PermissionName,
  ) {
    return this.permissionService.isAllowed(+userId, permission);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        password: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        address1: { type: 'string' },
        address2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        ptoDays: { type: 'number' },
        emergencyName: { type: 'string' },
        emergencyPhone: { type: 'string' },
        emergencyRelation: { type: 'string' },
        role: { type: 'string', enum: Object.values(Role) },
        salaryAmount: { type: 'number' },
        employeeId: { type: 'string' },
        bloodGroup: { type: 'string' },
        department: { type: 'string' },
        cnicNumber: { type: 'string' },
        reportsToId: { type: 'number', description: 'Manager user id' },
        designation: { type: 'string' },
        isActive: { type: 'boolean' },
        documentNames: {
          type: 'string',
          description: 'JSON array or comma-separated names matching documents order',
          example: '["ID Card","Contract"]',
        },
        profilePic: { type: 'string', format: 'binary' },
        documents: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePic', maxCount: 1 },
      { name: 'documents', maxCount: 10 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles()
    files?: {
      profilePic?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    const updateUserDto = this.userService.parseUpdateUserBody(body);
    const documentNames = this.userService.parseDocumentNames(
      body.documentNames as string | undefined,
    );

    return this.userService.updateWithFiles(
      +id,
      updateUserDto,
      files?.profilePic?.[0],
      files?.documents ?? [],
      documentNames,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id/documents/:documentId')
  removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.userService.removeDocument(+id, +documentId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
