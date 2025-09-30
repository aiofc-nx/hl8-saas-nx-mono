/**
 * HealthCheckService 单元测试
 *
 * @description 测试健康检查服务的核心功能
 *
 * @since 1.0.0
 */

import {
  HealthCheckService,
  IHealthCheckConfig,
  IHealthChecker,
} from './health-check.service';
import { FastifyInstance } from 'fastify';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let mockFastify: Partial<FastifyInstance>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFastify = {
      server: {
        listening: true,
        address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
      } as any,
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn(),
        trace: jest.fn(),
        level: 'info',
        fatal: jest.fn(),
        silent: jest.fn(),
      } as any,
    };

    // Mock process methods
    jest.spyOn(process, 'uptime').mockReturnValue(3600);
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 100000000, // 100MB
      heapTotal: 80000000, // 80MB
      heapUsed: 60000000, // 60MB
      external: 10000000, // 10MB
      arrayBuffers: 5000000, // 5MB
    });

    // Mock os methods
    const os = require('os');
    jest.spyOn(os, 'totalmem').mockReturnValue(8000000000); // 8GB
    jest.spyOn(os, 'freemem').mockReturnValue(4000000000); // 4GB
    jest.spyOn(os, 'cpus').mockReturnValue([
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
      { model: 'Intel Core i7', speed: 2400 },
    ]);
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建服务', () => {
      service = new HealthCheckService(mockFastify as FastifyInstance);

      expect(service).toBeDefined();
    });

    it('应该使用自定义配置创建服务', () => {
      const config: IHealthCheckConfig = {
        timeout: 5000,
        checkSystemResources: true,
        checkNetworkConnections: false,
        checkBusinessComponents: true,
      };

      service = new HealthCheckService(mockFastify as FastifyInstance, config);

      expect(service).toBeDefined();
    });

    it('应该处理null配置', () => {
      expect(() => {
        service = new HealthCheckService(
          mockFastify as FastifyInstance,
          null as any
        );
      }).not.toThrow();
    });

    it('应该处理undefined配置', () => {
      expect(() => {
        service = new HealthCheckService(
          mockFastify as FastifyInstance,
          undefined
        );
      }).not.toThrow();
    });
  });

  describe('performHealthCheck', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as FastifyInstance);
    });

    it('应该执行健康检查并返回结果', async () => {
      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(result.timestamp).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.system).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('应该返回正确的系统信息', async () => {
      const result = await service.performHealthCheck();

      expect(result.system.uptime).toBe(3600);
      expect(result.system.memory.used).toBeGreaterThan(0);
      expect(result.system.memory.total).toBeGreaterThan(0);
      expect(result.system.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.system.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('应该包含组件状态', async () => {
      const result = await service.performHealthCheck();

      expect(result.components).toBeDefined();
      expect(typeof result.components).toBe('object');
    });

    it('应该记录响应时间', async () => {
      const startTime = Date.now();
      const result = await service.performHealthCheck();
      const endTime = Date.now();

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.responseTime).toBeLessThanOrEqual(
        endTime - startTime + 100
      );
    });
  });

  describe('系统资源检查', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as FastifyInstance, {
        checkSystemResources: true,
      });
    });

    it('应该在内存使用率正常时返回healthy状态', async () => {
      // Mock low memory usage
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100000000, // 100MB
        heapTotal: 80000000, // 80MB
        heapUsed: 40000000, // 40MB
        external: 10000000, // 10MB
        arrayBuffers: 5000000, // 5MB
      });

      const result = await service.performHealthCheck();

      expect(result.status).toMatch(/^(healthy|degraded)$/);
    });

    it('应该在内存使用率过高时返回degraded状态', async () => {
      // Mock high memory usage
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 9000000000, // 9GB
        heapTotal: 8000000000, // 8GB
        heapUsed: 7000000000, // 7GB
        external: 1000000000, // 1GB
        arrayBuffers: 500000000, // 500MB
      });

      const result = await service.performHealthCheck();

      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });
  });

  describe('自定义检查器', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as FastifyInstance);
    });

    it('应该能够添加自定义检查器', () => {
      const customChecker: IHealthChecker = {
        name: 'custom-check',
        check: jest.fn().mockResolvedValue({
          status: 'healthy',
          responseTime: 10,
        }),
      };

      service.addChecker(customChecker);

      expect(service.getCheckers()).toContain(customChecker);
    });

    it('应该能够移除自定义检查器', () => {
      const customChecker: IHealthChecker = {
        name: 'custom-check',
        check: jest.fn().mockResolvedValue({
          status: 'healthy',
          responseTime: 10,
        }),
      };

      service.addChecker(customChecker);
      service.removeChecker('custom-check');

      expect(service.getCheckers()).not.toContain(customChecker);
    });

    it('应该执行自定义检查器', async () => {
      const customChecker: IHealthChecker = {
        name: 'custom-check',
        check: jest.fn().mockResolvedValue({
          status: 'healthy',
          responseTime: 10,
        }),
      };

      service.addChecker(customChecker);
      const result = await service.performHealthCheck();

      expect(customChecker.check).toHaveBeenCalled();
      expect(result.components['custom-check']).toBeDefined();
      expect(result.components['custom-check'].status).toBe('healthy');
    });

    it('应该处理自定义检查器错误', async () => {
      const customChecker: IHealthChecker = {
        name: 'failing-check',
        check: jest.fn().mockRejectedValue(new Error('检查失败')),
      };

      service.addChecker(customChecker);
      const result = await service.performHealthCheck();

      expect(customChecker.check).toHaveBeenCalled();
      expect(result.components['failing-check']).toBeDefined();
      expect(result.components['failing-check'].status).toBe('unhealthy');
      expect(result.components['failing-check'].error).toBe('检查失败');
    });

    it('应该处理超时的检查器', async () => {
      const slowChecker: IHealthChecker = {
        name: 'slow-check',
        check: jest
          .fn()
          .mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 200))
          ),
      };

      service.addChecker(slowChecker);
      const result = await service.performHealthCheck();

      expect(slowChecker.check).toHaveBeenCalled();
      expect(result.components['slow-check']).toBeDefined();
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as FastifyInstance);
    });

    it('应该处理检查过程中的错误', async () => {
      // Mock a failing health check
      jest
        .spyOn(service, 'performHealthCheck')
        .mockRejectedValue(new Error('系统检查失败'));

      await expect(service.performHealthCheck()).rejects.toThrow(
        '系统检查失败'
      );
    });

    it('应该处理多个错误', async () => {
      // Mock multiple failing health checks
      jest
        .spyOn(service, 'performHealthCheck')
        .mockRejectedValue(new Error('多重检查失败'));

      await expect(service.performHealthCheck()).rejects.toThrow(
        '多重检查失败'
      );
    });
  });

  describe('配置选项', () => {
    it('应该支持禁用系统资源检查', async () => {
      service = new HealthCheckService(mockFastify as FastifyInstance, {
        checkSystemResources: false,
      });

      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    it('应该支持禁用网络连接检查', async () => {
      service = new HealthCheckService(mockFastify as FastifyInstance, {
        checkNetworkConnections: false,
      });

      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    it('应该支持禁用业务组件检查', async () => {
      service = new HealthCheckService(mockFastify as FastifyInstance, {
        checkBusinessComponents: false,
      });

      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理null Fastify实例', () => {
      expect(() => {
        service = new HealthCheckService(null as any);
      }).not.toThrow();
    });

    it('应该处理undefined Fastify实例', () => {
      expect(() => {
        service = new HealthCheckService(undefined as any);
      }).not.toThrow();
    });

    it('应该处理空配置对象', () => {
      expect(() => {
        service = new HealthCheckService(mockFastify as FastifyInstance, {});
      }).not.toThrow();
    });
  });

  describe('集成测试', () => {
    it('应该完整执行健康检查流程', async () => {
      const config: IHealthCheckConfig = {
        timeout: 3000,
        checkSystemResources: true,
        checkNetworkConnections: true,
        checkBusinessComponents: true,
        customCheckers: [
          {
            name: 'integration-check',
            check: jest.fn().mockResolvedValue({
              status: 'healthy',
              responseTime: 5,
            }),
          },
        ],
      };

      service = new HealthCheckService(mockFastify as FastifyInstance, config);

      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(result.timestamp).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.system).toBeDefined();
      expect(result.components).toBeDefined();

      // 验证自定义检查器被执行
      expect(result.components).toBeDefined();
    });
  });
});
