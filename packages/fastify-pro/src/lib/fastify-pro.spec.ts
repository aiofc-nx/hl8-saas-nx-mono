/**
 * Fastify-Pro 集成测试
 *
 * @description 测试Fastify-Pro库的核心功能
 *
 * @since 1.0.0
 */

import { EnterpriseFastifyAdapter } from './adapters/enterprise-fastify.adapter';
import { CorsPlugin } from './plugins/cors.plugin';
import { TenantExtractionMiddleware } from './middleware/tenant.middleware';
import { HealthCheckService } from './monitoring/health-check.service';

describe('Fastify-Pro', () => {
  describe('企业级适配器', () => {
    it('应该能够创建企业级适配器', () => {
      const adapter = new EnterpriseFastifyAdapter({
        logger: true,
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
        },
      });

      expect(adapter).toBeDefined();
    });

    it('应该支持基础配置', () => {
      const adapter = new EnterpriseFastifyAdapter({
        logger: true,
      });

      expect(adapter).toBeDefined();
    });
  });

  describe('CORS插件', () => {
    it('应该能够创建CORS插件', () => {
      const plugin = new CorsPlugin({
        name: 'cors',
        origin: true,
        credentials: true,
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('cors');
    });

    it('应该支持默认配置', () => {
      const plugin = new CorsPlugin({
        name: 'cors',
        origin: true,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('租户中间件', () => {
    it('应该能够创建租户中间件', () => {
      const middleware = new TenantExtractionMiddleware({
        name: 'tenant',
        tenantHeader: 'X-Tenant-ID',
        enableBasicValidation: true,
      });

      expect(middleware).toBeDefined();
      expect(middleware.name).toBe('tenant');
    });

    it('应该支持默认配置', () => {
      const middleware = new TenantExtractionMiddleware({
        name: 'tenant',
      });

      expect(middleware).toBeDefined();
    });
  });

  describe('健康检查服务', () => {
    it('应该能够创建健康检查服务', () => {
      const mockFastify = {
        server: {
          listening: true,
          address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
        },
      };

      const service = new HealthCheckService(mockFastify as any);
      expect(service).toBeDefined();
    });

    it('应该支持自定义配置', () => {
      const mockFastify = {
        server: {
          listening: true,
          address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
        },
      };

      const service = new HealthCheckService(mockFastify as any, {
        timeout: 5000,
        checkSystemResources: true,
      });

      expect(service).toBeDefined();
    });
  });

  describe('模块导出', () => {
    it('应该能够导入所有核心组件', () => {
      expect(EnterpriseFastifyAdapter).toBeDefined();
      expect(CorsPlugin).toBeDefined();
      expect(TenantExtractionMiddleware).toBeDefined();
      expect(HealthCheckService).toBeDefined();
    });
  });
});
