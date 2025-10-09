/**
 * 租户控制器单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@hl8/hybrid-archi';
import { TenantController } from './tenant.controller';

describe('TenantController', () => {
  let controller: TenantController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: 添加更多测试
});

