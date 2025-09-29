/**
 * 多租户中间件
 *
 * @description 处理多租户架构的租户上下文管理、数据隔离和安全策略
 *
 * ## 多租户核心概念
 *
 * ### 🏢 **租户隔离**
 * - 数据完全隔离：每个租户的数据独立存储
 * - 配置隔离：每个租户有独立的配置环境
 * - 用户隔离：租户用户只能访问本租户资源
 *
 * ### 🔐 **安全策略**
 * - 租户验证：验证租户ID的有效性
 * - 权限控制：基于租户的权限管理
 * - 数据访问控制：确保数据访问的租户隔离
 *
 * @since 1.0.0
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CoreFastifyMiddleware } from './core-fastify.middleware';
import { IFastifyMiddlewareConfig } from '../types/fastify.types';

/**
 * 租户上下文接口
 */
export interface ITenantContext {
  /** 租户ID */
  tenantId: string;

  /** 租户代码 */
  tenantCode: string;

  /** 租户名称 */
  tenantName?: string;

  /** 租户类型 */
  tenantType?: 'enterprise' | 'community' | 'team' | 'personal';

  /** 租户状态 */
  status?: 'active' | 'inactive' | 'suspended';

  /** 创建时间 */
  createdAt: Date;

  /** 配置信息 */
  config?: Record<string, any>;
}

/**
 * 租户中间件配置
 */
export interface ITenantMiddlewareConfig extends IFastifyMiddlewareConfig {
  /** 租户标识头名称 */
  tenantHeader?: string;

  /** 租户查询参数名称 */
  tenantQueryParam?: string;

  /** 是否验证租户 */
  validateTenant?: boolean;

  /** 租户验证函数 */
  validateTenantFn?: (tenantId: string) => Promise<boolean>;

  /** 租户上下文获取函数 */
  getTenantContextFn?: (tenantId: string) => Promise<ITenantContext>;

  /** 默认租户ID */
  defaultTenantId?: string;

  /** 是否允许子域名租户解析 */
  allowSubdomainTenant?: boolean;
}

/**
 * 多租户中间件
 *
 * @description 处理多租户架构的租户上下文管理
 */
export class TenantMiddleware extends CoreFastifyMiddleware {
  private readonly tenantConfig: ITenantMiddlewareConfig;

  constructor(config: ITenantMiddlewareConfig) {
    super({
      priority: 1,
      enabled: true,
      path: '/api',
      ...config,
    });

    this.tenantConfig = {
      tenantHeader: 'X-Tenant-ID',
      tenantQueryParam: 'tenant',
      validateTenant: true,
      allowSubdomainTenant: true,
      ...config,
    };
  }

