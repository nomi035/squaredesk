import { Module } from '@nestjs/common';
import { PtoService } from './pto.service';
import { PtoController } from './pto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pto } from './entities/pto.entity';

@Module({
  controllers: [PtoController],
  providers: [PtoService],
  imports: [TypeOrmModule.forFeature([Pto])],
})
export class PtoModule {}
