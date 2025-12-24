import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  imports:[TypeOrmModule.forFeature([Assignment])],
})
export class AssignmentsModule {}
