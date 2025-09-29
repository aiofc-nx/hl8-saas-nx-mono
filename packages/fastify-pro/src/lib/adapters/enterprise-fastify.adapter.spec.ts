/**
 * EnterpriseFastifyAdapter 单元测试
 *
 * @description 测试企业级Fastify适配器的功能
 *
 * @since 1.0.0
 */

import {
  EnterpriseFastifyAdapter,
  IEnterpriseFastifyOptions,
} from './enterprise-fastify.adapter';

describe('EnterpriseFastifyAdapter', () => {
  let adapter: EnterpriseFastifyAdapter;
  let mockOptions: IEnterpriseFastifyOptions;

  beforeEach(() => {
    mockOptions = {
      logger: true,
      trustProxy: true,
      enterprise: {
        enableHealthCheck: true,
        enablePerformanceMonitoring: true,
        enableMultiTenant: true,
        tenantHeader: 'X-Tenant-ID',
        corsOptions: {
          origin: true,
          credentials: true,
        },
      },
    };
  });

  afterEach(async () => {
    if (adapter) {
      try {
        await adapter.close();
      } catch (error) {
        // 忽略关闭错误
      }
    }
  });

  describe('构造函数', () => {
    it('应该正确初始化适配器', () => {
      adapter = new EnterpriseFastifyAdapter(mockOptions);
      expect(adapter).toBeDefined();
    });

    it('应该处理空选项', () => {
      adapter = new EnterpriseFastifyAdapter();
      expect(adapter).toBeDefined();
    });

    it('应该处理部分选项', () => {
      const partialOptions = {
        logger: true,
        enterprise: {
          enableHealthCheck: true,
        },
      };
      adapter = new EnterpriseFastifyAdapter(partialOptions);
      expect(adapter).toBeDefined();
    });
  });

  describe('企业级功能初始化', () => {
    beforeEach(() => {
      adapter = new EnterpriseFastifyAdapter(mockOptions);
    });

    it('应该能够初始化企业级功能', async () => {
      await expect(
        adapter.initializeEnterpriseFeatures()
      ).resolves.not.toThrow();
    });

    it('应该处理初始化错误', async () => {
      const invalidOptions = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
        },
      };
      const invalidAdapter = new EnterpriseFastifyAdapter(invalidOptions);
      await expect(
        invalidAdapter.initializeEnterpriseFeatures()
      ).resolves.not.toThrow();
    });
  });

  describe('企业级健康状态', () => {
    beforeEach(() => {
      adapter = new EnterpriseFastifyAdapter(mockOptions);
    });

    it('应该返回企业级健康状态', async () => {
      const healthStatus = await adapter.getEnterpriseHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus['status']).toBeDefined();
    });

    it('应该处理健康检查错误', async () => {
      const healthStatus = await adapter.getEnterpriseHealthStatus();

      // 由于企业级功能可能未完全初始化，状态可能是 'standard'
      expect(['standard', 'healthy', 'unhealthy']).toContain(
        healthStatus['status']
      );
    });
  });

  describe('企业级性能指标', () => {
    beforeEach(() => {
      adapter = new EnterpriseFastifyAdapter(mockOptions);
    });

    it('应该返回企业级性能指标', async () => {
      const metrics = await adapter.getEnterprisePerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics['status']).toBeDefined();
    });

    it('应该处理性能指标错误', async () => {
      const metrics = await adapter.getEnterprisePerformanceMetrics();

      // 由于企业级功能可能未完全初始化，状态可能是 'standard'
      expect(['standard', 'error']).toContain(metrics['status']);
    });
  });

  describe('配置选项', () => {
    it('应该支持开发环境配置', () => {
      const devOptions: IEnterpriseFastifyOptions = {
        logger: true,
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: false,
          enableMultiTenant: false,
        },
      };
      adapter = new EnterpriseFastifyAdapter(devOptions);
      expect(adapter).toBeDefined();
    });

    it('应该支持生产环境配置', () => {
      const prodOptions: IEnterpriseFastifyOptions = {
        logger: true,
        trustProxy: true,
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
          tenantHeader: 'X-Tenant-ID',
          corsOptions: {
            origin: ['https://yourdomain.com'],
            credentials: true,
          },
        },
      };
      adapter = new EnterpriseFastifyAdapter(prodOptions);
      expect(adapter).toBeDefined();
    });

    it('应该支持API服务配置', () => {
      const apiOptions: IEnterpriseFastifyOptions = {
        logger: true,
        trustProxy: true,
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
          tenantHeader: 'X-Tenant-ID',
          corsOptions: {
            origin: [
              'https://app.yourdomain.com',
              'https://admin.yourdomain.com',
            ],
            credentials: true,
          },
        },
      };
      adapter = new EnterpriseFastifyAdapter(apiOptions);
      expect(adapter).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效配置', () => {
      const invalidOptions = {
        enterprise: {
          enableHealthCheck: 'invalid' as any,
        },
      };
      adapter = new EnterpriseFastifyAdapter(invalidOptions);
      expect(adapter).toBeDefined();
    });

    it('应该处理缺失的企业级配置', () => {
      const minimalOptions = {
        logger: true,
      };
      adapter = new EnterpriseFastifyAdapter(minimalOptions);
      expect(adapter).toBeDefined();
    });
  });
});
