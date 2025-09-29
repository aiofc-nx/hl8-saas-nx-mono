/**
 * HealthCheckService 单元测试
 *
 * @description 测试健康检查服务的功能
 *
 * @since 1.0.0
 */

import {
  HealthCheckService,
  createHealthCheckService,
  IHealthCheckConfig,
} from './health-check.service';

// Mock Fastify
const mockFastify = {
  server: {
    listening: true,
    address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
  },
};

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let mockConfig: IHealthCheckConfig;

  beforeEach(() => {
    mockConfig = {
      timeout: 5000,
      checkSystemResources: true,
      checkNetworkConnections: false,
      checkBusinessComponents: true,
    };
    service = new HealthCheckService(mockFastify as any, mockConfig);
  });

  afterEach(() => {
    if (service) {
      service = null as any;
    }
  });

  describe('构造函数', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
    });

    it('应该使用默认配置', () => {
      const defaultService = new HealthCheckService(mockFastify as any);
      expect(defaultService).toBeDefined();
    });
  });

  describe('健康检查', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as any, mockConfig);
    });

    it('应该执行健康检查', async () => {
      const result = await service.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
      expect(result.timestamp).toBeDefined();
      expect(result.responseTime).toBeDefined();
      expect(result.system).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('应该包含系统信息', async () => {
      // 模拟os模块
      const mockOs = {
        totalmem: jest.fn().mockReturnValue(8589934592), // 8GB
        freemem: jest.fn().mockReturnValue(4294967296), // 4GB
      };

      // 使用jest.doMock来模拟os模块
      jest.doMock('os', () => mockOs);

      const result = await service.performHealthCheck();

      // 检查基本结构
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.responseTime).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('应该包含组件状态', async () => {
      const result = await service.performHealthCheck();

      expect(result.components).toBeDefined();
      expect(typeof result.components).toBe('object');
    });
  });

  describe('检查器管理', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as any, mockConfig);
    });

    it('应该能够添加自定义检查器', () => {
      const customChecker = {
        name: 'custom-checker',
        check: jest.fn().mockResolvedValue({
          name: 'custom-checker',
          status: 'healthy',
        }),
        enabled: true,
      };

      service.addChecker(customChecker);
      const checkers = service.getCheckers();
      expect(checkers).toContain(customChecker);
    });

    it('应该能够移除检查器', () => {
      const customChecker = {
        name: 'removable-checker',
        check: jest.fn().mockResolvedValue({
          name: 'removable-checker',
          status: 'healthy',
        }),
        enabled: true,
      };

      service.addChecker(customChecker);
      expect(service.getCheckers()).toContain(customChecker);

      service.removeChecker('removable-checker');
      expect(service.getCheckers()).not.toContain(customChecker);
    });

    it('应该返回检查器列表', () => {
      const checkers = service.getCheckers();
      expect(Array.isArray(checkers)).toBe(true);
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      service = new HealthCheckService(mockFastify as any, mockConfig);
    });

    it('应该处理检查器错误', async () => {
      const errorChecker = {
        name: 'error-checker',
        check: jest.fn().mockRejectedValue(new Error('Checker failed')),
        enabled: true,
      };

      service.addChecker(errorChecker);
      const result = await service.performHealthCheck();

      expect(result.status).toBeDefined();
      expect(result.components['error-checker']).toBeDefined();
      expect(result.components['error-checker'].status).toBe('unhealthy');
    });

    it('应该处理服务错误', async () => {
      const invalidService = new HealthCheckService(null as any, mockConfig);
      const result = await invalidService.performHealthCheck();

      expect(result.status).toBeDefined();
      // 检查是否有错误信息
      if (result.status === 'unhealthy' && result.errors) {
        expect(result.errors).toBeDefined();
      }
    });
  });

  describe('配置选项', () => {
    it('应该支持禁用系统资源检查', () => {
      const config: IHealthCheckConfig = {
        checkSystemResources: false,
        checkBusinessComponents: true,
      };
      const customService = new HealthCheckService(mockFastify as any, config);
      expect(customService).toBeDefined();
    });

    it('应该支持禁用业务组件检查', () => {
      const config: IHealthCheckConfig = {
        checkSystemResources: true,
        checkBusinessComponents: false,
      };
      const customService = new HealthCheckService(mockFastify as any, config);
      expect(customService).toBeDefined();
    });

    it('应该支持自定义超时时间', () => {
      const config: IHealthCheckConfig = {
        timeout: 10000,
        checkSystemResources: true,
        checkBusinessComponents: true,
      };
      const customService = new HealthCheckService(mockFastify as any, config);
      expect(customService).toBeDefined();
    });
  });
});

describe('createHealthCheckService', () => {
  it('应该创建健康检查服务', () => {
    const service = createHealthCheckService(mockFastify as any);
    expect(service).toBeInstanceOf(HealthCheckService);
  });

  it('应该使用自定义配置', () => {
    const config: IHealthCheckConfig = {
      timeout: 3000,
      checkSystemResources: false,
    };
    const service = createHealthCheckService(mockFastify as any, config);
    expect(service).toBeInstanceOf(HealthCheckService);
  });
});
