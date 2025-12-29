import { Module } from '@nestjs/common';
import { BreakService } from './break.service';
import { BreakController } from './break.controller';
import { Break } from './entities/break.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  controllers: [BreakController],
  providers: [BreakService],
  imports: [TypeOrmModule.forFeature([Break])],
  exports: [BreakService],
})
export class BreakModule {}
