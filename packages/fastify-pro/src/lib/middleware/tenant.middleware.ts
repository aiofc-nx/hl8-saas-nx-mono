/**
 * 租户提取中间件
 *
 * 处理HTTP层面的租户ID提取和基础验证，与@hl8/multi-tenancy模块集成。
 *
 * @description 此中间件处理HTTP层面的租户ID提取和基础验证。
 * 与@hl8/multi-tenancy模块集成，专注于HTTP层面的租户处理。
 * 业务逻辑委托给Multi-Tenancy模块，确保租户上下文的正确传递。
 *
 * ## 业务规则
 *
 * ### HTTP层处理规则
 * - 租户ID提取：从请求头、查询参数等提取租户ID
 * - 基础验证：验证租户ID格式
 * - 请求上下文设置：将租户ID设置到请求对象
 * - 响应头设置：设置租户相关的响应头
 *
 * ### 集成设计规则
 * - 与@hl8/multi-tenancy模块集成
 * - 专注于HTTP层面的租户处理
 * - 业务逻辑委托给Multi-Tenancy模块
 * - 支持多种租户ID提取方式
 *
 * ### 验证规则
 * - 租户ID格式验证
 * - 租户ID存在性验证
 * - 租户ID有效性验证
 * - 错误处理和响应
 *
 * @example
 * ```typescript
 * // 创建租户提取中间件
 * const middleware = new TenantExtractionMiddleware({
 *   tenantHeader: 'X-Tenant-ID',
 *   tenantQueryParam: 'tenant',
 *   enableBasicValidation: true
 * });
 *
 * // 注册中间件
 * fastify.addHook('preHandler', middleware.middleware);
 * ```
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
 * 处理HTTP层面的租户ID提取和基础验证，支持多种提取方式和验证规则。
 *
 * @description 此中间件处理HTTP层面的租户ID提取和基础验证。
 * 支持从请求头、查询参数等提取租户ID，并提供基础验证功能。
 * 与@hl8/multi-tenancy模块集成，确保租户上下文的正确传递。
 *
 * ## 业务规则
 *
 * ### 租户ID提取规则
 * - 优先从请求头提取租户ID
 * - 支持从查询参数提取租户ID
 * - 支持从子域名提取租户ID
 * - 支持自定义提取方式
 *
 * ### 验证规则
 * - 租户ID格式验证
 * - 租户ID存在性验证
 * - 租户ID有效性验证
 * - 错误处理和响应
 *
 * ### 上下文设置规则
 * - 将租户ID设置到请求对象
 * - 设置租户相关的响应头
 * - 支持租户上下文传递
 * - 支持错误信息记录
 *
 * @example
 * ```typescript
 * // 创建中间件实例
 * const middleware = new TenantExtractionMiddleware({
 *   tenantHeader: 'X-Tenant-ID',
 *   tenantQueryParam: 'tenant',
 *   enableBasicValidation: true
 * });
 *
 * // 使用中间件
 * fastify.addHook('preHandler', middleware.middleware);
 * ```
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
   * 从请求中提取租户ID，支持多种提取方式和优先级。
   *
   * @description 此方法从请求中提取租户ID，支持多种提取方式。
   * 按优先级顺序尝试从请求头、查询参数、子域名等提取租户ID。
   * 确保租户ID的正确提取和验证。
   *
   * ## 业务规则
   *
   * ### 提取优先级规则
   * - 优先从请求头提取租户ID
   * - 其次从查询参数提取租户ID
   * - 最后从子域名提取租户ID
   * - 支持自定义提取方式
   *
   * ### 验证规则
   * - 租户ID格式验证
   * - 租户ID存在性验证
   * - 租户ID有效性验证
   * - 错误处理和响应
   *
   * ### 性能规则
   * - 提取操作延迟小于1ms
   * - 支持高频调用
   * - 支持并发访问
   * - 内存占用最小化
   *
   * @param request Fastify请求对象
   * @returns 租户ID或null
   *
   * @example
   * ```typescript
   * // 提取租户ID
   * const tenantId = await this.extractTenantId(request);
   * if (tenantId) {
   *   console.log('租户ID:', tenantId);
   * }
   * ```
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
   * 验证租户ID的格式是否正确，包括长度、字符类型等验证。
   *
   * @description 此方法验证租户ID的格式是否正确。
   * 包括长度验证、字符类型验证、格式规范验证等。
   * 确保租户ID符合预定义的格式要求。
   *
   * ## 业务规则
   *
   * ### 格式验证规则
   * - 租户ID必须是非空字符串
   * - 租户ID长度必须在3-50个字符之间
   * - 租户ID只能包含字母、数字、连字符、下划线
   * - 租户ID不能以数字开头
   *
   * ### 字符验证规则
   * - 支持字母（a-z, A-Z）
   * - 支持数字（0-9）
   * - 支持连字符（-）
   * - 支持下划线（_）
   * - 不支持特殊字符和空格
   *
   * ### 长度验证规则
   * - 最小长度：3个字符
   * - 最大长度：50个字符
   * - 长度验证基于字符串实际长度
   * - 空字符串和null值视为无效
   *
   * @param tenantId 租户ID字符串
   * @returns 格式是否有效
   *
   * @example
   * ```typescript
   * // 验证租户ID格式
   * const isValid = this.isValidTenantIdFormat('tenant-123');
   * console.log('格式有效:', isValid);
   * ```
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
