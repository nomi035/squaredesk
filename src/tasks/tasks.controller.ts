import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './entities/task.entity';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @currentUser() user: { organization: number }) {
    return this.tasksService.create({
      ...createTaskDto,
      organizationId: user.organization,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  findAll(
    @currentUser() user: { organization: number },
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasksService.findAll(user.organization, status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('assignee/:assignToId')
  findByAssignee(
    @Param('assignToId') assignToId: string,
    @currentUser() user: { organization: number },
  ) {
    return this.tasksService.findByAssignee(+assignToId, user.organization);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
