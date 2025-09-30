/**
 * TenantExtractionMiddleware 单元测试
 *
 * @description 测试租户提取中间件的核心功能
 *
 * @since 1.0.0
 */

import {
  TenantExtractionMiddleware,
  ITenantExtractionConfig,
} from './tenant.middleware';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock CoreFastifyMiddleware
jest.mock('./core-fastify.middleware', () => {
  return {
    CoreFastifyMiddleware: jest.fn().mockImplementation(() => ({
      config: {},
      middleware: jest.fn(),
    })),
  };
});

describe('TenantExtractionMiddleware', () => {
  let middleware: TenantExtractionMiddleware;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockDone: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      query: {},
      url: '/api/test',
      method: 'GET',
    };

    mockReply = {
      header: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockDone = jest.fn();
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建中间件', () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
      };

      middleware = new TenantExtractionMiddleware(config);

      expect(middleware).toBeDefined();
      expect(middleware.config.name).toBe('tenant');
      expect(middleware.config.tenantHeader).toBe('X-Tenant-ID');
      expect(middleware.config.tenantQueryParam).toBe('tenant');
      expect(middleware.config.enableBasicValidation).toBe(true);
    });

    it('应该使用自定义配置创建中间件', () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantHeader: 'X-Custom-Tenant-ID',
        tenantQueryParam: 'custom-tenant',
        enableBasicValidation: false,
      };

      middleware = new TenantExtractionMiddleware(config);

      expect(middleware).toBeDefined();
      expect(middleware.config.tenantHeader).toBe('X-Custom-Tenant-ID');
      expect(middleware.config.tenantQueryParam).toBe('custom-tenant');
      expect(middleware.config.enableBasicValidation).toBe(false);
    });

    it('应该合并基础配置', () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        priority: 2,
        enabled: true,
        path: '/api',
      };

      middleware = new TenantExtractionMiddleware(config);

      expect(middleware).toBeDefined();
      expect(middleware.config.priority).toBe(2);
      expect(middleware.config.enabled).toBe(true);
      expect(middleware.config.path).toBe('/api');
    });
  });

  describe('extractTenantId', () => {
    beforeEach(() => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantHeader: 'X-Tenant-ID',
        tenantQueryParam: 'tenant',
      };

      middleware = new TenantExtractionMiddleware(config);
    });

    it('应该从请求头提取租户ID', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'tenant-123',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-123');
    });

    it('应该从查询参数提取租户ID', async () => {
      mockRequest.query = {
        tenant: 'tenant-456',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-456');
    });

    it('应该优先使用请求头的租户ID', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'tenant-123',
      };
      mockRequest.query = {
        tenant: 'tenant-456',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-123');
    });

    it('应该在找不到租户ID时返回null', async () => {
      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBeNull();
    });

    it('应该处理大小写不敏感的请求头', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'tenant-789',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-789');
    });

    it('应该处理自定义租户头名称', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantHeader: 'X-Custom-Tenant-ID',
      };

      middleware = new TenantExtractionMiddleware(config);

      mockRequest.headers = {
        'x-custom-tenant-id': 'tenant-custom',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-custom');
    });

    it('应该处理自定义查询参数名称', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantQueryParam: 'custom-tenant',
      };

      middleware = new TenantExtractionMiddleware(config);

      mockRequest.query = {
        'custom-tenant': 'tenant-query',
      };

      const tenantId = await (middleware as any).extractTenantId(mockRequest);

      expect(tenantId).toBe('tenant-query');
    });
  });

  describe('isValidTenantIdFormat', () => {
    beforeEach(() => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
      };

      middleware = new TenantExtractionMiddleware(config);
    });

    it('应该验证有效的租户ID格式', () => {
      const validTenantIds = [
        'tenant-123',
        'tenant_456',
        'tenant789',
        't123',
        'a'.repeat(50), // 最大长度
      ];

      validTenantIds.forEach((tenantId) => {
        expect((middleware as any).isValidTenantIdFormat(tenantId)).toBe(true);
      });
    });

    it('应该拒绝无效的租户ID格式', () => {
      const invalidTenantIds = [
        '', // 空字符串
        'a'.repeat(51), // 超过最大长度
        'tenant@123', // 包含特殊字符
        'tenant#123',
        'tenant$123',
        'tenant%123',
        'tenant^123',
        'tenant&123',
        'tenant*123',
        'tenant+123',
        'tenant=123',
        'tenant|123',
        'tenant\\123',
        'tenant"123',
        "tenant'123",
        'tenant<123',
        'tenant>123',
        'tenant,123',
        'tenant;123',
        'tenant:123',
        'tenant?123',
        'tenant/123',
        'tenant 123', // 包含空格
        'tenant\t123', // 包含制表符
        'tenant\n123', // 包含换行符
        'tenant\r123', // 包含回车符
        'ab', // 太短
      ];

      invalidTenantIds.forEach((tenantId) => {
        expect((middleware as any).isValidTenantIdFormat(tenantId)).toBe(false);
      });
    });

    it('应该处理null和undefined', () => {
      expect((middleware as any).isValidTenantIdFormat(null)).toBe(false);
      expect((middleware as any).isValidTenantIdFormat(undefined)).toBe(false);
    });
  });

  describe('middleware', () => {
    beforeEach(() => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        enableBasicValidation: true,
      };

      middleware = new TenantExtractionMiddleware(config);
    });

    it('应该成功处理有效的租户ID', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'tenant-123',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect((mockRequest as any).tenantId).toBe('tenant-123');
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Tenant-ID',
        'tenant-123'
      );
      expect(mockDone).toHaveBeenCalled();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('应该在缺少租户ID时返回400错误', async () => {
      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant ID is required',
        code: 'TENANT_ID_REQUIRED',
      });
      expect(mockDone).not.toHaveBeenCalled();
    });

    it('应该在租户ID格式无效时返回400错误', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'invalid@tenant',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid tenant ID format',
        code: 'INVALID_TENANT_FORMAT',
      });
      expect(mockDone).not.toHaveBeenCalled();
    });

    it('应该在禁用验证时跳过格式检查', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        enableBasicValidation: false,
      };

      middleware = new TenantExtractionMiddleware(config);

      mockRequest.headers = {
        'x-tenant-id': 'invalid@tenant',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect((mockRequest as any).tenantId).toBe('invalid@tenant');
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Tenant-ID',
        'invalid@tenant'
      );
      expect(mockDone).toHaveBeenCalled();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('应该处理提取租户ID时的错误', async () => {
      // Mock extractTenantId to throw error
      jest
        .spyOn(middleware as any, 'extractTenantId')
        .mockRejectedValue(new Error('提取失败'));

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant extraction failed',
        code: 'TENANT_EXTRACTION_ERROR',
      });
      expect(mockDone).not.toHaveBeenCalled();
    });

    it('应该处理验证租户ID格式时的错误', async () => {
      mockRequest.headers = {
        'x-tenant-id': 'tenant-123',
      };

      // Mock isValidTenantIdFormat to throw error
      jest
        .spyOn(middleware as any, 'isValidTenantIdFormat')
        .mockImplementation(() => {
          throw new Error('验证失败');
        });

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant extraction failed',
        code: 'TENANT_EXTRACTION_ERROR',
      });
      expect(mockDone).not.toHaveBeenCalled();
    });
  });

  describe('集成测试', () => {
    it('应该完整处理租户提取流程', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantHeader: 'X-Tenant-ID',
        tenantQueryParam: 'tenant',
        enableBasicValidation: true,
      };

      middleware = new TenantExtractionMiddleware(config);

      // 测试请求头提取
      mockRequest.headers = {
        'x-tenant-id': 'tenant-123',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect((mockRequest as any).tenantId).toBe('tenant-123');
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Tenant-ID',
        'tenant-123'
      );
      expect(mockDone).toHaveBeenCalled();

      // 重置mock
      jest.clearAllMocks();
      mockDone = jest.fn();

      // 测试查询参数提取
      mockRequest.headers = {};
      mockRequest.query = {
        tenant: 'tenant-456',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect((mockRequest as any).tenantId).toBe('tenant-456');
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Tenant-ID',
        'tenant-456'
      );
      expect(mockDone).toHaveBeenCalled();
    });

    it('应该处理复杂场景', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        tenantHeader: 'X-Custom-Tenant-ID',
        tenantQueryParam: 'custom-tenant',
        enableBasicValidation: true,
      };

      middleware = new TenantExtractionMiddleware(config);

      // 同时提供请求头和查询参数，应该优先使用请求头
      mockRequest.headers = {
        'x-custom-tenant-id': 'header-tenant',
      };
      mockRequest.query = {
        'custom-tenant': 'query-tenant',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect((mockRequest as any).tenantId).toBe('header-tenant');
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Tenant-ID',
        'header-tenant'
      );
      expect(mockDone).toHaveBeenCalled();
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空字符串租户ID', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
        enableBasicValidation: true,
      };

      middleware = new TenantExtractionMiddleware(config);

      mockRequest.headers = {
        'x-tenant-id': '',
      };

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant ID is required',
        code: 'TENANT_ID_REQUIRED',
      });
    });

    it('应该处理null租户ID', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
      };

      middleware = new TenantExtractionMiddleware(config);

      // Mock extractTenantId to return null
      jest.spyOn(middleware as any, 'extractTenantId').mockResolvedValue(null);

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant ID is required',
        code: 'TENANT_ID_REQUIRED',
      });
    });

    it('应该处理undefined租户ID', async () => {
      const config: ITenantExtractionConfig = {
        name: 'tenant',
      };

      middleware = new TenantExtractionMiddleware(config);

      // Mock extractTenantId to return undefined
      jest
        .spyOn(middleware as any, 'extractTenantId')
        .mockResolvedValue(undefined);

      await middleware.middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        mockDone
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Tenant ID is required',
        code: 'TENANT_ID_REQUIRED',
      });
    });
  });
});
