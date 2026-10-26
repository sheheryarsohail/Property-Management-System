import { Test, TestingModule } from '@nestjs/testing';
import { StatementsService } from './statements.service';

describe('StatementsService', () => {
  let service: StatementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatementsService],
    }).compile();

    service = module.get<StatementsService>(StatementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
