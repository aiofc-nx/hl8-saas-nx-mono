/**
 * 缓存控制装饰器
 *
 * @description 为控制器方法提供缓存控制功能
 * 支持HTTP缓存、应用缓存、查询缓存等多种缓存策略
 *
 * ## 业务规则
 *
 * ### 缓存策略规则
 * - 支持基于HTTP头的缓存控制
 * - 支持基于用户、租户的缓存隔离
 * - 支持缓存失效和更新策略
 *
 * ### 缓存安全规则
 * - 敏感数据不缓存或使用短期缓存
 * - 支持缓存加密和签名验证
 * - 支持缓存访问权限控制
 *
 * ### 缓存性能规则
 * - 支持缓存预热和预加载
 * - 支持缓存压缩和优化
 * - 支持缓存统计和监控
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @CacheTTL(300) // 5分钟缓存
 *   @CacheKey('users:list')
 *   async getUsers(): Promise<UserResponseDto[]> {
 *     // 缓存5分钟
 *   }
 *
 *   @Get(':id')
 *   @CacheTTL(1800) // 30分钟缓存
 *   @CacheKey('user:profile')
 *   @CacheByUser()
 *   async getUser(@Param('id') id: string): Promise<UserResponseDto> {
 *     // 基于用户缓存30分钟
 *   }
 *
 *   @Post()
 *   @InvalidateCache(['users:list', 'users:count'])
 *   async createUser(): Promise<UserResponseDto> {
 *     // 创建后失效相关缓存
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * 缓存控制元数据键
 */
export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_KEY_KEY = 'cache_key';
export const CACHE_STRATEGY_KEY = 'cache_strategy';
export const CACHE_INVALIDATION_KEY = 'cache_invalidation';
export const CACHE_CONDITION_KEY = 'cache_condition';

/**
 * 缓存策略类型
 */
export type CacheStrategy = 'memory' | 'redis' | 'http' | 'hybrid';

/**
 * 缓存条件接口
 */
export interface CacheCondition {
  condition: (context: unknown) => boolean;
  ttl?: number;
  strategy?: CacheStrategy;
}

/**
 * 缓存TTL装饰器
 *
 * @description 设置缓存生存时间
 *
 * @param ttl - 缓存时间（秒）
 * @returns 装饰器
 */
export function CacheTTL(ttl: number): MethodDecorator {
  return SetMetadata(CACHE_TTL_KEY, ttl);
}

/**
 * 缓存键装饰器
 *
 * @description 设置缓存键名
 *
 * @param key - 缓存键名
 * @param dynamic - 是否支持动态键名
 * @returns 装饰器
 */
export function CacheKey(key: string, dynamic = false): MethodDecorator {
  return SetMetadata(CACHE_KEY_KEY, { key, dynamic });
}

/**
 * 缓存策略装饰器
 *
 * @description 设置缓存策略
 *
 * @param strategy - 缓存策略
 * @returns 装饰器
 */
export function CacheStrategy(strategy: CacheStrategy): MethodDecorator {
  return SetMetadata(CACHE_STRATEGY_KEY, strategy);
}

/**
 * 基于用户缓存装饰器
 *
 * @description 基于用户ID进行缓存隔离
 *
 * @param ttl - 缓存时间（秒）
 * @returns 装饰器
 */
export function CacheByUser(ttl?: number): MethodDecorator {
  return applyDecorators(
    SetMetadata('cache_by_user', true),
    ...(ttl ? [CacheTTL(ttl)] : [])
  );
}

/**
 * 基于租户缓存装饰器
 *
 * @description 基于租户ID进行缓存隔离
 *
 * @param ttl - 缓存时间（秒）
 * @returns 装饰器
 */
export function CacheByTenant(ttl?: number): MethodDecorator {
  return applyDecorators(
    SetMetadata('cache_by_tenant', true),
    ...(ttl ? [CacheTTL(ttl)] : [])
  );
}

/**
 * 缓存条件装饰器
 *
 * @description 基于条件决定是否缓存
 *
 * @param condition - 缓存条件
 * @param ttl - 缓存时间（秒）
 * @returns 装饰器
 */
