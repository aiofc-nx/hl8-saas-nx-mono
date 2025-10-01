/**
 * 租户验证策略接口
 *
 * 定义租户验证的策略接口，用于实现不同的验证方案
 * 包括数据库验证、缓存验证、外部服务验证等
 *
 * @fileoverview 租户验证策略接口定义
 * @since 1.0.0
 */

import {
  ITenantInfo,
  ITenantValidationResult,
  ITenantContext,
} from '../types/tenant-core.types';

/**
 * 租户验证策略接口
 *
 * 定义租户验证的核心策略接口
 *
 * @description 租户验证策略用于验证租户的有效性和权限
 * 支持多种验证方式：数据库查询、缓存检查、外部服务调用等
 *
 * ## 业务规则
 *
 * ### 验证规则
 * - 租户ID格式必须符合预定义规范
 * - 租户必须存在于系统中且状态正常
 * - 租户必须具有相应的访问权限
 * - 验证结果必须包含完整的租户信息
 *
 * ### 缓存规则
 * - 验证结果应该被缓存以提高性能
 * - 缓存时间应该可配置
 * - 缓存失效时应该自动重新验证
 * - 缓存应该支持手动刷新
 *
 * ### 错误处理规则
 * - 验证失败应该返回明确的错误信息
 * - 网络错误应该支持重试机制
 * - 超时错误应该有合理的超时时间
 * - 错误信息应该便于调试和监控
 *
 * ### 性能规则
 * - 验证操作应该在合理时间内完成
 * - 批量验证应该支持并行处理
 * - 验证结果应该支持异步处理
 * - 验证操作应该支持熔断机制
 *
 * ## 业务逻辑流程
 *
 * 1. **格式验证**：验证租户ID格式是否正确
 * 2. **存在性验证**：检查租户是否存在于系统中
 * 3. **状态验证**：验证租户状态是否正常
 * 4. **权限验证**：检查租户是否有相应权限
 * 5. **缓存更新**：更新验证结果缓存
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class DatabaseValidationStrategy implements ITenantValidationStrategy {
 *   async validateTenant(tenantId: string): Promise<boolean> {
 *     const tenant = await this.tenantRepository.findById(tenantId);
 *     return tenant && tenant.status === 'active';
 *   }
 *
 *   async getTenantInfo(tenantId: string): Promise<ITenantInfo> {
 *     const tenant = await this.tenantRepository.findById(tenantId);
 *     if (!tenant) {
 *       throw new Error(`Tenant not found: ${tenantId}`);
 *     }
 *     return tenant;
 *   }
 *
 *   async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
 *     const access = await this.accessRepository.findByTenantAndUser(tenantId, userId);
 *     return access && access.status === 'active';
 *   }
 * }
 * ```
 */
export interface ITenantValidationStrategy {
  /**
   * 验证租户
   *
   * 验证指定租户ID的有效性
   *
   * @description 检查租户是否存在且状态正常
   * 这是最基本的验证操作，用于中间件和守卫
   *
   * @param tenantId 租户ID
   * @returns 验证是否成功
   *
   * @example
   * ```typescript
   * const isValid = await strategy.validateTenant('tenant-123');
   * if (!isValid) {
   *   throw new UnauthorizedException('Invalid tenant');
   * }
   * ```
   */
  validateTenant(tenantId: string): Promise<boolean>;

  /**
   * 获取租户信息
   *
   * 根据租户ID获取完整的租户信息
   *
   * @description 获取租户的详细信息，包括名称、状态、类型等
   * 用于构建租户上下文和权限检查
   *
   * @param tenantId 租户ID
   * @returns 租户信息
   *
   * @throws {Error} 当租户不存在时抛出异常
   *
   * @example
   * ```typescript
   * const tenantInfo = await strategy.getTenantInfo('tenant-123');
   * console.log(tenantInfo.name); // 'Acme Corp'
   * console.log(tenantInfo.status); // 'active'
   * ```
   */
  getTenantInfo(tenantId: string): Promise<ITenantInfo>;

  /**
   * 验证租户访问权限
   *
   * 验证用户对指定租户的访问权限
   *
   * @description 检查用户是否有权限访问指定租户
   * 用于细粒度的权限控制和访问审计
   *
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = await strategy.validateTenantAccess('tenant-123', 'user-456');
   * if (!hasAccess) {
   *   throw new ForbiddenException('Access denied');
   * }
   * ```
   */
  validateTenantAccess(tenantId: string, userId: string): Promise<boolean>;

