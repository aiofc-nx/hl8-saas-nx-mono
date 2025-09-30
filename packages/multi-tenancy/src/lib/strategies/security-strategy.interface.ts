/**
 * 租户安全策略接口
 *
 * 定义租户安全管理的策略接口，用于实现不同的安全控制方案
 * 包括权限检查、跨租户访问控制、审计日志等
 *
 * @fileoverview 租户安全策略接口定义
 * @author HL8 Team
 * @since 1.0.0
 */

import {
  ITenantPermission,
  ITenantAction,
  ITenantContext,
} from '../types/tenant-core.types';

/**
 * 租户安全策略接口
 *
 * 定义租户安全管理的核心策略接口
 *
 * @description 租户安全策略用于实现细粒度的安全控制
 * 包括权限检查、访问控制、审计日志、安全监控等功能
 *
 * ## 业务规则
 *
 * ### 权限规则
 * - 权限检查必须是实时的和准确的
 * - 权限结果应该被缓存以提高性能
 * - 权限变更应该立即生效
 * - 权限检查应该支持批量操作
 *
 * ### 访问控制规则
 * - 跨租户访问必须经过严格的权限检查
 * - 访问控制应该支持细粒度的权限控制
 * - 访问失败应该记录详细的审计日志
 * - 访问控制应该支持熔断机制
 *
 * ### 审计规则
 * - 所有安全相关操作必须记录审计日志
 * - 审计日志应该包含完整的上下文信息
 * - 审计日志应该支持实时查询和分析
 * - 审计日志应该符合合规要求
 *
 * ### 安全监控规则
 * - 安全事件应该被实时监控和告警
 * - 异常访问模式应该被自动检测
 * - 安全统计应该支持实时查询
 * - 安全报告应该支持定期生成
 *
 * ## 业务逻辑流程
 *
 * 1. **权限验证**：检查用户是否有相应权限
 * 2. **访问控制**：验证跨租户访问的合法性
 * 3. **审计记录**：记录安全相关的操作
 * 4. **安全监控**：监控安全事件和异常
 * 5. **告警处理**：处理安全告警和异常
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class DatabaseSecurityStrategy implements ITenantSecurityStrategy {
 *   async checkTenantPermission(tenantId: string, permission: string): Promise<boolean> {
 *     const permissionRecord = await this.permissionRepository.findByTenantAndPermission(tenantId, permission);
 *     return permissionRecord && permissionRecord.status === 'active';
 *   }
 *
 *   async checkCrossTenantAccess(sourceTenant: string, targetTenant: string): Promise<boolean> {
 *     const accessRule = await this.accessRuleRepository.findByTenants(sourceTenant, targetTenant);
 *     return accessRule && accessRule.allowCrossTenant;
 *   }
 *
 *   async auditTenantAction(action: ITenantAction): Promise<void> {
 *     await this.auditRepository.create(action);
 *   }
 * }
 * ```
 */
export interface ITenantSecurityStrategy {
  /**
   * 检查租户权限
   *
   * 检查租户是否具有指定权限
   *
   * @description 验证租户是否有执行特定操作的权限
   * 这是最基础的权限检查，用于守卫和中间件
   *
   * @param tenantId 租户ID
   * @param permission 权限标识
   * @param userId 用户ID（可选）
   * @returns 是否有权限
   *
   * @example
   * ```typescript
   * const hasPermission = await strategy.checkTenantPermission('tenant-123', 'tenant.read');
   * if (!hasPermission) {
   *   throw new ForbiddenException('Insufficient permissions');
   * }
   * ```
   */
  checkTenantPermission(
    tenantId: string,
    permission: string,
    userId?: string
  ): Promise<boolean>;

  /**
   * 检查跨租户访问权限
   *
   * 检查源租户是否可以访问目标租户
   *
   * @description 验证租户间的访问权限
   * 用于实现租户间的数据共享和协作功能
   *
   * @param sourceTenant 源租户ID
   * @param targetTenant 目标租户ID
   * @param userId 用户ID（可选）
   * @returns 是否允许跨租户访问
   *
   * @example
   * ```typescript
   * const allowAccess = await strategy.checkCrossTenantAccess('tenant-123', 'tenant-456');
   * if (!allowAccess) {
   *   throw new ForbiddenException('Cross-tenant access denied');
   * }
   * ```
   */
  checkCrossTenantAccess(
    sourceTenant: string,
    targetTenant: string,
    userId?: string
  ): Promise<boolean>;

  /**
   * 审计租户操作
   *
   * 记录租户相关的安全操作
   *
   * @description 记录所有安全相关的操作，用于审计和监控
   * 包括权限检查、访问控制、安全事件等
   *
   * @param action 租户操作
   * @returns 审计记录是否成功
   *
   * @example
   * ```typescript
   * const action: ITenantAction = {
   *   action: 'tenant.access',
   *   tenantId: 'tenant-123',
   *   userId: 'user-456',
   *   resource: 'data',
   *   resourceId: 'data-789',
   *   metadata: { ip: '192.168.1.1' },
   *   timestamp: new Date()
   * };
   * await strategy.auditTenantAction(action);
   * ```
   */
  auditTenantAction(action: ITenantAction): Promise<void>;

