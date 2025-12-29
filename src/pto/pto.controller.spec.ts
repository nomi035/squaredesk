import { Test, TestingModule } from '@nestjs/testing';
import { PtoController } from './pto.controller';
import { PtoService } from './pto.service';

describe('PtoController', () => {
  let controller: PtoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PtoController],
      providers: [PtoService],
    }).compile();

    controller = module.get<PtoController>(PtoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
