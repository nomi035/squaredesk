import { Module } from '@nestjs/common';
import { BreakService } from './break.service';
import { BreakController } from './break.controller';

@Module({
  controllers: [BreakController],
  providers: [BreakService]
})
export class BreakModule {}
