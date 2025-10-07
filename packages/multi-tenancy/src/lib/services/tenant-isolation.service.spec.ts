/**
 * 租户隔离服务单元测试
 *
 * 测试租户隔离服务的核心功能和业务逻辑
 *
 * @fileoverview 租户隔离服务单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from '@hl8/logger';
import { TenantIsolationService } from './tenant-isolation.service';
import { TenantContextService } from './tenant-context.service';
import {
  IMultiTenancyModuleOptions,
  ITenantIsolationConfig,
} from '../types/tenant-core.types';
import { DI_TOKENS } from '../constants';
import { ITenantIsolationStrategy } from '../strategies/isolation-strategy.interface';
import { TenantConfigInvalidException } from '../exceptions';

/**
 * Mock TenantContextService
 */
class MockTenantContextService {
  private tenantId: string | null = null;

  setTenant(tenantId: string | null): void {
    this.tenantId = tenantId;
  }

  getTenant(): string | null {
    return this.tenantId;
  }

  getContext(): Record<string, unknown> | null {
    return this.tenantId ? { tenantId: this.tenantId } : null;
  }
}

/**
 * Mock PinoLogger
 */
class MockPinoLogger {
  private context: Record<string, unknown> = {};

  setContext = jest.fn((context: Record<string, unknown>): void => {
    this.context = context;
  });

  info = jest.fn((message: string, data?: Record<string, unknown>): void => {
    console.log(`[INFO] ${message}`, data);
  });

  debug = jest.fn((message: string, data?: Record<string, unknown>): void => {
    console.log(`[DEBUG] ${message}`, data);
  });

  error = jest.fn((message: string, data?: Record<string, unknown>): void => {
    console.log(`[ERROR] ${message}`, data);
  });
}

/**
 * Mock Isolation Strategy
 */
class MockIsolationStrategy implements ITenantIsolationStrategy {
  getTenantKey = jest.fn(
    async (key: string, tenantId: string): Promise<string> => {
      return `tenant:${tenantId}:${key}`;
    }
  );

  async getTenantNamespace(tenantId: string): Promise<string> {
    return `tenant_${tenantId}`;
  }

  async isolateData<T = unknown>(data: T, tenantId: string): Promise<T> {
    if (data && typeof data === 'object') {
      return {
        ...(data as object),
        _tenantId: tenantId,
        _isolatedAt: new Date(),
      } as T;
    }
    return {
      data,
      _tenantId: tenantId,
      _isolatedAt: new Date(),
    } as T;
  }

  async extractTenantData<T = unknown>(data: T, tenantId: string): Promise<T> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const dataObj = data as Record<string, unknown>;
    const { _tenantId, ...cleanData } = dataObj;
    if (_tenantId !== tenantId) {
      throw new Error(
        `Tenant ID mismatch: expected ${tenantId}, got ${_tenantId}`
      );
    }
    return cleanData as T;
  }

  shouldIsolate = jest.fn(async (tenantId: string): Promise<boolean> => {
    return tenantId !== 'default' && tenantId !== 'system';
  });

  getIsolationConfig(): ITenantIsolationConfig {
    return {
      strategy: 'key-prefix',
      keyPrefix: 'tenant:',
      namespace: 'tenant-namespace',
      enableIsolation: true,
      level: 'strict',
    };
  }
}

