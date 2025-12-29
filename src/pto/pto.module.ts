import { Module } from '@nestjs/common';
import { PtoService } from './pto.service';
import { PtoController } from './pto.controller';

@Module({
  controllers: [PtoController],
  providers: [PtoService]
})
export class PtoModule {}
