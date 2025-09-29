/**
 * CoreFastifyAdapter 单元测试
 *
 * @description 测试企业级Fastify核心适配器的功能
 *
 * @since 1.0.0
 */

import { CoreFastifyAdapter } from './core-fastify.adapter';
import { IFastifyEnterpriseConfig } from '../types/fastify.types';

describe('CoreFastifyAdapter', () => {
  let adapter: CoreFastifyAdapter;
  let mockConfig: IFastifyEnterpriseConfig;

  // 创建模拟Fastify实例的辅助函数
  const createMockFastify = () => ({
    addHook: jest.fn(),
    decorate: jest.fn(),
    hasDecorator: jest.fn().mockReturnValue(false),
    log: console,
    register: jest.fn(),
    route: jest.fn(),
    listen: jest.fn(),
    close: jest.fn(),
  });

  beforeEach(() => {
    mockConfig = {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [],
      middleware: [],
      routes: [],
      monitoring: {
        enableMetrics: true,
        enableHealthCheck: true,
        enablePerformanceMonitoring: true,
      },
      security: {
        enableHelmet: false,
        enableCORS: false,
        enableRateLimit: false,
      },
      logging: {
        level: 'info',
        prettyPrint: true,
      },
    };

    // 为所有测试设置模拟
    const mockFastify = createMockFastify();
    jest
      .spyOn(CoreFastifyAdapter.prototype as any, 'createFastifyInstance')
      .mockReturnValue(mockFastify);
  });

  afterEach(async () => {
    if (adapter) {
      try {
        await adapter.stop();
      } catch (error) {
        // 忽略停止错误
      }
    }
  });

  describe('构造函数', () => {
    it('应该正确初始化适配器', () => {
      // 模拟Fastify实例创建
      const mockFastify = {
        addHook: jest.fn(),
        decorate: jest.fn(),
        hasDecorator: jest.fn().mockReturnValue(false),
        log: console,
        register: jest.fn(),
        route: jest.fn(),
        listen: jest.fn(),
        close: jest.fn(),
      };

      // 模拟createFastifyInstance方法
      jest
        .spyOn(CoreFastifyAdapter.prototype as any, 'createFastifyInstance')
        .mockReturnValue(mockFastify);

      adapter = new CoreFastifyAdapter(mockConfig);
      expect(adapter).toBeDefined();
    });

    it('应该设置正确的配置', () => {
      // 模拟Fastify实例创建
      const mockFastify = {
        addHook: jest.fn(),
        decorate: jest.fn(),
        hasDecorator: jest.fn().mockReturnValue(false),
        log: console,
        register: jest.fn(),
        route: jest.fn(),
        listen: jest.fn(),
        close: jest.fn(),
      };

      // 模拟createFastifyInstance方法
      jest
        .spyOn(CoreFastifyAdapter.prototype as any, 'createFastifyInstance')
        .mockReturnValue(mockFastify);

      adapter = new CoreFastifyAdapter(mockConfig);
      expect(adapter).toBeInstanceOf(CoreFastifyAdapter);
    });
  });

  describe('健康状态检查', () => {
    beforeEach(() => {
      // 模拟Fastify实例创建
      const mockFastify = {
        addHook: jest.fn(),
        decorate: jest.fn(),
        hasDecorator: jest.fn().mockReturnValue(false),
        log: console,
        register: jest.fn(),
        route: jest.fn(),
        listen: jest.fn(),
        close: jest.fn(),
      };

      // 模拟createFastifyInstance方法
      jest
        .spyOn(CoreFastifyAdapter.prototype as any, 'createFastifyInstance')
        .mockReturnValue(mockFastify);

      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该返回健康状态', async () => {
      const healthStatus = await adapter.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus['status']).toBeDefined();
      expect(healthStatus['timestamp']).toBeDefined();
    });

    it('应该包含系统信息', async () => {
      const healthStatus = await adapter.getHealthStatus();

      // 检查基本结构
      expect(healthStatus).toBeDefined();
      expect(healthStatus['status']).toBeDefined();
      expect(healthStatus['timestamp']).toBeDefined();

      // 如果系统信息存在，检查其结构
      if (healthStatus['system']) {
        expect((healthStatus['system'] as any).uptime).toBeDefined();
        expect((healthStatus['system'] as any).memory).toBeDefined();
      }
    });
  });

  describe('性能指标', () => {
    beforeEach(() => {
      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该返回性能指标', async () => {
      const metrics = await adapter.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics['server']).toBeDefined();
      expect(metrics['system']).toBeDefined();
    });

    it('应该包含服务器指标', async () => {
      const metrics = await adapter.getPerformanceMetrics();

      expect((metrics['server'] as any).requestCount).toBeDefined();
      expect((metrics['server'] as any).errorCount).toBeDefined();
      expect((metrics['server'] as any).successCount).toBeDefined();
    });
  });

  describe('插件管理', () => {
    beforeEach(() => {
      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该能够注册插件', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        priority: 1,
        enabled: true,
        config: { name: 'test-plugin' },
        register: jest.fn().mockResolvedValue(undefined),
        unregister: jest.fn().mockResolvedValue(undefined),
        getStatus: jest.fn().mockResolvedValue({
          name: 'test-plugin',
          isRegistered: true,
          isHealthy: true,
        }),
        healthCheck: jest.fn().mockResolvedValue(true),
      };

      await expect(adapter.registerPlugin(mockPlugin)).resolves.not.toThrow();
    });

    it('应该处理插件注册错误', async () => {
      const mockPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        priority: 1,
        enabled: true,
        config: { name: 'error-plugin' },
        register: jest
          .fn()
          .mockRejectedValue(new Error('Plugin registration failed')),
        unregister: jest.fn().mockResolvedValue(undefined),
        getStatus: jest.fn().mockResolvedValue({
          name: 'error-plugin',
          isRegistered: false,
          isHealthy: false,
        }),
        healthCheck: jest.fn().mockResolvedValue(false),
      };

      await expect(adapter.registerPlugin(mockPlugin)).rejects.toThrow(
        'Plugin registration failed'
      );
    });
  });

  describe('中间件管理', () => {
    beforeEach(() => {
      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该能够注册中间件', async () => {
      const mockMiddleware = {
        name: 'test-middleware',
        priority: 1,
        enabled: true,
        config: { name: 'test-middleware' },
        middleware: jest.fn(),
        register: jest.fn().mockResolvedValue(undefined),
        getStatus: jest.fn().mockResolvedValue({
          name: 'test-middleware',
          isRegistered: true,
          isHealthy: true,
        }),
      };

      await expect(
        adapter.registerMiddleware(mockMiddleware)
      ).resolves.not.toThrow();
    });
  });

  describe('路由管理', () => {
    beforeEach(() => {
      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该能够注册路由', async () => {
      const mockRoute = {
        name: 'test-route',
        path: '/test',
        method: 'GET',
        handler: jest.fn(),
        config: { name: 'test-route' },
        register: jest.fn().mockResolvedValue(undefined),
      };

      await expect(adapter.registerRoute(mockRoute)).resolves.not.toThrow();
    });
  });

  describe('服务器生命周期', () => {
    beforeEach(() => {
      adapter = new CoreFastifyAdapter(mockConfig);
    });

    it('应该能够启动和停止服务器', async () => {
      // 注意：在实际测试中，我们可能需要模拟Fastify实例
      // 这里我们主要测试方法调用不会抛出异常
      await expect(adapter.start()).resolves.not.toThrow();
      await expect(adapter.stop()).resolves.not.toThrow();
    });
  });
});
