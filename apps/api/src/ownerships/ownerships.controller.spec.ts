import { Test, TestingModule } from '@nestjs/testing';
import { OwnershipsController } from './ownerships.controller';

describe('OwnershipsController', () => {
  let controller: OwnershipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnershipsController],
    }).compile();

    controller = module.get<OwnershipsController>(OwnershipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
