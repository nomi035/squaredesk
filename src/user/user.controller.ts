import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { PermissionName } from 'src/permission/entities/permission.entity';
import { PermissionService } from 'src/permission/permission.service';
import { Role } from './entities/user.entity';


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
  async create(@Body() createUserDto: CreateUserDto,@currentUser() user:any) {
    const userExists = await this.userService.findByEmail(createUserDto.email);
    console.log("i am user",userExists)
    if(userExists)
      throw new HttpException('User already exists', 400);

    return this.userService.create({
      ...createUserDto,
      organizationId: user.organization,
    });
  }



  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('/office/based')
  @UseGuards(JwtAuthGuard)
  async findAllOffice(@Query('role') role: Role,@currentUser() user: any) {
    const activeUser=await this.userService.findOne(user.userId);
    return this.userService.findAllByOffice(role,activeUser.officeId);
  }
   @Get('/organization/based')
  @UseGuards(JwtAuthGuard)
  findAllByOrganization(@Query('role') role: Role,@currentUser() user: any) {
   return this.userService.findAllByOrganization(role,user.organization);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