describe('TenantIsolationService', () => {
  let service: TenantIsolationService;
  let mockTenantContextService: MockTenantContextService;
  let mockLogger: MockPinoLogger;
  let mockIsolationStrategy: MockIsolationStrategy;
  let mockModuleOptions: IMultiTenancyModuleOptions;

  /**
   * 默认隔离配置
   */
  const defaultIsolationConfig: ITenantIsolationConfig = {
    strategy: 'key-prefix',
    keyPrefix: 'tenant:',
    namespace: 'tenant-namespace',
    enableIsolation: true,
    level: 'strict',
  };

  beforeEach(async () => {
    // 创建Mock服务
    mockTenantContextService = new MockTenantContextService();
    mockLogger = new MockPinoLogger();
    mockIsolationStrategy = new MockIsolationStrategy();

    // 创建默认配置选项
    mockModuleOptions = {
      context: {
        enableAutoInjection: true,
        contextTimeout: 30000,
        enableAuditLog: true,
        contextStorage: 'memory',
        allowCrossTenantAccess: false,
      },
      isolation: defaultIsolationConfig,
      middleware: {
        enableTenantMiddleware: true,
        tenantHeader: 'X-Tenant-ID',
        tenantQueryParam: 'tenant',
        tenantSubdomain: true,
        validationTimeout: 5000,
        strictValidation: true,
      },
      security: {
        enableSecurityCheck: true,
        maxFailedAttempts: 5,
        lockoutDuration: 300000,
        enableAuditLog: true,
        enableIpWhitelist: false,
      },
    };

    // 创建测试模块
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantIsolationService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: DI_TOKENS.MODULE_OPTIONS,
          useValue: mockModuleOptions,
        },
      ],
    }).compile();

    service = module.get<TenantIsolationService>(TenantIsolationService);
  });

  describe('构造函数', () => {
    it('应该成功创建服务实例', () => {
      expect(service).toBeDefined();
    });

    it('应该在缺少isolation配置时抛出异常', () => {
      const invalidOptions = {
        context: mockModuleOptions.context,
        middleware: mockModuleOptions.middleware,
        security: mockModuleOptions.security,
        // 故意不包含 isolation 属性
      } as unknown as IMultiTenancyModuleOptions;

      expect(() => {
        new TenantIsolationService(
          invalidOptions,
          mockTenantContextService as any,
          mockLogger as any
        );
      }).toThrow(TenantConfigInvalidException);
    });
  });

  describe('onModuleInit', () => {
    it('应该成功初始化模块', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('应该记录初始化日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.onModuleInit();

      expect(infoSpy).toHaveBeenCalledWith('租户隔离服务初始化开始');
      expect(infoSpy).toHaveBeenCalledWith('租户隔离服务初始化完成', {
        strategy: defaultIsolationConfig.strategy,
        level: defaultIsolationConfig.level,
      });
    });

    it('应该在初始化失败时抛出异常', async () => {
      // 模拟初始化失败
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalInfo = mockLogger.info;
      mockLogger.info = jest.fn().mockImplementation(() => {
        throw new Error('初始化失败');
      });

      await expect(service.onModuleInit()).rejects.toThrow('初始化失败');

      expect(errorSpy).toHaveBeenCalledWith('租户隔离服务初始化失败', {
        error: '初始化失败',
      });

      // 恢复原始方法
      mockLogger.info = originalInfo;
    });
  });

  describe('getTenantKey', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功生成租户键', async () => {
      mockTenantContextService.setTenant('tenant-123');

      const result = await service.getTenantKey('user:456');

      expect(result).toBe('tenant:tenant-123:user:456');
    });

    it('应该支持自定义租户ID', async () => {
      const result = await service.getTenantKey(
        'user:456',
        'custom-tenant-789'
      );

      expect(result).toBe('tenant:custom-tenant-789:user:456');
    });

    it('应该在无租户上下文时返回原始键', async () => {
      mockTenantContextService.setTenant(null);

      const result = await service.getTenantKey('user:456');

      expect(result).toBe('user:456');
    });

    it('应该在禁用隔离时返回原始键', async () => {
      mockTenantContextService.setTenant('tenant-123');

      // 修改配置禁用隔离
      const disabledConfig = {
        ...mockModuleOptions,
        isolation: {
          ...defaultIsolationConfig,
          enableIsolation: false,
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TenantIsolationService,
          {
            provide: TenantContextService,
            useValue: mockTenantContextService,
          },
          {
            provide: PinoLogger,
            useValue: mockLogger,
          },
          {
            provide: DI_TOKENS.MODULE_OPTIONS,
            useValue: disabledConfig,
          },
        ],
      }).compile();

      const serviceWithDisabledIsolation = module.get<TenantIsolationService>(
        TenantIsolationService
      );
      await serviceWithDisabledIsolation.onModuleInit();

      const result = await serviceWithDisabledIsolation.getTenantKey(
        'user:456'
      );

      expect(result).toBe('user:456');
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.getTenantKey('user:456');

      expect(debugSpy).toHaveBeenCalledWith('租户键已生成', {
        originalKey: 'user:456',
        tenantKey: 'tenant:tenant-123:user:456',
        tenantId: 'tenant-123',
      });
    });

    it('应该在生成租户键失败时抛出异常', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const errorSpy = jest.spyOn(mockLogger, 'error');

      // 直接设置服务的策略为 Mock 策略
      (service as any).isolationStrategy = mockIsolationStrategy;

      // 模拟策略失败
      mockIsolationStrategy.getTenantKey.mockRejectedValue(
        new Error('策略失败')
      );

      await expect(service.getTenantKey('user:456')).rejects.toThrow(
        '策略失败'
      );

      expect(errorSpy).toHaveBeenCalledWith('生成租户键失败', {
        key: 'user:456',
        tenantId: undefined,
        error: '策略失败',
      });

      // 恢复原始方法
      mockIsolationStrategy.getTenantKey.mockReset();
    });
  });

  describe('getTenantNamespace', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功生成租户命名空间', async () => {
      mockTenantContextService.setTenant('tenant-123');

      const result = await service.getTenantNamespace();

      expect(result).toBe('tenant_tenant-123');
    });

    it('应该支持自定义租户ID', async () => {
      const result = await service.getTenantNamespace('custom-tenant-789');

      expect(result).toBe('tenant_custom-tenant-789');
    });

    it('应该在无租户上下文时返回默认命名空间', async () => {
      mockTenantContextService.setTenant(null);

      const result = await service.getTenantNamespace();

      expect(result).toBe('default');
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.getTenantNamespace();

      expect(debugSpy).toHaveBeenCalledWith('租户命名空间已生成', {
        tenantId: 'tenant-123',
        namespace: 'tenant_tenant-123',
      });
    });
  });

  describe('isolateData', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功隔离数据', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const data = { name: 'John', age: 30 };

      const result = await service.isolateData(data);

      expect(result).toEqual({
        name: 'John',
        age: 30,
        _tenantId: 'tenant-123',
        _isolatedAt: expect.any(Date),
      });
    });

    it('应该支持自定义租户ID', async () => {
      const data = { name: 'John', age: 30 };

      const result = await service.isolateData(data, 'custom-tenant-789');

      expect(result).toEqual({
        name: 'John',
        age: 30,
        _tenantId: 'custom-tenant-789',
        _isolatedAt: expect.any(Date),
      });
    });

    it('应该在无租户上下文时返回原始数据', async () => {
      mockTenantContextService.setTenant(null);
      const data = { name: 'John', age: 30 };

      const result = await service.isolateData(data);

      expect(result).toBe(data);
    });

    it('应该处理非对象数据', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const data = 'simple string';

      const result = await service.isolateData(data);

      expect(result).toEqual({
        data: 'simple string',
        _tenantId: 'tenant-123',
        _isolatedAt: expect.any(Date),
      });
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const data = { name: 'John', age: 30 };
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.isolateData(data);

      expect(debugSpy).toHaveBeenCalledWith('数据已隔离', {
        tenantId: 'tenant-123',
        dataKeys: ['name', 'age'],
        isolatedDataKeys: ['name', 'age', '_tenantId', '_isolatedAt'],
      });
    });
  });

  describe('extractTenantData', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功提取租户数据', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const isolatedData = {
        name: 'John',
        age: 30,
        _tenantId: 'tenant-123',
        _isolatedAt: new Date(),
      };

      const result = await service.extractTenantData(isolatedData);

      expect(result).toEqual({
        name: 'John',
        age: 30,
      });
    });

    it('应该支持自定义租户ID', async () => {
      const isolatedData = {
        name: 'John',
        age: 30,
        _tenantId: 'custom-tenant-789',
        _isolatedAt: new Date(),
      };

      const result = await service.extractTenantData(
        isolatedData,
        'custom-tenant-789'
      );

      expect(result).toEqual({
        name: 'John',
        age: 30,
      });
    });

    it('应该在租户ID不匹配时抛出异常', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const isolatedData = {
        name: 'John',
        age: 30,
        _tenantId: 'different-tenant-456',
        _isolatedAt: new Date(),
      };

      await expect(service.extractTenantData(isolatedData)).rejects.toThrow(
        'Tenant ID mismatch: expected tenant-123, got different-tenant-456'
      );
    });

    it('应该处理非对象数据', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const data = 'simple string';

      const result = await service.extractTenantData(data);

      expect(result).toBe(data);
    });

    it('应该在无租户上下文时返回原始数据', async () => {
      mockTenantContextService.setTenant(null);
      const isolatedData = {
        name: 'John',
        age: 30,
        _tenantId: 'tenant-123',
        _isolatedAt: new Date(),
      };

      const result = await service.extractTenantData(isolatedData);

      expect(result).toBe(isolatedData);
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const isolatedData = {
        name: 'John',
        age: 30,
        _tenantId: 'tenant-123',
        _isolatedAt: new Date(),
      };
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.extractTenantData(isolatedData);

      expect(debugSpy).toHaveBeenCalledWith('租户数据已提取', {
        tenantId: 'tenant-123',
        originalDataKeys: ['name', 'age', '_tenantId', '_isolatedAt'],
        cleanDataKeys: ['name', 'age'],
      });
    });
  });

  describe('getTenantKeys', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功批量生成租户键', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const keys = ['user:123', 'user:456', 'user:789'];

      const result = await service.getTenantKeys(keys);

      expect(result).toEqual([
        'tenant:tenant-123:user:123',
        'tenant:tenant-123:user:456',
        'tenant:tenant-123:user:789',
      ]);
    });

    it('应该支持自定义租户ID', async () => {
      const keys = ['user:123', 'user:456'];

      const result = await service.getTenantKeys(keys, 'custom-tenant-789');

      expect(result).toEqual([
        'tenant:custom-tenant-789:user:123',
        'tenant:custom-tenant-789:user:456',
      ]);
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const keys = ['user:123', 'user:456'];
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.getTenantKeys(keys);

      expect(debugSpy).toHaveBeenCalledWith('批量租户键已生成', {
        keyCount: 2,
        tenantKeysCount: 2,
      });
    });
  });

  describe('isolateDataList', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功批量隔离数据', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const dataList = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = await service.isolateDataList(dataList);

      expect(result).toEqual([
        {
          name: 'John',
          age: 30,
          _tenantId: 'tenant-123',
          _isolatedAt: expect.any(Date),
        },
        {
          name: 'Jane',
          age: 25,
          _tenantId: 'tenant-123',
          _isolatedAt: expect.any(Date),
        },
      ]);
    });

    it('应该支持自定义租户ID', async () => {
      const dataList = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = await service.isolateDataList(
        dataList,
        'custom-tenant-789'
      );

      expect(result).toEqual([
        {
          name: 'John',
          age: 30,
          _tenantId: 'custom-tenant-789',
          _isolatedAt: expect.any(Date),
        },
        {
          name: 'Jane',
          age: 25,
          _tenantId: 'custom-tenant-789',
          _isolatedAt: expect.any(Date),
        },
      ]);
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const dataList = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.isolateDataList(dataList);

      expect(debugSpy).toHaveBeenCalledWith('批量数据已隔离', {
        dataCount: 2,
        isolatedDataCount: 2,
      });
    });
  });

  describe('shouldIsolate', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该正确判断需要隔离的租户', async () => {
      mockTenantContextService.setTenant('tenant-123');

      const result = await service.shouldIsolate();

      expect(result).toBe(true);
    });

    it('应该正确判断不需要隔离的租户', async () => {
      mockTenantContextService.setTenant('default');

      const result = await service.shouldIsolate();

      expect(result).toBe(false);
    });

    it('应该在无租户上下文时返回false', async () => {
      mockTenantContextService.setTenant(null);

      const result = await service.shouldIsolate();

      expect(result).toBe(false);
    });

    it('应该在禁用隔离时返回false', async () => {
      mockTenantContextService.setTenant('tenant-123');

      // 修改配置禁用隔离
      const disabledConfig = {
        ...mockModuleOptions,
        isolation: {
          ...defaultIsolationConfig,
          enableIsolation: false,
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TenantIsolationService,
          {
            provide: TenantContextService,
            useValue: mockTenantContextService,
          },
          {
            provide: PinoLogger,
            useValue: mockLogger,
          },
          {
            provide: DI_TOKENS.MODULE_OPTIONS,
            useValue: disabledConfig,
          },
        ],
      }).compile();

      const serviceWithDisabledIsolation = module.get<TenantIsolationService>(
        TenantIsolationService
      );
      await serviceWithDisabledIsolation.onModuleInit();

      const result = await serviceWithDisabledIsolation.shouldIsolate();

      expect(result).toBe(false);
    });

    it('应该记录调试日志', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.shouldIsolate();

      expect(debugSpy).toHaveBeenCalledWith('隔离检查完成', {
        tenantId: 'tenant-123',
        shouldIsolate: true,
      });
    });

    it('应该在检查失败时返回false并记录错误', async () => {
      mockTenantContextService.setTenant('tenant-123');
      const errorSpy = jest.spyOn(mockLogger, 'error');

      // 直接设置服务的策略为 Mock 策略
      (service as any).isolationStrategy = mockIsolationStrategy;

      // 模拟策略失败
      mockIsolationStrategy.shouldIsolate.mockRejectedValue(
        new Error('策略失败')
      );

      const result = await service.shouldIsolate();

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith('检查隔离需求失败', {
        tenantId: undefined,
        error: '策略失败',
      });

      // 恢复原始方法
      mockIsolationStrategy.shouldIsolate.mockReset();
    });
  });

  describe('私有方法测试', () => {
    describe('validateIsolationConfig', () => {
      it('应该验证隔离配置的完整性', async () => {
        await expect(service.onModuleInit()).resolves.not.toThrow();
      });

      it('应该在配置无效时抛出异常', async () => {
        const invalidConfig = {
          ...mockModuleOptions,
          isolation: {
            strategy: 'invalid-strategy' as unknown,
            enableIsolation: true,
            level: 'strict',
          },
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            TenantIsolationService,
            {
              provide: TenantContextService,
              useValue: mockTenantContextService,
            },
            {
              provide: PinoLogger,
              useValue: mockLogger,
            },
            {
              provide: DI_TOKENS.MODULE_OPTIONS,
              useValue: invalidConfig,
            },
          ],
        }).compile();

        const serviceWithInvalidConfig = module.get<TenantIsolationService>(
          TenantIsolationService
        );

        await expect(serviceWithInvalidConfig.onModuleInit()).rejects.toThrow(
          '不支持的隔离策略: invalid-strategy'
        );
      });
    });
  });
});