  /**
   * 中间件函数
   *
   * @description 处理租户上下文提取和验证
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
        // 如果没有租户ID且不允许默认租户，返回错误
        if (!this.tenantConfig.defaultTenantId) {
          reply.status(400).send({
            error: 'Tenant ID is required',
            code: 'TENANT_ID_REQUIRED',
          });
          return;
        }

        // 使用默认租户ID
        request.tenantId = this.tenantConfig.defaultTenantId;
        request.tenantContext = await this.getDefaultTenantContext();
        done();
        return;
      }

      // 验证租户
      if (this.tenantConfig.validateTenant) {
        const isValid = await this.validateTenant(tenantId);
        if (!isValid) {
          reply.status(403).send({
            error: 'Invalid tenant ID',
            code: 'INVALID_TENANT',
          });
          return;
        }
      }

      // 获取租户上下文
      const tenantContext = await this.getTenantContext(tenantId);

      // 设置租户上下文到请求对象
      request.tenantId = tenantId;
      request.tenantContext = tenantContext;

      // 设置响应头
      reply.header('X-Tenant-ID', tenantId);

      done();
    } catch (error) {
      console.error('租户中间件错误:', error);
      reply.status(500).send({
        error: 'Tenant processing failed',
        code: 'TENANT_ERROR',
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
      request.headers[
        this.tenantConfig.tenantHeader?.toLowerCase() || 'x-tenant-id'
      ];
    if (headerTenantId && typeof headerTenantId === 'string') {
      return headerTenantId;
    }

    // 2. 从查询参数获取
    const query = request.query as Record<string, any>;
    const queryTenantId = query[this.tenantConfig.tenantQueryParam || 'tenant'];
    if (queryTenantId && typeof queryTenantId === 'string') {
      return queryTenantId;
    }

    // 3. 从子域名获取
    if (this.tenantConfig.allowSubdomainTenant) {
      const subdomainTenantId = this.extractTenantFromSubdomain(request);
      if (subdomainTenantId) {
        return subdomainTenantId;
      }
    }

    return null;
  }

  /**
   * 从子域名提取租户ID
   *
   * @description 支持子域名租户解析，如 tenant1.yourdomain.com
   */
  private extractTenantFromSubdomain(request: FastifyRequest): string | null {
    const host = request.headers.host;
    if (!host) return null;

    // 解析子域名
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // 排除常见的非租户子域名
      const excludeSubdomains = ['www', 'api', 'admin', 'app', 'portal'];
      if (!excludeSubdomains.includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * 验证租户
   *
   * @description 验证租户ID的有效性
   */
  private async validateTenant(tenantId: string): Promise<boolean> {
    if (this.tenantConfig.validateTenantFn) {
      return await this.tenantConfig.validateTenantFn(tenantId);
    }

    // 默认验证逻辑：检查租户ID格式
    return this.isValidTenantId(tenantId);
  }

  /**
   * 检查租户ID格式
   *
   * @description 验证租户ID的格式是否正确
   */
  private isValidTenantId(tenantId: string): boolean {
    // 租户ID应该是非空字符串，长度在3-50之间
    if (!tenantId || typeof tenantId !== 'string') return false;
    if (tenantId.length < 3 || tenantId.length > 50) return false;

    // 租户ID只能包含字母、数字、连字符和下划线
    const tenantIdRegex = /^[a-zA-Z0-9-_]+$/;
    return tenantIdRegex.test(tenantId);
  }

  /**
   * 获取租户上下文
   *
   * @description 获取租户的完整上下文信息
   */
  private async getTenantContext(tenantId: string): Promise<ITenantContext> {
    if (this.tenantConfig.getTenantContextFn) {
      return await this.tenantConfig.getTenantContextFn(tenantId);
    }

    // 默认实现：创建基础租户上下文
    return {
      tenantId,
      tenantCode: tenantId,
      tenantName: `Tenant ${tenantId}`,
      tenantType: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      config: {},
    };
  }

  /**
   * 获取默认租户上下文
   *
   * @description 获取默认租户的上下文信息
   */
  private async getDefaultTenantContext(): Promise<ITenantContext> {
    const defaultTenantId = this.tenantConfig.defaultTenantId || 'default';
    return {
      tenantId: defaultTenantId,
      tenantCode: defaultTenantId,
      tenantName: 'Default Tenant',
      tenantType: 'personal',
      status: 'active',
      createdAt: new Date(),
      config: {},
    };
  }

  /**
   * 获取租户配置
   *
   * @description 获取当前租户中间件的配置信息
   */
  getTenantConfig(): ITenantMiddlewareConfig {
    return { ...this.tenantConfig };
  }

  /**
   * 检查租户是否有效
   *
   * @description 验证租户ID是否有效
   */
  async isTenantValid(tenantId: string): Promise<boolean> {
    return await this.validateTenant(tenantId);
  }
}

/**
 * 租户中间件工厂函数
 *
 * @description 创建租户中间件的便捷函数
 */
export function createTenantMiddleware(
  config: Partial<ITenantMiddlewareConfig> = {}
): TenantMiddleware {
  return new TenantMiddleware({
    name: 'tenant',
    priority: 1,
    enabled: true,
    path: '/api',
    ...config,
  });
}

/**
 * 默认租户配置
 *
 * @description 提供常用的租户配置预设
 */
export const DefaultTenantConfigs = {
  /** 开发环境配置 - 宽松验证 */
  development: {
    validateTenant: false,
    allowSubdomainTenant: true,
    defaultTenantId: 'dev-tenant',
  },

  /** 生产环境配置 - 严格验证 */
  production: {
    validateTenant: true,
    allowSubdomainTenant: true,
    tenantHeader: 'X-Tenant-ID',
    tenantQueryParam: 'tenant',
  },

  /** API服务配置 - 支持多种租户识别方式 */
  apiService: {
    validateTenant: true,
    allowSubdomainTenant: true,
    tenantHeader: 'X-Tenant-ID',
    tenantQueryParam: 'tenant',
    validateTenantFn: async (tenantId: string) => {
      // 这里可以集成数据库验证
      return tenantId.length >= 3;
    },
    getTenantContextFn: async (tenantId: string) => {
      // 这里可以集成数据库查询
      return {
        tenantId,
        tenantCode: tenantId,
        tenantName: `Tenant ${tenantId}`,
        tenantType: 'enterprise',
        status: 'active',
        createdAt: new Date(),
        config: {},
      };
    },
  },
} as const;
