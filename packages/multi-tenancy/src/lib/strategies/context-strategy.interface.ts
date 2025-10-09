/**
 * 租户上下文策略接口
 *
 * 定义租户上下文管理的策略接口，用于实现不同的上下文提取和管理方案
 * 包括请求头提取、查询参数提取、子域名提取等
 *
 * @fileoverview 租户上下文策略接口定义
 * @since 1.0.0
 */

import { ITenantContext } from '../types/tenant-context.types';

/**
 * HTTP请求接口
 *
 * 定义HTTP请求的基本结构，用于上下文提取
 *
 * @description 提供请求对象的基本接口
 * 支持从不同来源提取租户上下文信息
 */
export interface IHttpRequest {
  /** 请求头 */
  headers: Record<string, string | string[] | undefined>;
  /** 查询参数 */
  query: Record<string, unknown>;
  /** 路径参数 */
  params: Record<string, unknown>;
  /** 请求体 */
  body: Record<string, unknown>;
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 主机名 */
  hostname?: string;
  /** 子域名 */
  subdomain?: string;
  /** 用户信息（可选） */
  user?: Record<string, unknown>;
  /** 会话信息（可选） */
  session?: Record<string, unknown>;
}

/**
 * 租户上下文策略接口
 *
 * 定义租户上下文管理的核心策略接口
 *
 * @description 租户上下文策略用于从请求中提取和管理租户上下文信息
 * 支持多种提取方式：请求头、查询参数、子域名、JWT Token等
 *
 * ## 业务规则
 *
 * ### 提取规则
 * - 租户ID可以从多个来源提取，按优先级顺序处理
 * - 提取失败时应该有合理的默认值或错误处理
 * - 提取的租户ID必须经过格式验证
 * - 提取操作应该是幂等的和可重复的
 *
 * ### 验证规则
 * - 提取的上下文信息必须经过验证
 * - 验证失败应该返回明确的错误信息
 * - 验证应该支持异步操作
 * - 验证结果应该被缓存以提高性能
 *
 * ### 缓存规则
 * - 上下文信息应该被缓存以避免重复提取
 * - 缓存时间应该可配置
 * - 缓存应该支持手动刷新
 * - 缓存失效时应该自动重新提取
 *
 * ### 安全规则
 * - 上下文提取过程应该是安全的
 * - 敏感信息不应该被泄露
 * - 提取操作应该有适当的权限检查
 * - 上下文信息应该支持加密存储
 *
 * ## 业务逻辑流程
 *
 * 1. **请求解析**：解析HTTP请求对象
 * 2. **信息提取**：从请求中提取租户相关信息
 * 3. **格式验证**：验证提取信息的格式
 * 4. **上下文构建**：构建完整的租户上下文
 * 5. **缓存存储**：将上下文信息存储到缓存
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HeaderContextStrategy implements ITenantContextStrategy {
 *   async extractTenantId(request: IHttpRequest): Promise<string | null> {
 *     const tenantId = request.headers['x-tenant-id'] as string;
 *     return tenantId && this.isValidTenantId(tenantId) ? tenantId : null;
 *   }
 *
 *   async extractUserId(request: IHttpRequest): Promise<string | null> {
 *     const userId = request.headers['x-user-id'] as string;
 *     return userId && this.isValidUserId(userId) ? userId : null;
 *   }
 *
 *   async extractRequestId(request: IHttpRequest): Promise<string | null> {
 *     return request.headers['x-request-id'] as string || this.generateRequestId();
 *   }
 *
 *   async validateContext(context: ITenantContext): Promise<boolean> {
 *     return this.isValidTenantId(context.tenantId);
 *   }
 * }
 * ```
 */
export interface ITenantContextStrategy {
  /**
   * 提取租户ID
   *
   * 从HTTP请求中提取租户ID
   *
   * @description 从请求的不同部分提取租户ID
   * 支持多种提取方式：请求头、查询参数、子域名等
   *
   * @param request HTTP请求对象
   * @returns 租户ID或null
   *
   * @example
   * ```typescript
   * const tenantId = await strategy.extractTenantId(request);
   * if (tenantId) {
   *   console.log('Extracted tenant ID:', tenantId);
   * } else {
   *   console.log('No tenant ID found in request');
   * }
   * ```
   */
  extractTenantId(request: IHttpRequest): Promise<string | null>;

  /**
   * 提取用户ID
   *
   * 从HTTP请求中提取用户ID
   *
   * @description 从请求中提取用户标识信息
   * 通常来自JWT Token、Session或请求头
   *
   * @param request HTTP请求对象
   * @returns 用户ID或null
   *
   * @example
   * ```typescript
   * const userId = await strategy.extractUserId(request);
   * if (userId) {
   *   console.log('Extracted user ID:', userId);
   * }
   * ```
   */
  extractUserId(request: IHttpRequest): Promise<string | null>;

