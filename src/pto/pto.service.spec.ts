import { Test, TestingModule } from '@nestjs/testing';
import { PtoService } from './pto.service';

describe('PtoService', () => {
  let service: PtoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PtoService],
    }).compile();

    service = module.get<PtoService>(PtoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
