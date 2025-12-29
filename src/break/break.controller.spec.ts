import { Test, TestingModule } from '@nestjs/testing';
import { BreakController } from './break.controller';
import { BreakService } from './break.service';

describe('BreakController', () => {
  let controller: BreakController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreakController],
      providers: [BreakService],
    }).compile();

    controller = module.get<BreakController>(BreakController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
