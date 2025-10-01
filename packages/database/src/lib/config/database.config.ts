/**
 * 数据库配置类
 *
 * @description 定义数据库模块的类型安全配置
 * 使用 class-validator 进行配置验证
 *
 * @fileoverview 数据库配置类定义文件
 * @since 1.0.0
 */

import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ISOLATION_STRATEGIES, DATABASE_DEFAULTS } from '../constants';

/**
 * PostgreSQL 配置类
 *
 * @description PostgreSQL 数据库的连接配置
 *
 * ## 业务规则
 *
 * - 主机地址和数据库名称为必填项
 * - 端口号必须在有效范围内（1-65535）
 * - 连接池大小必须合理（1-100）
 */
export class PostgreSQLConfig {
  /**
   * 数据库主机地址
   */
  @IsString()
  @IsNotEmpty()
  public readonly host!: string;

  /**
   * 数据库端口
   */
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  public readonly port!: number;

  /**
   * 用户名
   */
  @IsString()
  @IsNotEmpty()
  public readonly username!: string;

  /**
   * 密码
   */
  @IsString()
  @IsNotEmpty()
  public readonly password!: string;

  /**
   * 数据库名称
   */
  @IsString()
  @IsNotEmpty()
  public readonly database!: string;

  /**
   * 是否启用 SSL
   */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  public readonly ssl?: boolean = false;

  /**
   * 连接池大小
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  public readonly poolSize?: number = DATABASE_DEFAULTS.POOL_MAX;
}

/**
 * MongoDB 配置类
 *
 * @description MongoDB 数据库的连接配置
 */
export class MongoDBConfig {
  /**
   * MongoDB 连接 URI
   */
  @IsString()
  @IsNotEmpty()
  public readonly uri!: string;

  /**
   * 数据库名称
   */
  @IsString()
  @IsNotEmpty()
  public readonly database!: string;

  /**
   * 最小连接池大小
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  public readonly minPoolSize?: number = DATABASE_DEFAULTS.POOL_MIN;

  /**
   * 最大连接池大小
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  public readonly maxPoolSize?: number = DATABASE_DEFAULTS.POOL_MAX;
}

/**
 * 租户配置类
 *
 * @description 多租户功能的配置
 */
export class TenantDatabaseConfig {
  /**
   * 是否启用租户隔离
   */
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableIsolation!: boolean;

  /**
   * 租户隔离策略
   */
  @IsEnum(ISOLATION_STRATEGIES)
  public readonly isolationStrategy!: keyof typeof ISOLATION_STRATEGIES;

  /**
   * 租户数据库前缀
   */
  @IsString()
  @IsNotEmpty()
  public readonly tenantDatabasePrefix!: string;

  /**
   * 是否自动创建租户数据库
   */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  public readonly autoCreateTenantDb?: boolean = false;

  /**
   * 是否自动迁移租户数据库
   */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  public readonly autoMigrateTenant?: boolean = false;

  /**
   * 每个租户的最大连接数
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  public readonly maxConnectionsPerTenant?: number =
    DATABASE_DEFAULTS.TENANT_CONNECTION_LIMIT;

  /**
   * 最大租户数量
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  public readonly maxTenants?: number = DATABASE_DEFAULTS.MAX_TENANTS;
}

/**
 * 迁移配置类
 *
 * @description 数据库迁移的配置
 */
export class MigrationDatabaseConfig {
  /**
   * 是否启用自动迁移
   */
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableAutoMigration!: boolean;

  /**
   * 迁移文件路径
   */
  @IsString()
  @IsNotEmpty()
  public readonly migrationPath!: string;

  /**
   * 租户迁移文件路径
   */
  @IsString()
  @IsOptional()
  public readonly tenantMigrationPath?: string;

  /**
   * 是否在启动时运行迁移
   */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  public readonly runMigrationsOnStartup?: boolean = false;
}

/**
 * 监控配置类
 *
 * @description 数据库监控的配置
 */
export class MonitoringDatabaseConfig {
  /**
   * 是否启用统计功能
   */
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableStats!: boolean;

  /**
   * 是否启用健康检查
   */
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableHealthCheck!: boolean;

  /**
   * 统计信息收集间隔（毫秒）
   */
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  public readonly statsInterval!: number;

  /**
   * 慢查询阈值（毫秒）
   */
  @IsNumber()
  @Min(100)
  @Type(() => Number)
  public readonly slowQueryThreshold!: number;
}

/**
 * 数据库根配置类
 *
 * @description 数据库模块的完整配置
 * 包含 PostgreSQL、MongoDB、租户、迁移、监控等所有配置
 *
 * ## 业务规则
 *
 * - 必须配置至少一种数据库（PostgreSQL 或 MongoDB）
 * - 租户隔离策略必须明确指定
 * - 自动迁移在生产环境应谨慎启用
 * - 监控功能建议在生产环境启用
 *
 * @example
 * ```typescript
 * // .env 文件
 * DB_POSTGRES_HOST=localhost
 * DB_POSTGRES_PORT=5432
 * DB_POSTGRES_USERNAME=postgres
 * DB_POSTGRES_PASSWORD=password
 * DB_POSTGRES_DATABASE=hl8_saas
 * DB_TENANT_ENABLE_ISOLATION=true
 * DB_TENANT_ISOLATION_STRATEGY=database
 * DB_TENANT_DATABASE_PREFIX=hl8_tenant_
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseConfig {
  /**
   * PostgreSQL 配置
   */
  @ValidateNested()
  @Type(() => PostgreSQLConfig)
  public readonly postgres!: PostgreSQLConfig;

  /**
   * MongoDB 配置（可选）
   */
  @ValidateNested()
  @IsOptional()
  @Type(() => MongoDBConfig)
  public readonly mongodb?: MongoDBConfig;

  /**
   * 租户配置
   */
  @ValidateNested()
  @Type(() => TenantDatabaseConfig)
  public readonly tenant!: TenantDatabaseConfig;

  /**
   * 迁移配置
   */
  @ValidateNested()
  @Type(() => MigrationDatabaseConfig)
  public readonly migration!: MigrationDatabaseConfig;

  /**
   * 监控配置
   */
  @ValidateNested()
  @Type(() => MonitoringDatabaseConfig)
  public readonly monitoring!: MonitoringDatabaseConfig;
}
