/**
 * SAAS Core 配置类
 *
 * @description 完全类型安全的 SAAS Core 配置定义
 *
 * ## 配置结构
 * - database: 数据库配置
 * - redis: Redis 配置
 * - cache: 缓存策略配置
 * - multiTenancy: 多租户配置
 * - eventStore: 事件存储配置
 *
 * @class SaasCoreConfig
 * @since 1.0.0
 */

import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

/**
 * 数据库配置
 */
export class DatabaseConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(65535)
  public readonly port!: number;

  @IsString()
  public readonly name!: string;

  @IsString()
  public readonly username!: string;

  @IsString()
  public readonly password!: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly ssl?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly debug?: boolean;
}

/**
 * Redis 配置
 */
export class RedisConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(65535)
  public readonly port!: number;

  @IsString()
  @IsOptional()
  public readonly password?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(15)
  @IsOptional()
  public readonly db?: number;
}

/**
 * 缓存配置
 */
export class CacheConfig {
  @IsNumber()
  @Type(() => Number)
  @Min(60)
  @IsOptional()
  public readonly defaultTTL?: number;

  @IsString()
  @IsOptional()
  public readonly keyPrefix?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly enableTenantIsolation?: boolean;
}

/**
 * 事件存储配置
 */
export class EventStoreConfig {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  public readonly snapshotInterval?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  public readonly retainCount?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly enableCompression?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly enableCache?: boolean;
}

/**
 * SAAS Core 根配置
 */
export class SaasCoreConfig {
  @ValidateNested()
  @Type(() => DatabaseConfig)
  public readonly database!: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  public readonly redis!: RedisConfig;

  @ValidateNested()
  @Type(() => CacheConfig)
  @IsOptional()
  public readonly cache?: CacheConfig;

  @ValidateNested()
  @Type(() => EventStoreConfig)
  @IsOptional()
  public readonly eventStore?: EventStoreConfig;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly isGlobal?: boolean;
}

