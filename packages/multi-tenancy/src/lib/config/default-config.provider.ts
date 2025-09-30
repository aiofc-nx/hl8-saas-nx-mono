/**
 * 默认配置提供者
 *
 * @description 提供多租户模块的默认配置
 * 支持环境变量覆盖和配置验证
 *
 * @fileoverview 默认配置提供者实现
 * @author HL8 Team
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { MultiTenancyConfig } from './multi-tenancy.config';

/**
 * 默认配置提供者
 *
 * @description 提供多租户模块的默认配置值
 * 支持环境变量覆盖和动态配置生成
 */
@Injectable()
export class DefaultConfigProvider {
  /**
   * 获取默认配置
   *
   * @description 提供多租户模块的默认配置
   * 包含所有必需的配置选项和合理的默认值
   *
   * @returns 默认的多租户配置
   */
  getDefaultConfig(): MultiTenancyConfig {
    return {
      context: {
        enableAutoInjection: this.getBooleanEnv('TENANT_AUTO_INJECTION', true),
        contextTimeout: this.getNumberEnv('TENANT_CONTEXT_TIMEOUT', 30000),
        enableAuditLog: this.getBooleanEnv('TENANT_AUDIT_LOG', true),
        contextStorage: this.getEnumEnv('TENANT_CONTEXT_STORAGE', 'memory', [
          'memory',
          'redis',
          'database',
        ]),
        allowCrossTenantAccess: this.getBooleanEnv(
          'TENANT_CROSS_ACCESS',
          false
        ),
      },
      isolation: {
        strategy: this.getEnumEnv('TENANT_ISOLATION_STRATEGY', 'key-prefix', [
          'key-prefix',
          'namespace',
          'database',
          'schema',
        ]),
        keyPrefix: this.getStringEnv('TENANT_KEY_PREFIX', 'tenant:'),
        namespace: this.getStringEnv('TENANT_NAMESPACE', 'tenant-namespace'),
        enableIsolation: this.getBooleanEnv('TENANT_ISOLATION_ENABLED', true),
        level: this.getEnumEnv('TENANT_ISOLATION_LEVEL', 'strict', [
          'strict',
          'relaxed',
          'disabled',
        ]),
      },
      middleware: {
        enableTenantMiddleware: this.getBooleanEnv(
          'TENANT_MIDDLEWARE_ENABLED',
          true
        ),
        tenantHeader: this.getStringEnv('TENANT_HEADER', 'X-Tenant-ID'),
        tenantQueryParam: this.getStringEnv('TENANT_QUERY_PARAM', 'tenant'),
        tenantSubdomain: this.getBooleanEnv('TENANT_SUBDOMAIN', true),
        validationTimeout: this.getNumberEnv('TENANT_VALIDATION_TIMEOUT', 5000),
        strictValidation: this.getBooleanEnv('TENANT_STRICT_VALIDATION', true),
      },
      security: {
        enableSecurityCheck: this.getBooleanEnv(
          'TENANT_SECURITY_ENABLED',
          true
        ),
        maxFailedAttempts: this.getNumberEnv('TENANT_MAX_FAILED_ATTEMPTS', 5),
        lockoutDuration: this.getNumberEnv('TENANT_LOCKOUT_DURATION', 300000),
        enableAuditLog: this.getBooleanEnv('TENANT_SECURITY_AUDIT', true),
        enableIpWhitelist: this.getBooleanEnv(
          'TENANT_IP_WHITELIST_ENABLED',
          false
        ),
        ipWhitelist: this.getArrayEnv('TENANT_IP_WHITELIST', []),
      },
      multiLevel: {
        enableMultiLevelIsolation: this.getBooleanEnv(
          'MULTI_LEVEL_ISOLATION_ENABLED',
          true
        ),
        defaultIsolationLevel: this.getEnumEnv(
          'MULTI_LEVEL_DEFAULT_LEVEL',
          'tenant',
          ['tenant', 'organization', 'department', 'user']
        ),
        keyPrefix: this.getStringEnv('MULTI_LEVEL_KEY_PREFIX', 'multi:'),
        namespacePrefix: this.getStringEnv(
          'MULTI_LEVEL_NAMESPACE_PREFIX',
          'ml_'
        ),
        levels: {
          tenant: {
            strategy: this.getEnumEnv(
              'MULTI_LEVEL_TENANT_STRATEGY',
              'key-prefix',
              ['key-prefix', 'namespace', 'database', 'schema']
            ),
            keyPrefix: this.getStringEnv(
              'MULTI_LEVEL_TENANT_KEY_PREFIX',
              'tenant:'
            ),
            enableIsolation: this.getBooleanEnv(
              'MULTI_LEVEL_TENANT_ISOLATION',
              true
            ),
            maxKeyLength: this.getNumberEnv(
              'MULTI_LEVEL_TENANT_MAX_KEY_LENGTH',
              256
            ),
          },
          organization: {
            strategy: this.getEnumEnv(
              'MULTI_LEVEL_ORG_STRATEGY',
              'key-prefix',
              ['key-prefix', 'namespace', 'database', 'schema']
            ),
            keyPrefix: this.getStringEnv('MULTI_LEVEL_ORG_KEY_PREFIX', 'org:'),
            enableIsolation: this.getBooleanEnv(
              'MULTI_LEVEL_ORG_ISOLATION',
              true
            ),
            maxKeyLength: this.getNumberEnv(
              'MULTI_LEVEL_ORG_MAX_KEY_LENGTH',
              256
            ),
          },
          department: {
            strategy: this.getEnumEnv(
              'MULTI_LEVEL_DEPT_STRATEGY',
              'key-prefix',
              ['key-prefix', 'namespace', 'database', 'schema']
            ),
            keyPrefix: this.getStringEnv(
              'MULTI_LEVEL_DEPT_KEY_PREFIX',
              'dept:'
            ),
            enableIsolation: this.getBooleanEnv(
              'MULTI_LEVEL_DEPT_ISOLATION',
              true
            ),
            maxKeyLength: this.getNumberEnv(
              'MULTI_LEVEL_DEPT_MAX_KEY_LENGTH',
              256
            ),
          },
          user: {
            strategy: this.getEnumEnv(
              'MULTI_LEVEL_USER_STRATEGY',
              'key-prefix',
              ['key-prefix', 'namespace', 'database', 'schema']
            ),
            keyPrefix: this.getStringEnv(
              'MULTI_LEVEL_USER_KEY_PREFIX',
              'user:'
            ),
            enableIsolation: this.getBooleanEnv(
              'MULTI_LEVEL_USER_ISOLATION',
              true
            ),
            maxKeyLength: this.getNumberEnv(
              'MULTI_LEVEL_USER_MAX_KEY_LENGTH',
              256
            ),
          },
        },
        enableHierarchyValidation: this.getBooleanEnv(
          'MULTI_LEVEL_HIERARCHY_VALIDATION',
          true
        ),
        enablePermissionCheck: this.getBooleanEnv(
          'MULTI_LEVEL_PERMISSION_CHECK',
          true
        ),
      },
    };
  }

  /**
   * 获取字符串环境变量
   *
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @returns 环境变量值或默认值
   */
  private getStringEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * 获取数字环境变量
   *
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @returns 环境变量值或默认值
   */
  private getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 获取布尔环境变量
   *
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @returns 环境变量值或默认值
   */
  private getBooleanEnv(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * 获取枚举环境变量
   *
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @param allowedValues 允许的值列表
   * @returns 环境变量值或默认值
   */
  private getEnumEnv<T extends string>(
    key: string,
    defaultValue: T,
    allowedValues: T[]
  ): T {
    const value = process.env[key] as T;
    if (value && allowedValues.includes(value)) {
      return value;
    }
    return defaultValue;
  }

  /**
   * 获取数组环境变量
   *
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @returns 环境变量值或默认值
   */
  private getArrayEnv(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    try {
      return JSON.parse(value);
    } catch {
      // 如果不是JSON格式，按逗号分割
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
}
