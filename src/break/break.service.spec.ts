import { Test, TestingModule } from '@nestjs/testing';
import { BreakService } from './break.service';

describe('BreakService', () => {
  let service: BreakService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BreakService],
    }).compile();

    service = module.get<BreakService>(BreakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
