/**
 * 租户提取中间件
 *
 * @description 处理HTTP层面的租户ID提取和基础验证，与@hl8/multi-tenancy模块集成
 *
 * ## 功能职责
 *
 * ### 🚀 **HTTP层处理**
 * - 租户ID提取：从请求头、查询参数等提取租户ID
 * - 基础验证：验证租户ID格式
 * - 请求上下文设置：将租户ID设置到请求对象
 *
 * ### 🔗 **集成设计**
 * - 与@hl8/multi-tenancy模块集成
 * - 专注于HTTP层面的租户处理
 * - 业务逻辑委托给Multi-Tenancy模块
 *
 * @since 1.0.0
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CoreFastifyMiddleware } from './core-fastify.middleware';
import { IFastifyMiddlewareConfig } from '../types/fastify.types';

/**
 * 租户提取中间件配置
 */
export interface ITenantExtractionConfig extends IFastifyMiddlewareConfig {
  /** 租户标识头名称 */
  tenantHeader?: string;

  /** 租户查询参数名称 */
  tenantQueryParam?: string;

  /** 是否启用基础验证 */
  enableBasicValidation?: boolean;
}

/**
 * 租户提取中间件
 *
 * @description 处理HTTP层面的租户ID提取和基础验证
 */
export class TenantExtractionMiddleware extends CoreFastifyMiddleware {
  public override readonly config: ITenantExtractionConfig;

  constructor(config: ITenantExtractionConfig) {
    super({
      priority: 1,
      enabled: true,
      path: '/api',
      ...config,
    });

    this.config = {
      tenantHeader: 'X-Tenant-ID',
      tenantQueryParam: 'tenant',
      enableBasicValidation: true,
      ...config,
    };
  }

  /**
   * 中间件函数
   *
   * @description 处理租户ID提取和基础验证
   */
  middleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void
  ): Promise<void> => {
    try {
      // 提取租户ID
      const tenantId = await this.extractTenantId(request);

      if (!tenantId) {
        reply.status(400).send({
          error: 'Tenant ID is required',
          code: 'TENANT_ID_REQUIRED',
        });
        return;
      }

      // 基础验证
      if (
        this.config.enableBasicValidation &&
        !this.isValidTenantIdFormat(tenantId)
      ) {
        reply.status(400).send({
          error: 'Invalid tenant ID format',
          code: 'INVALID_TENANT_FORMAT',
        });
        return;
      }

      // 设置租户ID到请求对象
      request.tenantId = tenantId;

      // 设置响应头
      reply.header('X-Tenant-ID', tenantId);

      done();
    } catch (error) {
      console.error('Tenant extraction middleware error:', error);
      reply.status(500).send({
        error: 'Tenant extraction failed',
        code: 'TENANT_EXTRACTION_ERROR',
      });
    }
  };

  /**
   * 提取租户ID
   *
   * @description 从请求中提取租户ID
   */
  private async extractTenantId(
    request: FastifyRequest
  ): Promise<string | null> {
    // 1. 从请求头获取
    const headerTenantId =
      request.headers[this.config.tenantHeader?.toLowerCase() || 'x-tenant-id'];
    if (headerTenantId && typeof headerTenantId === 'string') {
      return headerTenantId;
    }

    // 2. 从查询参数获取
    const query = request.query as Record<string, unknown>;
    const queryTenantId = query[this.config.tenantQueryParam || 'tenant'];
    if (queryTenantId && typeof queryTenantId === 'string') {
      return queryTenantId;
    }

    return null;
  }

  /**
   * 检查租户ID格式
   *
   * @description 验证租户ID的格式是否正确
   */
  private isValidTenantIdFormat(tenantId: string): boolean {
    // 租户ID应该是非空字符串，长度在3-50之间
    if (!tenantId || typeof tenantId !== 'string') return false;
    if (tenantId.length < 3 || tenantId.length > 50) return false;

    // 租户ID只能包含字母、数字、连字符和下划线
    const tenantIdRegex = /^[a-zA-Z0-9-_]+$/;
    return tenantIdRegex.test(tenantId);
  }

  /**
   * 获取中间件配置
   *
   * @description 获取当前中间件的配置信息
   */
  getConfig(): ITenantExtractionConfig {
    return { ...this.config };
  }
}

/**
 * 租户提取中间件工厂函数
 *
 * @description 创建租户提取中间件的便捷函数
 */
export function createTenantExtractionMiddleware(
  config: Partial<ITenantExtractionConfig> = {}
): TenantExtractionMiddleware {
  return new TenantExtractionMiddleware({
    name: 'tenant-extraction',
    priority: 1,
    enabled: true,
    path: '/api',
    ...config,
  });
}

/**
 * 默认租户提取配置
 *
 * @description 提供常用的租户提取配置预设
 */
export const DefaultTenantExtractionConfigs = {
  /** 开发环境配置 - 宽松验证 */
  development: {
    enableBasicValidation: false,
    tenantHeader: 'X-Tenant-ID',
    tenantQueryParam: 'tenant',
  },

  /** 生产环境配置 - 严格验证 */
  production: {
    enableBasicValidation: true,
    tenantHeader: 'X-Tenant-ID',
    tenantQueryParam: 'tenant',
  },

  /** API服务配置 */
  apiService: {
    enableBasicValidation: true,
    tenantHeader: 'X-Tenant-ID',
    tenantQueryParam: 'tenant',
  },
} as const;
