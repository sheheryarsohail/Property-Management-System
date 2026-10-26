import { Test, TestingModule } from '@nestjs/testing';
import { PdcController } from './pdc.controller';

describe('PdcController', () => {
  let controller: PdcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdcController],
    }).compile();

    controller = module.get<PdcController>(PdcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