  /**
   * 批量检查权限
   *
   * 批量检查多个权限
   *
   * @description 支持批量权限检查以提高性能
   * 适用于需要检查多个权限的场景
   *
   * @param tenantId 租户ID
   * @param permissions 权限列表
   * @param userId 用户ID（可选）
   * @returns 权限检查结果映射
   *
   * @example
   * ```typescript
   * const results = await strategy.checkTenantPermissions(
   *   'tenant-123',
   *   ['tenant.read', 'tenant.write', 'tenant.delete']
   * );
   * // 结果: { 'tenant.read': true, 'tenant.write': false, 'tenant.delete': false }
   * ```
   */
  checkTenantPermissions(
    tenantId: string,
    permissions: string[],
    userId?: string
  ): Promise<Record<string, boolean>>;

  /**
   * 获取租户权限列表
   *
   * 获取租户的所有权限
   *
   * @description 返回租户的完整权限列表
   * 用于权限管理和权限展示
   *
   * @param tenantId 租户ID
   * @param userId 用户ID（可选）
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = await strategy.getTenantPermissions('tenant-123', 'user-456');
   * console.log('User permissions:', permissions);
   * ```
   */
  getTenantPermissions(
    tenantId: string,
    userId?: string
  ): Promise<ITenantPermission[]>;

  /**
   * 检查资源访问权限
   *
   * 检查用户对特定资源的访问权限
   *
   * @description 验证用户是否有权限访问特定资源
   * 支持细粒度的资源级权限控制
   *
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @param resource 资源类型
   * @param resourceId 资源ID
   * @param action 操作类型
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = await strategy.checkResourceAccess(
   *   'tenant-123',
   *   'user-456',
   *   'document',
   *   'doc-789',
   *   'read'
   * );
   * ```
   */
  checkResourceAccess(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    action: string
  ): Promise<boolean>;

  /**
   * 获取安全统计
   *
   * 获取租户的安全统计信息
   *
   * @description 返回租户的安全统计和监控数据
   * 用于安全分析和报告生成
   *
   * @param tenantId 租户ID
   * @param timeRange 时间范围
   * @returns 安全统计信息
   *
   * @example
   * ```typescript
   * const stats = await strategy.getSecurityStats('tenant-123', {
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   * console.log('Security stats:', stats);
   * ```
   */
  getSecurityStats(
    tenantId: string,
    timeRange: { startDate: Date; endDate: Date }
  ): Promise<Record<string, unknown>>;

  /**
   * 获取安全配置
   *
   * 获取安全策略的配置信息
   *
   * @description 返回安全策略的配置参数
   * 用于调试和监控
   *
   * @returns 安全配置
   *
   * @example
   * ```typescript
   * const config = await strategy.getSecurityConfig();
   * console.log('Security config:', config);
   * ```
   */
  getSecurityConfig(): Record<string, unknown>;
}

/**
 * 租户安全策略工厂接口
 *
 * 定义租户安全策略的工厂接口，用于创建和配置安全策略
 *
 * @description 策略工厂用于创建和管理安全策略实例
 * 支持策略的动态创建、配置和替换
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TenantSecurityStrategyFactory {
 *   createStrategy(config: SecurityConfig): ITenantSecurityStrategy {
 *     switch (config.type) {
 *       case 'database':
 *         return new DatabaseSecurityStrategy(config);
 *       case 'rbac':
 *         return new RbacSecurityStrategy(config);
 *       case 'acl':
 *         return new AclSecurityStrategy(config);
 *       default:
 *         throw new Error(`Unsupported security strategy: ${config.type}`);
 *     }
 *   }
 * }
 * ```
 */
export interface ITenantSecurityStrategyFactory {
  /**
   * 创建安全策略
   *
   * 根据配置创建相应的安全策略实例
   *
   * @param config 安全配置
   * @returns 安全策略实例
   */
  createStrategy(config: Record<string, unknown>): ITenantSecurityStrategy;

  /**
   * 获取支持的策略类型
   *
   * 返回工厂支持的所有安全策略类型
   *
   * @returns 支持的策略类型列表
   */
  getSupportedStrategies(): string[];

  /**
   * 验证策略配置
   *
   * 验证安全策略配置的有效性
   *
   * @param config 安全配置
   * @returns 验证结果
   */
  validateConfig(config: Record<string, unknown>): boolean;
}

/**
 * 租户安全配置接口
 *
 * 定义租户安全策略的配置选项
 *
 * @description 安全配置包含权限模型、审计设置、监控参数等
 * 用于控制安全策略的行为
 *
 * @example
 * ```typescript
 * const config: ITenantSecurityConfig = {
 *   permissionModel: 'rbac',
 *   enableAuditLog: true,
 *   auditRetentionDays: 90,
 *   enableRealTimeMonitoring: true,
 *   maxFailedAttempts: 5,
 *   lockoutDuration: 300000,
 *   enableIpWhitelist: true,
 *   ipWhitelist: ['192.168.1.0/24']
 * };
 * ```
 */
export interface ITenantSecurityConfig {
  /** 权限模型 */
  permissionModel: 'rbac' | 'acl' | 'abac';
  /** 是否启用审计日志 */
  enableAuditLog: boolean;
  /** 审计日志保留天数 */
  auditRetentionDays: number;
  /** 是否启用实时监控 */
  enableRealTimeMonitoring: boolean;
  /** 最大失败尝试次数 */
  maxFailedAttempts: number;
  /** 锁定持续时间（毫秒） */
  lockoutDuration: number;
  /** 是否启用IP白名单 */
  enableIpWhitelist: boolean;
  /** IP白名单 */
  ipWhitelist?: string[];
  /** 是否启用异常检测 */
  enableAnomalyDetection: boolean;
  /** 异常检测阈值 */
  anomalyThreshold: number;
}
