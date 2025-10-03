/**
 * 审计装饰器
 *
 * 提供完整的审计功能装饰器，包括操作记录、用户追踪、数据变更审计等。
 * 作为通用功能组件，为业务模块提供强大的审计能力。
 *
 * @description 审计装饰器的完整实现，支持多种审计场景
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 审计配置接口
 */
export interface AuditConfig {
  /** 是否启用审计 */
  enabled: boolean;
  /** 审计级别 */
  level: 'basic' | 'detailed' | 'comprehensive';
  /** 是否记录请求参数 */
  logRequest: boolean;
  /** 是否记录响应数据 */
  logResponse: boolean;
  /** 是否记录执行时间 */
  logExecutionTime: boolean;
  /** 是否记录用户信息 */
  logUserInfo: boolean;
  /** 是否记录IP地址 */
  logIpAddress: boolean;
  /** 是否记录用户代理 */
  logUserAgent: boolean;
  /** 敏感字段列表 */
  sensitiveFields: string[];
  /** 排除字段列表 */
  excludeFields: string[];
  /** 审计标签 */
  tags: string[];
}

/**
 * 审计元数据键
 */
export const AUDIT_METADATA_KEY = 'audit_config';

/**
 * 审计装饰器
 *
 * 为方法添加审计功能
 *
 * @description 自动记录方法执行过程，包括参数、结果、执行时间等
 * @param config - 审计配置
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @Audit({
 *   enabled: true,
 *   level: 'detailed',
 *   logRequest: true,
 *   logResponse: true,
 *   tags: ['user-management', 'critical']
 * })
 * async createUser(userData: CreateUserDto): Promise<User> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function Audit(config: Partial<AuditConfig> = {}): MethodDecorator {
  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'basic',
    logRequest: false,
    logResponse: false,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: false,
    sensitiveFields: ['password', 'token', 'secret'],
    excludeFields: [],
    tags: [],
  };

  const auditConfig = { ...defaultConfig, ...config };
  return SetMetadata(AUDIT_METADATA_KEY, auditConfig);
}

/**
 * 基本审计装饰器
 *
 * 提供基本的审计功能
 *
 * @description 记录方法执行的基本信息
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @BasicAudit()
 * async getUser(id: string): Promise<User> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function BasicAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'basic',
    logRequest: false,
    logResponse: false,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: false,
    logUserAgent: false,
    sensitiveFields: ['password', 'token'],
    excludeFields: [],
    tags: ['basic-audit'],
  });
}

/**
 * 详细审计装饰器
 *
 * 提供详细的审计功能
 *
 * @description 记录方法执行的详细信息，包括请求参数和响应数据
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @DetailedAudit()
 * async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function DetailedAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'detailed',
    logRequest: true,
    logResponse: true,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey'],
    excludeFields: ['internalId', 'systemData'],
    tags: ['detailed-audit'],
  });
}

/**
 * 全面审计装饰器
 *
 * 提供全面的审计功能
 *
 * @description 记录方法执行的所有信息，包括完整的请求和响应数据
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @ComprehensiveAudit()
 * async deleteUser(id: string): Promise<void> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function ComprehensiveAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'comprehensive',
    logRequest: true,
    logResponse: true,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'privateKey'],
    excludeFields: [],
    tags: ['comprehensive-audit'],
  });
}

/**
 * 敏感操作审计装饰器
 *
 * 为敏感操作提供特殊审计
 *
 * @description 专门用于敏感操作的审计，记录更详细的信息
 * @param tags - 审计标签
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @SensitiveOperationAudit(['user-deletion', 'data-export'])
 * async deleteUser(id: string): Promise<void> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function SensitiveOperationAudit(tags: string[] = []): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'comprehensive',
    logRequest: true,
    logResponse: true,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'privateKey'],
    excludeFields: [],
    tags: ['sensitive-operation', ...tags],
  });
}

/**
 * 性能审计装饰器
 *
 * 专门用于性能监控的审计
 *
 * @description 记录方法执行的性能指标，包括执行时间、内存使用等
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @PerformanceAudit()
 * async processLargeDataset(data: any[]): Promise<any[]> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function PerformanceAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'detailed',
    logRequest: false,
    logResponse: false,
    logExecutionTime: true,
    logUserInfo: false,
    logIpAddress: false,
    logUserAgent: false,
    sensitiveFields: [],
    excludeFields: [],
    tags: ['performance-audit'],
  });
}

/**
 * 安全审计装饰器
 *
 * 专门用于安全相关的审计
 *
 * @description 记录安全相关的操作，包括认证、授权、权限变更等
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @SecurityAudit()
 * async changePassword(userId: string, newPassword: string): Promise<void> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function SecurityAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'comprehensive',
    logRequest: true,
    logResponse: false,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'privateKey'],
    excludeFields: [],
    tags: ['security-audit'],
  });
}

/**
 * 数据变更审计装饰器
 *
 * 专门用于数据变更的审计
 *
 * @description 记录数据变更的详细信息，包括变更前后的数据对比
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @DataChangeAudit()
 * async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function DataChangeAudit(): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'comprehensive',
    logRequest: true,
    logResponse: true,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret'],
    excludeFields: ['internalId', 'systemData'],
    tags: ['data-change-audit'],
  });
}

/**
 * 业务操作审计装饰器
 *
 * 专门用于业务操作的审计
 *
 * @description 记录业务操作的详细信息，包括业务上下文和结果
 * @param businessContext - 业务上下文
 * @returns 装饰器函数
 * @example
 * ```typescript
 * @BusinessOperationAudit('user-management')
 * async createUser(userData: CreateUserDto): Promise<User> {
 *   // 方法实现
 * }
 * ```
 * @since 1.0.0
 */
export function BusinessOperationAudit(
  businessContext: string
): MethodDecorator {
  return Audit({
    enabled: true,
    level: 'detailed',
    logRequest: true,
    logResponse: true,
    logExecutionTime: true,
    logUserInfo: true,
    logIpAddress: true,
    logUserAgent: true,
    sensitiveFields: ['password', 'token', 'secret'],
    excludeFields: ['internalId'],
    tags: ['business-operation', businessContext],
  });
}
