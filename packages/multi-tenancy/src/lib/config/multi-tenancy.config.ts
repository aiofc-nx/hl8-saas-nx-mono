/**
 * 多租户配置类
 *
 * @description 使用 @hl8/config 模块提供类型安全的配置管理
 * 支持环境变量、配置文件加载和配置验证
 *
 * @fileoverview 多租户配置类实现
 * @author HL8 Team
 * @since 1.0.0
 */

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

/**
 * 租户上下文配置类
 *
 * @description 租户上下文管理的配置选项
 */
export class TenantContextConfig {
  /**
   * 是否启用自动注入
   *
   * @description 是否自动注入租户上下文到请求中
   */
  @IsBoolean()
  public readonly enableAutoInjection!: boolean;

  /**
   * 上下文超时时间（毫秒）
   *
   * @description 租户上下文的超时时间
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1000)
  @Max(300000)
  public readonly contextTimeout!: number;

  /**
   * 是否启用审计日志
   *
   * @description 是否记录租户上下文操作的审计日志
   */
  @IsBoolean()
  public readonly enableAuditLog!: boolean;

  /**
   * 上下文存储方式
   *
   * @description 租户上下文的存储方式
   */
  @IsEnum(['memory', 'redis', 'database'])
  public readonly contextStorage!: 'memory' | 'redis' | 'database';

  /**
   * 是否允许跨租户访问
   *
   * @description 是否允许跨租户的数据访问
   */
  @IsBoolean()
  public readonly allowCrossTenantAccess!: boolean;
}

/**
 * 租户隔离配置类
 *
 * @description 租户数据隔离的配置选项
 */
export class TenantIsolationConfig {
  /**
   * 隔离策略
   *
   * @description 数据隔离的策略类型
   */
  @IsEnum(['key-prefix', 'namespace', 'database', 'schema'])
  public readonly strategy!: 'key-prefix' | 'namespace' | 'database' | 'schema';

  /**
   * 键前缀
   *
   * @description 隔离键的前缀
   */
  @IsOptional()
  @IsString()
  public readonly keyPrefix?: string;

  /**
   * 命名空间
   *
   * @description 隔离命名空间
   */
  @IsOptional()
  @IsString()
  public readonly namespace?: string;

  /**
   * 是否启用隔离
   *
   * @description 是否启用数据隔离功能
   */
  @IsBoolean()
  public readonly enableIsolation!: boolean;

  /**
   * 隔离级别
   *
   * @description 数据隔离的严格程度
   */
  @IsEnum(['strict', 'relaxed', 'disabled'])
  public readonly level!: 'strict' | 'relaxed' | 'disabled';
}

/**
 * 租户中间件配置类
 *
 * @description 租户中间件的配置选项
 */
export class TenantMiddlewareConfig {
  /**
   * 是否启用租户中间件
   *
   * @description 是否启用租户ID提取中间件
   */
  @IsBoolean()
  public readonly enableTenantMiddleware!: boolean;

  /**
   * 租户ID请求头名称
   *
   * @description HTTP请求头中租户ID的字段名
   */
  @IsString()
  public readonly tenantHeader!: string;

  /**
   * 租户ID查询参数名称
   *
   * @description URL查询参数中租户ID的字段名
   */
  @IsString()
  public readonly tenantQueryParam!: string;

  /**
   * 是否支持子域名提取
   *
   * @description 是否支持从子域名提取租户ID
   */
  @IsBoolean()
  public readonly tenantSubdomain!: boolean;

  /**
   * 验证超时时间（毫秒）
   *
   * @description 租户验证的超时时间
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1000)
  @Max(60000)
  public readonly validationTimeout!: number;

  /**
   * 是否启用严格验证
   *
   * @description 是否启用严格的租户验证
   */
  @IsBoolean()
  public readonly strictValidation!: boolean;
}

/**
 * 租户安全配置类
 *
 * @description 租户安全相关的配置选项
 */
export class TenantSecurityConfig {
  /**
   * 是否启用安全检查
   *
   * @description 是否启用租户安全检查和验证
   */
  @IsBoolean()
  public readonly enableSecurityCheck!: boolean;

  /**
   * 最大失败尝试次数
   *
   * @description 允许的最大失败尝试次数
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  public readonly maxFailedAttempts!: number;

  /**
   * 锁定持续时间（毫秒）
   *
   * @description 账户锁定后的持续时间
   */
  @IsNumber()
  @Type(() => Number)
  @Min(60000)
  @Max(86400000)
  public readonly lockoutDuration!: number;

