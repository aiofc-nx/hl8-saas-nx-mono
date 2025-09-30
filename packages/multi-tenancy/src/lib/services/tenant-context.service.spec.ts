/**
 * 租户上下文服务单元测试
 *
 * 测试租户上下文服务的核心功能和业务逻辑
 *
 * @fileoverview 租户上下文服务单元测试
 * @author HL8 Team
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { PinoLogger } from '@hl8/logger';
import { TenantContextService } from './tenant-context.service';
import {
  IMultiTenancyModuleOptions,
  MULTI_TENANCY_MODULE_OPTIONS,
  ITenantContext,
  ITenantContextConfig,
} from '../types/tenant-core.types';
import {
  TenantContextInvalidException,
  TenantConfigInvalidException,
} from '../exceptions';

/**
 * Mock ClsService
 *
 * 模拟nestjs-cls的ClsService
 */
class MockClsService {
  private store = new Map<string, unknown>();

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Mock PinoLogger
 *
 * 模拟PinoLogger
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

describe('TenantContextService', () => {
  let service: TenantContextService;
  let mockClsService: MockClsService;
  let mockLogger: MockPinoLogger;
  let mockModuleOptions: IMultiTenancyModuleOptions;

  /**
   * 默认配置选项
   */
  const defaultContextConfig: ITenantContextConfig = {
    enableAutoInjection: true,
    contextTimeout: 30000,
    enableAuditLog: true,
    contextStorage: 'memory',
    allowCrossTenantAccess: false,
  };

  /**
   * 默认租户上下文
   */
  const defaultContext: ITenantContext = {
    tenantId: 'tenant-123',
    userId: 'user-456',
    requestId: 'req-789-abc',
    sessionId: 'session-abc',
    timestamp: new Date(),
    metadata: {
      source: 'test',
      version: '1.0.0',
    },
  };

  beforeEach(async () => {
    // 创建Mock服务
    mockClsService = new MockClsService();
    mockLogger = new MockPinoLogger();

    // 创建默认配置选项
    mockModuleOptions = {
      context: defaultContextConfig,
      isolation: {
        strategy: 'key-prefix',
        keyPrefix: 'tenant:',
        namespace: 'tenant-namespace',
        enableIsolation: true,
        level: 'strict',
      },
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
      multiLevel: {
        enableMultiLevelIsolation: true,
        defaultIsolationLevel: 'tenant',
        keyPrefix: 'multi:',
        namespacePrefix: 'ml_',
        levels: {
          tenant: {
            strategy: 'key-prefix',
            keyPrefix: 'tenant:',
            enableIsolation: true,
          },
          organization: {
            strategy: 'key-prefix',
            keyPrefix: 'org:',
            enableIsolation: true,
          },
          department: {
            strategy: 'key-prefix',
            keyPrefix: 'dept:',
            enableIsolation: true,
          },
          user: {
            strategy: 'key-prefix',
            keyPrefix: 'user:',
            enableIsolation: true,
          },
        },
        enableHierarchyValidation: true,
        enablePermissionCheck: true,
      },
    };

    // 创建测试模块
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: MULTI_TENANCY_MODULE_OPTIONS,
          useValue: mockModuleOptions,
        },
      ],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    // 清理Mock服务状态
    mockClsService.clear();
    // 清理特定的 spy 函数，而不是所有 mock
    jest.restoreAllMocks();
  });

  describe('构造函数', () => {
    it('应该成功创建服务实例', () => {
      expect(service).toBeDefined();
    });

    it('应该在缺少context配置时抛出异常', () => {
      const invalidOptions = {
        isolation: mockModuleOptions.isolation,
        middleware: mockModuleOptions.middleware,
        security: mockModuleOptions.security,
        // 故意不包含 context 属性
      } as unknown as IMultiTenancyModuleOptions;

      expect(() => {
        new TenantContextService(
          mockClsService as any,
          invalidOptions,
          mockLogger as any
        );
      }).toThrow(TenantConfigInvalidException);
    });

    it('应该正确初始化logger上下文', () => {
      expect(mockLogger.setContext).toHaveBeenCalledWith({
        requestId: 'tenant-context-service',
      });
    });
  });