export function CacheIf(
  condition: (context: unknown) => boolean,
  ttl: number
): MethodDecorator {
  return SetMetadata(CACHE_CONDITION_KEY, { condition, ttl });
}

/**
 * 缓存失效装饰器
 *
 * @description 指定需要失效的缓存键
 *
 * @param keys - 缓存键列表
 * @param pattern - 缓存键模式
 * @returns 装饰器
 */
export function InvalidateCache(
  keys?: string[],
  pattern?: string
): MethodDecorator {
  return SetMetadata(CACHE_INVALIDATION_KEY, { keys, pattern });
}

/**
 * 缓存预热装饰器
 *
 * @description 在应用启动时预热缓存
 *
 * @param priority - 预热优先级
 * @returns 装饰器
 */
export function CacheWarmup(priority = 0): MethodDecorator {
  return SetMetadata('cache_warmup', { priority });
}

/**
 * 缓存压缩装饰器
 *
 * @description 启用缓存数据压缩
 *
 * @param algorithm - 压缩算法
 * @returns 装饰器
 */
export function CacheCompression(
  algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'
): MethodDecorator {
  return SetMetadata('cache_compression', { algorithm });
}

/**
 * 缓存加密装饰器
 *
 * @description 启用缓存数据加密
 *
 * @param algorithm - 加密算法
 * @param key - 加密密钥
 * @returns 装饰器
 */
export function CacheEncryption(
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' = 'aes-256-gcm',
  key?: string
): MethodDecorator {
  return SetMetadata('cache_encryption', { algorithm, key });
}

/**
 * 缓存监控装饰器
 *
 * @description 启用缓存监控和统计
 *
 * @param metrics - 是否记录指标
 * @returns 装饰器
 */
export function CacheMonitoring(metrics = true): MethodDecorator {
  return SetMetadata('cache_monitoring', { metrics });
}

/**
 * HTTP缓存装饰器
 *
 * @description 设置HTTP缓存头
 *
 * @param maxAge - 最大缓存时间（秒）
 * @param etag - 是否启用ETag
 * @param lastModified - 是否启用Last-Modified
 * @returns 装饰器
 */
export function HttpCache(
  maxAge: number,
  etag = true,
  lastModified = true
): MethodDecorator {
  return SetMetadata('http_cache', {
    maxAge,
    etag,
    lastModified,
  });
}

/**
 * 组合缓存装饰器
 *
 * @description 组合多个缓存相关装饰器
 *
 * @param config - 缓存配置
 * @returns 装饰器
 */
export function CacheControl(config: {
  ttl?: number;
  key?: string;
  strategy?: CacheStrategy;
  byUser?: boolean;
  byTenant?: boolean;
  condition?: (context: unknown) => boolean;
  invalidation?: string[];
  warmup?: boolean;
  compression?: boolean;
  encryption?: boolean;
  monitoring?: boolean;
  httpCache?: {
    maxAge: number;
    etag?: boolean;
    lastModified?: boolean;
  };
}): MethodDecorator {
  const decorators: MethodDecorator[] = [];

  if (config.ttl) {
    decorators.push(CacheTTL(config.ttl));
  }

  if (config.key) {
    decorators.push(CacheKey(config.key));
  }

  if (config.strategy) {
    decorators.push(CacheStrategy(config.strategy));
  }

  if (config.byUser) {
    decorators.push(CacheByUser(config.ttl));
  }

  if (config.byTenant) {
    decorators.push(CacheByTenant(config.ttl));
  }

  if (config.condition) {
    decorators.push(CacheIf(config.condition, config.ttl || 300));
  }

  if (config.invalidation) {
    decorators.push(InvalidateCache(config.invalidation));
  }

  if (config.warmup) {
    decorators.push(CacheWarmup());
  }

  if (config.compression) {
    decorators.push(CacheCompression());
  }

  if (config.encryption) {
    decorators.push(CacheEncryption());
  }

  if (config.monitoring) {
    decorators.push(CacheMonitoring());
  }

  if (config.httpCache) {
    decorators.push(
      HttpCache(
        config.httpCache.maxAge,
        config.httpCache.etag,
        config.httpCache.lastModified
      )
    );
  }

  return applyDecorators(...decorators);
}
