import { Test, TestingModule } from '@nestjs/testing';
import { OwnershipsService } from './ownerships.service';

describe('OwnershipsService', () => {
  let service: OwnershipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnershipsService],
    }).compile();

    service = module.get<OwnershipsService>(OwnershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