  /**
   * 提取请求ID
   *
   * 从HTTP请求中提取或生成请求ID
   *
   * @description 获取请求的唯一标识符
   * 用于请求追踪和日志关联
   *
   * @param request HTTP请求对象
   * @returns 请求ID
   *
   * @example
   * ```typescript
   * const requestId = await strategy.extractRequestId(request);
   * console.log('Request ID:', requestId);
   * ```
   */
  extractRequestId(request: IHttpRequest): Promise<string | null>;

  /**
   * 提取会话ID
   *
   * 从HTTP请求中提取会话ID
   *
   * @description 获取会话的唯一标识符
   * 用于会话管理和状态维护
   *
   * @param request HTTP请求对象
   * @returns 会话ID或null
   *
   * @example
   * ```typescript
   * const sessionId = await strategy.extractSessionId(request);
   * if (sessionId) {
   *   console.log('Session ID:', sessionId);
   * }
   * ```
   */
  extractSessionId(request: IHttpRequest): Promise<string | null>;

  /**
   * 验证上下文
   *
   * 验证租户上下文的完整性和有效性
   *
   * @description 检查上下文信息的格式和有效性
   * 确保上下文信息符合业务规则
   *
   * @param context 租户上下文
   * @returns 验证是否成功
   *
   * @example
   * ```typescript
   * const isValid = await strategy.validateContext(context);
   * if (!isValid) {
   *   throw new Error('Invalid tenant context');
   * }
   * ```
   */
  validateContext(context: ITenantContext): Promise<boolean>;

  /**
   * 构建上下文
   *
   * 从请求信息构建完整的租户上下文
   *
   * @description 整合提取的各种信息，构建完整的租户上下文
   * 包含租户ID、用户ID、请求ID、会话ID等
   *
   * @param request HTTP请求对象
   * @returns 租户上下文
   *
   * @example
   * ```typescript
   * const context = await strategy.buildContext(request);
   * console.log('Built context:', context);
   * ```
   */
  buildContext(request: IHttpRequest): Promise<ITenantContext>;

  /**
   * 获取上下文配置
   *
   * 获取上下文策略的配置信息
   *
   * @description 返回策略的配置参数
   * 用于调试和监控
   *
   * @returns 上下文配置
   *
   * @example
   * ```typescript
   * const config = await strategy.getContextConfig();
   * console.log('Extraction sources:', config.extractionSources);
   * ```
   */
  getContextConfig(): Record<string, unknown>;
}

/**
 * 租户上下文策略工厂接口
 *
 * 定义租户上下文策略的工厂接口，用于创建和配置上下文策略
 *
 * @description 策略工厂用于创建和管理上下文策略实例
 * 支持策略的动态创建、配置和替换
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TenantContextStrategyFactory {
 *   createStrategy(config: ContextConfig): ITenantContextStrategy {
 *     switch (config.type) {
 *       case 'header':
 *         return new HeaderContextStrategy(config);
 *       case 'query':
 *         return new QueryContextStrategy(config);
 *       case 'subdomain':
 *         return new SubdomainContextStrategy(config);
 *       case 'jwt':
 *         return new JwtContextStrategy(config);
 *       default:
 *         throw new Error(`Unsupported context strategy: ${config.type}`);
 *     }
 *   }
 * }
 * ```
 */
export interface ITenantContextStrategyFactory {
  /**
   * 创建上下文策略
   *
   * 根据配置创建相应的上下文策略实例
   *
   * @param config 上下文配置
   * @returns 上下文策略实例
   */
  createStrategy(config: Record<string, unknown>): ITenantContextStrategy;

  /**
   * 获取支持的策略类型
   *
   * 返回工厂支持的所有上下文策略类型
   *
   * @returns 支持的策略类型列表
   */
  getSupportedStrategies(): string[];

  /**
   * 验证策略配置
   *
   * 验证上下文策略配置的有效性
   *
   * @param config 上下文配置
   * @returns 验证结果
   */
  validateConfig(config: Record<string, unknown>): boolean;
}

/**
 * 租户上下文配置接口
 *
 * 定义租户上下文策略的配置选项
 *
 * @description 上下文配置包含提取方式、验证规则、缓存设置等参数
 * 用于控制上下文策略的行为
 *
 * @example
 * ```typescript
 * const config: ITenantContextConfig = {
 *   extractionSources: ['header', 'query', 'subdomain'],
 *   tenantHeader: 'X-Tenant-ID',
 *   userHeader: 'X-User-ID',
 *   requestIdHeader: 'X-Request-ID',
 *   sessionIdHeader: 'X-Session-ID',
 *   enableValidation: true,
 *   enableCache: true,
 *   cacheTtl: 300000
 * };
 * ```
 */
export interface ITenantContextConfig {
  /** 提取来源列表 */
  extractionSources: string[];
  /** 租户ID请求头名称 */
  tenantHeader: string;
  /** 用户ID请求头名称 */
  userHeader: string;
  /** 请求ID请求头名称 */
  requestIdHeader: string;
  /** 会话ID请求头名称 */
  sessionIdHeader: string;
  /** 是否启用验证 */
  enableValidation: boolean;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存生存时间（毫秒） */
  cacheTtl: number;
  /** 默认租户ID */
  defaultTenantId?: string;
}
