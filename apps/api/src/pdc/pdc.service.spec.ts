import { Test, TestingModule } from '@nestjs/testing';
import { PdcService } from './pdc.service';

describe('PdcService', () => {
  let service: PdcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdcService],
    }).compile();

    service = module.get<PdcService>(PdcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
