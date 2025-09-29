/**
 * Fastify类型定义测试
 *
 * @description 测试Fastify类型定义的正确性
 *
 * @since 1.0.0
 */

import {
  IFastifyAdapter,
  IFastifyPlugin,
  IFastifyMiddleware,
  IFastifyRoute,
  IFastifyPluginConfig,
  IFastifyMiddlewareConfig,
  IFastifyRouteConfig,
  IFastifyPluginStatus,
  IFastifyMiddlewareStatus,
  IFastifyServerConfig,
  IFastifyEnterpriseConfig,
} from './fastify.types';

describe('Fastify类型定义', () => {
  describe('IFastifyAdapter', () => {
    it('应该定义正确的接口', () => {
      const adapter: IFastifyAdapter = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        getHealthStatus: jest.fn().mockResolvedValue({}),
        getPerformanceMetrics: jest.fn().mockResolvedValue({}),
        registerPlugin: jest.fn().mockResolvedValue(undefined),
        registerMiddleware: jest.fn().mockResolvedValue(undefined),
        registerRoute: jest.fn().mockResolvedValue(undefined),
      };

      expect(adapter).toBeDefined();
      expect(typeof adapter.start).toBe('function');
      expect(typeof adapter.stop).toBe('function');
      expect(typeof adapter.getHealthStatus).toBe('function');
      expect(typeof adapter.getPerformanceMetrics).toBe('function');
      expect(typeof adapter.registerPlugin).toBe('function');
      expect(typeof adapter.registerMiddleware).toBe('function');
      expect(typeof adapter.registerRoute).toBe('function');
    });
  });

  describe('IFastifyPlugin', () => {
    it('应该定义正确的接口', () => {
      const plugin: IFastifyPlugin = {
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

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.priority).toBe(1);
      expect(plugin.enabled).toBe(true);
      expect(typeof plugin.register).toBe('function');
      expect(typeof plugin.unregister).toBe('function');
      expect(typeof plugin.getStatus).toBe('function');
      expect(typeof plugin.healthCheck).toBe('function');
    });
  });

  describe('IFastifyMiddleware', () => {
    it('应该定义正确的接口', () => {
      const middleware: IFastifyMiddleware = {
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

      expect(middleware).toBeDefined();
      expect(middleware.name).toBe('test-middleware');
      expect(middleware.priority).toBe(1);
      expect(middleware.enabled).toBe(true);
      expect(typeof middleware.middleware).toBe('function');
      expect(typeof middleware.register).toBe('function');
      expect(typeof middleware.getStatus).toBe('function');
    });
  });

  describe('IFastifyRoute', () => {
    it('应该定义正确的接口', () => {
      const route: IFastifyRoute = {
        name: 'test-route',
        path: '/test',
        method: 'GET',
        handler: jest.fn(),
        config: { name: 'test-route' },
        register: jest.fn().mockResolvedValue(undefined),
      };

      expect(route).toBeDefined();
      expect(route.name).toBe('test-route');
      expect(route.path).toBe('/test');
      expect(route.method).toBe('GET');
      expect(typeof route.handler).toBe('function');
      expect(typeof route.register).toBe('function');
    });
  });

  describe('配置接口', () => {
    it('IFastifyPluginConfig应该正确定义', () => {
      const config: IFastifyPluginConfig = {
        name: 'test-plugin',
        options: { version: '1.0.0' },
        priority: 1,
        enabled: true,
        dependencies: ['other-plugin'],
        description: 'Test plugin',
      };

      expect(config).toBeDefined();
      expect(config.name).toBe('test-plugin');
      expect(config.options).toBeDefined();
      expect(config.priority).toBe(1);
      expect(config.enabled).toBe(true);
      expect(config.dependencies).toBeDefined();
      expect(config.description).toBe('Test plugin');
    });

    it('IFastifyMiddlewareConfig应该正确定义', () => {
      const config: IFastifyMiddlewareConfig = {
        name: 'test-middleware',
        priority: 1,
        enabled: true,
        path: '/api',
        method: 'GET',
        options: { timeout: 5000 },
        description: 'Test middleware',
      };

      expect(config).toBeDefined();
      expect(config.name).toBe('test-middleware');
      expect(config.priority).toBe(1);
      expect(config.enabled).toBe(true);
      expect(config.path).toBe('/api');
      expect(config.method).toBe('GET');
      expect(config.options).toBeDefined();
      expect(config.description).toBe('Test middleware');
    });

    it('IFastifyRouteConfig应该正确定义', () => {
      const config: IFastifyRouteConfig = {
        name: 'test-route',
        description: 'Test route',
        tags: ['api', 'test'],
        options: { timeout: 5000 },
        prefix: '/api',
        version: '1.0',
      };

      expect(config).toBeDefined();
      expect(config.name).toBe('test-route');
      expect(config.description).toBe('Test route');
      expect(config.tags).toBeDefined();
      expect(config.options).toBeDefined();
      expect(config.prefix).toBe('/api');
      expect(config.version).toBe('1.0');
    });
  });

  describe('状态接口', () => {
    it('IFastifyPluginStatus应该正确定义', () => {
      const status: IFastifyPluginStatus = {
        name: 'test-plugin',
        isRegistered: true,
        registerTime: new Date(),
        unregisterTime: undefined,
        isHealthy: true,
        error: undefined,
        metrics: { successRate: 100 },
      };

      expect(status).toBeDefined();
      expect(status.name).toBe('test-plugin');
      expect(status.isRegistered).toBe(true);
      expect(status.registerTime).toBeDefined();
      expect(status.isHealthy).toBe(true);
      expect(status.metrics).toBeDefined();
    });

    it('IFastifyMiddlewareStatus应该正确定义', () => {
      const status: IFastifyMiddlewareStatus = {
        name: 'test-middleware',
        isRegistered: true,
        registerTime: new Date(),
        isHealthy: true,
        error: undefined,
        metrics: { successRate: 100, averageTime: 10 },
      };

      expect(status).toBeDefined();
      expect(status.name).toBe('test-middleware');
      expect(status.isRegistered).toBe(true);
      expect(status.registerTime).toBeDefined();
      expect(status.isHealthy).toBe(true);
      expect(status.metrics).toBeDefined();
    });
  });

  describe('服务器配置', () => {
    it('IFastifyServerConfig应该正确定义', () => {
      const config: IFastifyServerConfig = {
        port: 3000,
        host: '0.0.0.0',
        https: {
          key: 'private-key',
          cert: 'certificate',
        },
        keepAliveTimeout: 5000,
        headersTimeout: 60000,
        bodyLimit: 1048576,
      };

      expect(config).toBeDefined();
      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.https).toBeDefined();
      expect(config.keepAliveTimeout).toBe(5000);
      expect(config.headersTimeout).toBe(60000);
      expect(config.bodyLimit).toBe(1048576);
    });
  });

  describe('企业级配置', () => {
    it('IFastifyEnterpriseConfig应该正确定义', () => {
      const config: IFastifyEnterpriseConfig = {
        server: {
          port: 3000,
          host: '0.0.0.0',
        },
        plugins: [
          {
            name: 'cors',
            enabled: true,
            priority: 1,
            options: { origin: true },
          },
        ],
        middleware: [
          {
            name: 'tenant',
            enabled: true,
            priority: 1,
            options: { tenantHeader: 'X-Tenant-ID' },
          },
        ],
        routes: [
          {
            name: 'health',
          },
        ],
        monitoring: {
          enableMetrics: true,
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          metricsInterval: 60000,
        },
        security: {
          enableHelmet: true,
          enableCORS: true,
          enableRateLimit: true,
          rateLimitOptions: { max: 100 },
        },
        logging: {
          level: 'info',
          prettyPrint: true,
          redact: ['password', 'token'],
        },
        multiTenant: {
          enabled: true,
          tenantHeader: 'X-Tenant-ID',
          tenantQueryParam: 'tenant',
        },
      };

      expect(config).toBeDefined();
      expect(config.server).toBeDefined();
      expect(config.plugins).toBeDefined();
      expect(config.middleware).toBeDefined();
      expect(config.routes).toBeDefined();
      expect(config.monitoring).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.multiTenant).toBeDefined();
    });
  });
});