  describe('onModuleInit', () => {
    it('应该成功初始化模块', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('应该记录初始化日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.onModuleInit();

      expect(infoSpy).toHaveBeenCalledWith('租户上下文服务初始化开始');
      expect(infoSpy).toHaveBeenCalledWith('租户上下文服务初始化完成');
    });

    it('应该在启用审计日志时记录日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.onModuleInit();

      expect(infoSpy).toHaveBeenCalledWith('租户上下文审计日志已启用');
    });

    it('应该在初始化失败时抛出异常', async () => {
      // 模拟初始化失败
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalInfo = mockLogger.info;
      mockLogger.info = jest.fn().mockImplementation(() => {
        throw new Error('初始化失败');
      });

      await expect(service.onModuleInit()).rejects.toThrow('初始化失败');

      expect(errorSpy).toHaveBeenCalledWith('租户上下文服务初始化失败', {
        error: '初始化失败',
      });

      // 恢复原始方法
      mockLogger.info = originalInfo;
    });
  });

  describe('onModuleDestroy', () => {
    it('应该成功销毁模块', async () => {
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });

    it('应该记录销毁日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.onModuleDestroy();

      expect(infoSpy).toHaveBeenCalledWith('租户上下文服务销毁开始');
      expect(infoSpy).toHaveBeenCalledWith('租户上下文服务销毁完成');
    });

    it('应该在销毁失败时记录错误但不抛出异常', async () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalInfo = mockLogger.info;
      mockLogger.info = jest.fn().mockImplementation(() => {
        throw new Error('销毁失败');
      });

      await expect(service.onModuleDestroy()).resolves.not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith('租户上下文服务销毁失败', {
        error: '销毁失败',
      });

      // 恢复原始方法
      mockLogger.info = originalInfo;
    });
  });

  describe('setContext', () => {
    it('应该成功设置租户上下文', async () => {
      await expect(service.setContext(defaultContext)).resolves.not.toThrow();

      expect(mockClsService.get('tenantContext')).toEqual(defaultContext);
      expect(mockClsService.get('tenantId')).toBe(defaultContext.tenantId);
      expect(mockClsService.get('userId')).toBe(defaultContext.userId);
      expect(mockClsService.get('requestId')).toBe(defaultContext.requestId);
      expect(mockClsService.get('sessionId')).toBe(defaultContext.sessionId);
    });

    it('应该记录调试日志', async () => {
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.setContext(defaultContext);

      expect(debugSpy).toHaveBeenCalledWith('租户上下文已设置', {
        tenantId: defaultContext.tenantId,
        userId: defaultContext.userId,
        requestId: defaultContext.requestId,
      });
    });

    it('应该在启用审计日志时记录审计日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.setContext(defaultContext);

      expect(infoSpy).toHaveBeenCalledWith('租户上下文设置审计', {
        tenantId: defaultContext.tenantId,
        userId: defaultContext.userId,
        requestId: defaultContext.requestId,
        timestamp: defaultContext.timestamp,
      });
    });

    it('应该在上下文无效时抛出异常', async () => {
      const invalidContext = {
        ...defaultContext,
        tenantId: '', // 无效的租户ID
      };

      await expect(service.setContext(invalidContext)).rejects.toThrow();
    });

    it('应该在设置上下文失败时抛出异常', async () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalSet = mockClsService.set;
      mockClsService.set = jest.fn().mockImplementation(() => {
        throw new Error('设置失败');
      });

      await expect(service.setContext(defaultContext)).rejects.toThrow(
        '设置失败'
      );

      expect(errorSpy).toHaveBeenCalledWith('设置租户上下文失败', {
        context: defaultContext,
        error: '设置失败',
      });

      // 恢复原始方法
      mockClsService.set = originalSet;
    });
  });

  describe('getContext', () => {
    it('应该成功获取租户上下文', () => {
      mockClsService.set('tenantContext', defaultContext);

      const context = service.getContext();

      expect(context).toEqual(defaultContext);
    });

    it('应该在上下文不存在时返回null', () => {
      const context = service.getContext();

      expect(context).toBeNull();
    });

    it('应该在获取上下文失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const context = service.getContext();

      expect(context).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取租户上下文失败', {
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('getTenant', () => {
    it('应该成功获取租户ID', () => {
      mockClsService.set('tenantId', 'tenant-123');

      const tenantId = service.getTenant();

      expect(tenantId).toBe('tenant-123');
    });

    it('应该在租户ID不存在时返回null', () => {
      const tenantId = service.getTenant();

      expect(tenantId).toBeNull();
    });

    it('应该在获取租户ID失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const tenantId = service.getTenant();

      expect(tenantId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取租户ID失败', {
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('getUser', () => {
    it('应该成功获取用户ID', () => {
      mockClsService.set('userId', 'user-456');

      const userId = service.getUser();

      expect(userId).toBe('user-456');
    });

    it('应该在用户ID不存在时返回null', () => {
      const userId = service.getUser();

      expect(userId).toBeNull();
    });

    it('应该在获取用户ID失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const userId = service.getUser();

      expect(userId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取用户ID失败', {
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('getRequestId', () => {
    it('应该成功获取请求ID', () => {
      mockClsService.set('requestId', 'req-789-abc');

      const requestId = service.getRequestId();

      expect(requestId).toBe('req-789-abc');
    });

    it('应该在请求ID不存在时返回null', () => {
      const requestId = service.getRequestId();

      expect(requestId).toBeNull();
    });

    it('应该在获取请求ID失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const requestId = service.getRequestId();

      expect(requestId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取请求ID失败', {
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('getSessionId', () => {
    it('应该成功获取会话ID', () => {
      mockClsService.set('sessionId', 'session-abc');

      const sessionId = service.getSessionId();

      expect(sessionId).toBe('session-abc');
    });

    it('应该在会话ID不存在时返回null', () => {
      const sessionId = service.getSessionId();

      expect(sessionId).toBeNull();
    });

    it('应该在获取会话ID失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const sessionId = service.getSessionId();

      expect(sessionId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取会话ID失败', {
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('updateTenant', () => {
    it('应该成功更新租户ID', async () => {
      // 先设置初始上下文
      mockClsService.set('tenantContext', defaultContext);
      mockClsService.set('tenantId', defaultContext.tenantId);

      const newTenantId = 'new-tenant-456';

      await expect(service.updateTenant(newTenantId)).resolves.not.toThrow();

      expect(mockClsService.get('tenantId')).toBe(newTenantId);

      const updatedContext = mockClsService.get('tenantContext');
      expect((updatedContext as ITenantContext)?.tenantId).toBe(newTenantId);
    });

    it('应该记录调试日志', async () => {
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.updateTenant('new-tenant-456');

      expect(debugSpy).toHaveBeenCalledWith('租户ID已更新', {
        tenantId: 'new-tenant-456',
      });
    });

    it('应该在启用审计日志时记录审计日志', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await service.updateTenant('new-tenant-456');

      expect(infoSpy).toHaveBeenCalledWith('租户ID更新审计', {
        tenantId: 'new-tenant-456',
      });
    });

    it('应该在租户ID无效时抛出异常', async () => {
      // 直接测试 validateTenantId 方法（通过反射访问私有方法）
      const validateTenantId = (service as any).validateTenantId.bind(service);

      expect(() => validateTenantId('')).toThrow(TenantContextInvalidException);
      expect(() => validateTenantId('invalid@tenant')).toThrow(
        TenantContextInvalidException
      );
      expect(() => validateTenantId('ab')).toThrow(
        TenantContextInvalidException
      );
      expect(() => validateTenantId('a'.repeat(65))).toThrow(
        TenantContextInvalidException
      );
    });

    it('应该在租户ID格式无效时抛出异常', async () => {
      // 禁用审计日志以避免干扰异常处理
      mockModuleOptions.context.enableAuditLog = false;

      try {
        await service.updateTenant('invalid@tenant');
        expect(true).toBe(false); // 如果到达这里说明没有抛出异常
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextInvalidException);
      }
    });

    it('应该在租户ID长度无效时抛出异常', async () => {
      // 禁用审计日志以避免干扰异常处理
      mockModuleOptions.context.enableAuditLog = false;

      try {
        await service.updateTenant('ab');
        expect(true).toBe(false); // 如果到达这里说明没有抛出异常
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextInvalidException);
      }

      try {
        await service.updateTenant('a'.repeat(65));
        expect(true).toBe(false); // 如果到达这里说明没有抛出异常
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextInvalidException);
      }
    });
  });

  describe('updateUser', () => {
    it('应该成功更新用户ID', async () => {
      // 先设置初始上下文
      mockClsService.set('tenantContext', defaultContext);
      mockClsService.set('userId', defaultContext.userId);

      const newUserId = 'new-user-789';

      await expect(service.updateUser(newUserId)).resolves.not.toThrow();

      expect(mockClsService.get('userId')).toBe(newUserId);

      const updatedContext = mockClsService.get('tenantContext');
      expect((updatedContext as ITenantContext)?.userId).toBe(newUserId);
    });

    it('应该记录调试日志', async () => {
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.updateUser('new-user-789');

      expect(debugSpy).toHaveBeenCalledWith('用户ID已更新', {
        userId: 'new-user-789',
      });
    });

    it('应该在启用审计日志时记录审计日志', async () => {
      // 为这个测试创建独立的 logger 和服务实例
      const auditLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };

      const auditOptions = {
        ...mockModuleOptions,
        context: {
          ...mockModuleOptions.context,
          enableAuditLog: true,
        },
      };

      const auditService = new TenantContextService(
        mockClsService as any,
        auditOptions as any,
        auditLogger as any
      );

      await auditService.updateUser('new-user-789');

      expect(auditLogger.info).toHaveBeenCalledWith('用户ID更新审计', {
        userId: 'new-user-789',
      });
    });

    it('应该在用户ID无效时抛出异常', async () => {
      await expect(service.updateUser('')).rejects.toThrow();
    });

    it('应该在用户ID格式无效时抛出异常', async () => {
      await expect(service.updateUser('invalid@user')).rejects.toThrow();
    });

    it('应该在用户ID长度无效时抛出异常', async () => {
      await expect(service.updateUser('ab')).rejects.toThrow();
      await expect(service.updateUser('a'.repeat(65))).rejects.toThrow();
    });
  });

  describe('setCustomContext', () => {
    it('应该成功设置自定义上下文', async () => {
      const key = 'feature-flag';
      const value = 'enabled';

      // 先设置初始上下文，这样 metadata 才能被更新
      mockClsService.set('tenantContext', defaultContext);

      await expect(service.setCustomContext(key, value)).resolves.not.toThrow();

      expect(mockClsService.get(`custom:${key}`)).toBe(value);

      const context = mockClsService.get('tenantContext');
      expect((context as ITenantContext)?.metadata?.[key]).toBe(value);
    });

    it('应该记录调试日志', async () => {
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.setCustomContext('feature-flag', 'enabled');

      expect(debugSpy).toHaveBeenCalledWith('自定义上下文已设置', {
        key: 'feature-flag',
        value: 'enabled',
      });
    });

    it('应该在启用审计日志时记录审计日志', async () => {
      // 为这个测试创建独立的 logger 和服务实例
      const auditLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };

      const auditOptions = {
        ...mockModuleOptions,
        context: {
          ...mockModuleOptions.context,
          enableAuditLog: true,
        },
      };

      const auditService = new TenantContextService(
        mockClsService as any,
        auditOptions as any,
        auditLogger as any
      );

      await auditService.setCustomContext('feature-flag', 'enabled');

      expect(auditLogger.info).toHaveBeenCalledWith('自定义上下文设置审计', {
        key: 'feature-flag',
        value: 'enabled',
      });
    });

    it('应该在上下文键无效时抛出异常', async () => {
      await expect(service.setCustomContext('', 'value')).rejects.toThrow();
    });

    it('应该在上下文键格式无效时抛出异常', async () => {
      await expect(
        service.setCustomContext('invalid@key', 'value')
      ).rejects.toThrow();
    });

    it('应该在上下文键长度无效时抛出异常', async () => {
      await expect(
        service.setCustomContext('a'.repeat(65), 'value')
      ).rejects.toThrow();
    });
  });

  describe('getCustomContext', () => {
    it('应该成功获取自定义上下文', () => {
      const key = 'feature-flag';
      const value = 'enabled';
      mockClsService.set(`custom:${key}`, value);

      const result = service.getCustomContext(key);

      expect(result).toBe(value);
    });

    it('应该支持泛型类型', () => {
      const key = 'count';
      const value = 42;
      mockClsService.set(`custom:${key}`, value);

      const result = service.getCustomContext<number>(key);

      expect(result).toBe(value);
      expect(typeof result).toBe('number');
    });

    it('应该在上下文不存在时返回null', () => {
      const result = service.getCustomContext('non-existent');

      expect(result).toBeNull();
    });

    it('应该在获取上下文失败时返回null', () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalGet = mockClsService.get;
      mockClsService.get = jest.fn().mockImplementation(() => {
        throw new Error('获取失败');
      });

      const result = service.getCustomContext('key');

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('获取自定义上下文失败', {
        key: 'key',
        error: '获取失败',
      });

      // 恢复原始方法
      mockClsService.get = originalGet;
    });
  });

  describe('clearContext', () => {
    it('应该成功清除上下文', async () => {
      // 先设置一些上下文
      mockClsService.set('tenantContext', defaultContext);
      mockClsService.set('tenantId', defaultContext.tenantId);

      await expect(service.clearContext()).resolves.not.toThrow();

      // 验证上下文已清除
      expect(mockClsService.get('tenantContext')).toBeUndefined();
      expect(mockClsService.get('tenantId')).toBeUndefined();
    });

    it('应该记录调试日志', async () => {
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      await service.clearContext();

      expect(debugSpy).toHaveBeenCalledWith('租户上下文已清除');
    });

    it('应该在启用审计日志时记录审计日志', async () => {
      // 为这个测试创建独立的 logger 和服务实例
      const auditLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };

      const auditOptions = {
        ...mockModuleOptions,
        context: {
          ...mockModuleOptions.context,
          enableAuditLog: true,
        },
      };

      const auditService = new TenantContextService(
        mockClsService as any,
        auditOptions as any,
        auditLogger as any
      );

      await auditService.clearContext();

      expect(auditLogger.info).toHaveBeenCalledWith('租户上下文清除审计');
    });

    it('应该在清除上下文失败时抛出异常', async () => {
      const errorSpy = jest.spyOn(mockLogger, 'error');
      const originalClear = mockClsService.clear;
      mockClsService.clear = jest.fn().mockImplementation(() => {
        throw new Error('清除失败');
      });

      await expect(service.clearContext()).rejects.toThrow('清除失败');

      expect(errorSpy).toHaveBeenCalledWith('清除租户上下文失败', {
        error: '清除失败',
      });

      // 恢复原始方法
      mockClsService.clear = originalClear;
    });
  });

  describe('私有方法测试', () => {
    describe('validateContext', () => {
      it('应该在上下文为空时抛出异常', async () => {
        await expect(
          service.setContext(null as unknown as ITenantContext)
        ).rejects.toThrow('租户上下文不能为空');
      });

      it('应该在租户ID为空时抛出异常', async () => {
        const invalidContext = {
          ...defaultContext,
          tenantId: '',
        };

        await expect(service.setContext(invalidContext)).rejects.toThrow(
          '租户ID不能为空'
        );
      });

      it('应该在时间戳为空时抛出异常', async () => {
        const invalidContext = {
          ...defaultContext,
          timestamp: undefined as unknown,
        };

        await expect(
          service.setContext(invalidContext as ITenantContext)
        ).rejects.toThrow('上下文时间戳不能为空');
      });
    });

    describe('validateTenantId', () => {
      it('应该验证租户ID格式', async () => {
        const testCases = [
          { tenantId: '', expected: 'not a string or empty' },
          {
            tenantId: 'ab',
            expected: 'length must be between 3 and 64 characters',
          },
          {
            tenantId: 'a'.repeat(65),
            expected: 'length must be between 3 and 64 characters',
          },
          {
            tenantId: 'invalid@tenant',
            expected:
              'can only contain letters, numbers, hyphens, and underscores',
          },
        ];

        for (const testCase of testCases) {
          try {
            await service.updateTenant(testCase.tenantId);
            expect(true).toBe(false); // 如果到达这里，说明没有抛出异常
          } catch (error) {
            expect(error).toBeInstanceOf(TenantContextInvalidException);
          }
        }
      });

      it('应该接受有效的租户ID', async () => {
        const validTenantIds = [
          'tenant-123',
          'tenant_456',
          'Tenant789',
          'tenant123',
          't-123',
          'a'.repeat(64),
        ];

        for (const tenantId of validTenantIds) {
          await expect(service.updateTenant(tenantId)).resolves.not.toThrow();
        }
      });
    });
  });
});