  /**
   * 批量验证租户
   *
   * 批量验证多个租户的有效性
   *
   * @description 支持批量验证以提高性能
   * 适用于需要验证多个租户的场景
   *
   * @param tenantIds 租户ID列表
   * @returns 验证结果映射
   *
   * @example
   * ```typescript
   * const results = await strategy.validateTenants(['tenant-1', 'tenant-2', 'tenant-3']);
   * // 结果: { 'tenant-1': true, 'tenant-2': false, 'tenant-3': true }
   * ```
   */
  validateTenants(tenantIds: string[]): Promise<Record<string, boolean>>;

  /**
   * 获取验证结果
   *
   * 获取完整的租户验证结果
   *
   * @description 返回包含验证状态和租户信息的完整结果
   * 用于中间件和守卫的详细处理
   *
   * @param tenantId 租户ID
   * @param userId 用户ID（可选）
   * @returns 验证结果
   *
   * @example
   * ```typescript
   * const result = await strategy.getValidationResult('tenant-123', 'user-456');
   * if (result.valid) {
   *   console.log('Tenant:', result.tenantInfo.name);
   * } else {
   *   console.error('Validation failed:', result.error);
   * }
   * ```
   */
  getValidationResult(
    tenantId: string,
    userId?: string
  ): Promise<ITenantValidationResult>;

  /**
   * 刷新验证缓存
   *
   * 刷新指定租户的验证缓存
   *
   * @description 清除租户的验证缓存，强制重新验证
   * 用于租户信息更新后的缓存同步
   *
   * @param tenantId 租户ID
   * @returns 刷新是否成功
   *
   * @example
   * ```typescript
   * await strategy.refreshValidationCache('tenant-123');
   * // 下次验证时会重新查询数据库
   * ```
   */
  refreshValidationCache(tenantId: string): Promise<boolean>;

  /**
   * 获取验证配置
   *
   * 获取验证策略的配置信息
   *
   * @description 返回验证策略的配置参数
   * 用于调试和监控
   *
   * @returns 验证配置
   *
   * @example
   * ```typescript
   * const config = await strategy.getValidationConfig();
   * console.log('Cache TTL:', config.cacheTtl);
   * console.log('Timeout:', config.timeout);
   * ```
   */
  getValidationConfig(): Record<string, unknown>;
}

/**
 * 租户验证策略工厂接口
 *
 * 定义租户验证策略的工厂接口，用于创建和配置验证策略
 *
 * @description 策略工厂用于创建和管理验证策略实例
 * 支持策略的动态创建、配置和替换
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TenantValidationStrategyFactory {
 *   createStrategy(config: ValidationConfig): ITenantValidationStrategy {
 *     switch (config.type) {
 *       case 'database':
 *         return new DatabaseValidationStrategy(config);
 *       case 'cache':
 *         return new CacheValidationStrategy(config);
 *       case 'external':
 *         return new ExternalValidationStrategy(config);
 *       default:
 *         throw new Error(`Unsupported validation strategy: ${config.type}`);
 *     }
 *   }
 * }
 * ```
 */
export interface ITenantValidationStrategyFactory {
  /**
   * 创建验证策略
   *
   * 根据配置创建相应的验证策略实例
   *
   * @param config 验证配置
   * @returns 验证策略实例
   */
  createStrategy(config: Record<string, unknown>): ITenantValidationStrategy;

  /**
   * 获取支持的策略类型
   *
   * 返回工厂支持的所有验证策略类型
   *
   * @returns 支持的策略类型列表
   */
  getSupportedStrategies(): string[];

  /**
   * 验证策略配置
   *
   * 验证验证策略配置的有效性
   *
   * @param config 验证配置
   * @returns 验证结果
   */
  validateConfig(config: Record<string, unknown>): boolean;
}

/**
 * 租户验证配置接口
 *
 * 定义租户验证策略的配置选项
 *
 * @description 验证配置包含缓存、超时、重试等参数
 * 用于控制验证策略的行为
 *
 * @example
 * ```typescript
 * const config: ITenantValidationConfig = {
 *   cacheEnabled: true,
 *   cacheTtl: 300000, // 5 minutes
 *   timeout: 5000,    // 5 seconds
 *   maxRetries: 3,
 *   retryDelay: 1000  // 1 second
 * };
 * ```
 */
export interface ITenantValidationConfig {
  /** 是否启用缓存 */
  cacheEnabled: boolean;
  /** 缓存生存时间（毫秒） */
  cacheTtl: number;
  /** 验证超时时间（毫秒） */
  timeout: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟时间（毫秒） */
  retryDelay: number;
  /** 是否启用熔断器 */
  circuitBreakerEnabled: boolean;
  /** 熔断器失败阈值 */
  circuitBreakerThreshold: number;
}