  /**
   * 是否启用审计日志
   *
   * @description 是否记录安全相关的审计日志
   */
  @IsBoolean()
  public readonly enableAuditLog!: boolean;

  /**
   * 是否启用IP白名单
   *
   * @description 是否启用IP白名单功能
   */
  @IsBoolean()
  public readonly enableIpWhitelist!: boolean;

  /**
   * IP白名单
   *
   * @description 允许访问的IP地址列表
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public readonly ipWhitelist?: string[];
}

/**
 * 级别隔离配置类
 *
 * @description 单个级别的隔离配置
 */
export class LevelIsolationConfig {
  /**
   * 隔离策略
   *
   * @description 该级别的隔离策略
   */
  @IsEnum(['key-prefix', 'namespace', 'database', 'schema'])
  public readonly strategy!: 'key-prefix' | 'namespace' | 'database' | 'schema';

  /**
   * 键前缀
   *
   * @description 该级别的键前缀
   */
  @IsOptional()
  @IsString()
  public readonly keyPrefix?: string;

  /**
   * 命名空间
   *
   * @description 该级别的命名空间
   */
  @IsOptional()
  @IsString()
  public readonly namespace?: string;

  /**
   * 数据库名称
   *
   * @description 该级别的数据库名称（database策略）
   */
  @IsOptional()
  @IsString()
  public readonly database?: string;

  /**
   * 是否启用隔离
   *
   * @description 是否启用该级别的隔离
   */
  @IsBoolean()
  public readonly enableIsolation!: boolean;

  /**
   * 最大键长度
   *
   * @description 该级别隔离键的最大长度
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(1000)
  public readonly maxKeyLength?: number;
}

/**
 * 多层级隔离配置类
 *
 * @description 多层级数据隔离的配置选项
 */
export class MultiLevelIsolationConfig {
  /**
   * 是否启用多层级隔离
   *
   * @description 是否启用多层级数据隔离功能
   */
  @IsBoolean()
  public readonly enableMultiLevelIsolation!: boolean;

  /**
   * 默认隔离级别
   *
   * @description 默认的数据隔离级别
   */
  @IsEnum(['tenant', 'organization', 'department', 'user'])
  public readonly defaultIsolationLevel!:
    | 'tenant'
    | 'organization'
    | 'department'
    | 'user';

  /**
   * 键前缀
   *
   * @description 多层级隔离的键前缀
   */
  @IsOptional()
  @IsString()
  public readonly keyPrefix?: string;

  /**
   * 命名空间前缀
   *
   * @description 多层级隔离的命名空间前缀
   */
  @IsOptional()
  @IsString()
  public readonly namespacePrefix?: string;

  /**
   * 各级别配置
   *
   * @description 各个隔离级别的详细配置
   */
  @ValidateNested()
  @Type(() => LevelIsolationConfig)
  public readonly levels!: {
    tenant: LevelIsolationConfig;
    organization: LevelIsolationConfig;
    department: LevelIsolationConfig;
    user: LevelIsolationConfig;
  };

  /**
   * 是否启用层级验证
   *
   * @description 是否启用层级关系的验证
   */
  @IsBoolean()
  public readonly enableHierarchyValidation!: boolean;

  /**
   * 是否启用权限检查
   *
   * @description 是否启用权限检查功能
   */
  @IsBoolean()
  public readonly enablePermissionCheck!: boolean;
}

/**
 * 多租户模块配置类
 *
 * @description 多租户模块的整体配置
 */
export class MultiTenancyConfig {
  /**
   * 租户上下文配置
   *
   * @description 租户上下文管理的配置
   */
  @ValidateNested()
  @Type(() => TenantContextConfig)
  public readonly context!: TenantContextConfig;

  /**
   * 租户隔离配置
   *
   * @description 租户数据隔离的配置
   */
  @ValidateNested()
  @Type(() => TenantIsolationConfig)
  public readonly isolation!: TenantIsolationConfig;

  /**
   * 租户中间件配置
   *
   * @description 租户中间件的配置
   */
  @ValidateNested()
  @Type(() => TenantMiddlewareConfig)
  public readonly middleware!: TenantMiddlewareConfig;

  /**
   * 租户安全配置
   *
   * @description 租户安全相关的配置
   */
  @ValidateNested()
  @Type(() => TenantSecurityConfig)
  public readonly security!: TenantSecurityConfig;

  /**
   * 多层级隔离配置
   *
   * @description 多层级数据隔离的配置（可选）
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLevelIsolationConfig)
  public readonly multiLevel?: MultiLevelIsolationConfig;
}
