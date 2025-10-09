/**
 * 配置验证器
 *
 * @description 提供多租户模块配置的验证功能
 * 确保配置的完整性和有效性
 *
 * @fileoverview 配置验证器实现
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import { MultiTenancyConfig } from './multi-tenancy.config';
import { TenantConfigInvalidException } from '../exceptions';
import {
  ITenantContextConfig,
  ITenantIsolationConfig,
  ITenantMiddlewareConfig,
  ITenantSecurityConfig,
  IMultiLevelIsolationConfig,
} from '../types/tenant-context.types';
import { ILevelIsolationConfig } from '../types/multi-level.types';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
}

/**
 * 配置验证器
 *
 * @description 验证多租户模块配置的有效性
 */
@Injectable()
export class ConfigValidator {
  /**
   * 验证多租户配置
   *
   * @description 验证多租户模块配置的完整性和有效性
   * 使用 class-validator 进行验证，并提供详细的错误信息
   *
   * @param config 多租户配置
   * @returns 验证结果
   */
  async validateConfig(config: MultiTenancyConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 使用 class-validator 进行验证
      const validationErrors = await validate(config);

      if (validationErrors.length > 0) {
        for (const error of validationErrors) {
          if (error.constraints) {
            for (const constraint of Object.values(error.constraints)) {
              errors.push(`${error.property}: ${constraint}`);
            }
          }

          // 处理嵌套对象的验证错误
          if (error.children && error.children.length > 0) {
            this.processNestedErrors(error.children, error.property, errors);
          }
        }
      }

      // 执行自定义业务规则验证
      this.validateBusinessRules(config, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`配置验证失败: ${(error as Error).message}`);
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * 验证配置并抛出异常
   *
   * @description 验证配置，如果验证失败则抛出异常
   *
   * @param config 多租户配置
   * @throws {TenantConfigInvalidException} 配置验证失败时抛出
   */
  async validateConfigAndThrow(config: MultiTenancyConfig): Promise<void> {
    const result = await this.validateConfig(config);

    if (!result.isValid) {
      throw new TenantConfigInvalidException(
        'Multi-tenancy configuration validation failed',
        'The multi-tenancy configuration contains invalid values',
        {
          errors: result.errors,
          warnings: result.warnings,
          configType: 'multi-tenancy',
        }
      );
    }
  }

  /**
   * 处理嵌套验证错误
   *
   * @param children 子验证错误
   * @param parentPath 父级路径
   * @param errors 错误列表
   */
  private processNestedErrors(
    children: Array<{
      constraints?: Record<string, string>;
      property?: string;
      children?: unknown[];
    }>,
    parentPath: string,
    errors: string[]
  ): void {
    for (const child of children) {
      if (child.constraints) {
        for (const constraint of Object.values(child.constraints)) {
          errors.push(`${parentPath}.${child.property}: ${constraint}`);
        }
      }

      if (child.children && child.children.length > 0) {
        this.processNestedErrors(
          child.children as Array<{
            constraints?: Record<string, string>;
            property?: string;
            children?: unknown[];
          }>,
          `${parentPath}.${child.property}`,
          errors
        );
      }
    }
  }

  /**
   * 验证业务规则
   *
   * @description 验证配置的业务逻辑规则
   *
   * @param config 多租户配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateBusinessRules(
    config: MultiTenancyConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证上下文配置
    this.validateContextConfig(config.context, errors, warnings);

    // 验证隔离配置
    this.validateIsolationConfig(config.isolation, errors, warnings);

    // 验证中间件配置
    this.validateMiddlewareConfig(config.middleware, errors, warnings);

    // 验证安全配置
    this.validateSecurityConfig(config.security, errors, warnings);

    // 验证多层级配置
    if (config.multiLevel) {
      this.validateMultiLevelConfig(config.multiLevel, errors, warnings);
    }
  }

  /**
   * 验证上下文配置
   *
   * @param contextConfig 上下文配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateContextConfig(
    contextConfig: ITenantContextConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证超时时间
    if (contextConfig.contextTimeout < 1000) {
      warnings.push(
        'Context timeout is very short, consider increasing it for production'
      );
    }

    if (contextConfig.contextTimeout > 300000) {
      warnings.push(
        'Context timeout is very long, consider reducing it for better performance'
      );
    }

    // 验证存储方式
    if (
      contextConfig.contextStorage === 'database' &&
      !contextConfig.enableAuditLog
    ) {
      warnings.push(
        'Database storage is enabled but audit log is disabled, consider enabling it'
      );
    }
  }

  /**
   * 验证隔离配置
   *
   * @param isolationConfig 隔离配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateIsolationConfig(
    isolationConfig: ITenantIsolationConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证键前缀
    if (
      isolationConfig.strategy === 'key-prefix' &&
      !isolationConfig.keyPrefix
    ) {
      errors.push(
        'Key prefix is required when using key-prefix isolation strategy'
      );
    }

    // 验证命名空间
    if (
      isolationConfig.strategy === 'namespace' &&
      !isolationConfig.namespace
    ) {
      errors.push(
        'Namespace is required when using namespace isolation strategy'
      );
    }

    // 验证隔离级别
    if (
      isolationConfig.enableIsolation &&
      isolationConfig.level === 'disabled'
    ) {
      warnings.push(
        'Isolation is enabled but level is disabled, this may cause unexpected behavior'
      );
    }
  }

  /**
   * 验证中间件配置
   *
   * @param middlewareConfig 中间件配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateMiddlewareConfig(
    middlewareConfig: ITenantMiddlewareConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证超时时间
    if (middlewareConfig.validationTimeout < 1000) {
      warnings.push(
        'Validation timeout is very short, may cause timeouts in production'
      );
    }

    // 验证请求头名称
    if (middlewareConfig.tenantHeader.length < 3) {
      warnings.push(
        'Tenant header name is very short, consider using a more descriptive name'
      );
    }
  }

  /**
   * 验证安全配置
   *
   * @param securityConfig 安全配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateSecurityConfig(
    securityConfig: ITenantSecurityConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证失败尝试次数
    if (securityConfig.maxFailedAttempts < 3) {
      warnings.push(
        'Max failed attempts is very low, may cause legitimate users to be locked out'
      );
    }

    if (securityConfig.maxFailedAttempts > 20) {
      warnings.push(
        'Max failed attempts is very high, may allow brute force attacks'
      );
    }

    // 验证锁定时间
    if (securityConfig.lockoutDuration < 60000) {
      warnings.push(
        'Lockout duration is very short, may not effectively prevent attacks'
      );
    }

    // 验证IP白名单
    if (
      securityConfig.enableIpWhitelist &&
      (!securityConfig.ipWhitelist || securityConfig.ipWhitelist.length === 0)
    ) {
      warnings.push('IP whitelist is enabled but no IPs are configured');
    }
  }

  /**
   * 验证多层级配置
   *
   * @param multiLevelConfig 多层级配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateMultiLevelConfig(
    multiLevelConfig: IMultiLevelIsolationConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证默认隔离级别
    if (
      !multiLevelConfig.enableMultiLevelIsolation &&
      multiLevelConfig.defaultIsolationLevel !== 'tenant'
    ) {
      warnings.push(
        'Multi-level isolation is disabled but default level is not tenant'
      );
    }

    // 验证各级别配置
    const levels: Array<keyof typeof multiLevelConfig.levels> = [
      'tenant',
      'organization',
      'department',
      'user',
    ];
    for (const level of levels) {
      const levelConfig = multiLevelConfig.levels[level];
      if (levelConfig) {
        this.validateLevelConfig(level, levelConfig, errors, warnings);
      }
    }
  }

  /**
   * 验证单个级别配置
   *
   * @param level 级别名称
   * @param levelConfig 级别配置
   * @param errors 错误列表
   * @param warnings 警告列表
   */
  private validateLevelConfig(
    level: string,
    levelConfig: ILevelIsolationConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // 验证策略和参数匹配
    if (levelConfig.strategy === 'key-prefix' && !levelConfig.keyPrefix) {
      errors.push(
        `${level} level: Key prefix is required when using key-prefix strategy`
      );
    }

    if (levelConfig.strategy === 'namespace' && !levelConfig.namespace) {
      errors.push(
        `${level} level: Namespace is required when using namespace strategy`
      );
    }

    // 验证键长度
    if (levelConfig.maxKeyLength && levelConfig.maxKeyLength < 10) {
      warnings.push(
        `${level} level: Max key length is very short, may cause collisions`
      );
    }
  }
}
