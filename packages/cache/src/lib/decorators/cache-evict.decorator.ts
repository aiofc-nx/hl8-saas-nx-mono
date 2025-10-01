/**
 * 缓存清除装饰器
 *
 * @description 提供声明式的缓存清除功能，自动处理租户上下文
 * 支持按键、按模式、按条件清除缓存
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';
import { DECORATOR_METADATA } from '../constants';

/**
 * 缓存清除选项
 */
export interface CacheEvictOptions {
  /** 是否在方法执行前清除缓存 */
  beforeInvocation?: boolean;

  /** 是否清除所有匹配的缓存 */
  allEntries?: boolean;

  /** 缓存键生成器 */
  keyGenerator?: (args: any[]) => string;

  /** 缓存键模式 */
  keyPattern?: string;

  /** 清除条件 */
  condition?: (args: any[], result?: any) => boolean;
}

/**
 * 缓存清除装饰器
 *
 * @description 自动清除缓存，支持租户上下文
 *
 * @param keyPrefix 缓存键前缀
 * @param options 清除选项
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @CacheEvict('user')
 *   async updateUser(userId: string, userData: any): Promise<void> {
 *     await this.userRepository.update(userId, userData);
 *   }
 *
 *   @CacheEvict('user', {
 *     beforeInvocation: true,
 *     allEntries: false
 *   })
 *   async deleteUser(userId: string): Promise<void> {
 *     await this.userRepository.delete(userId);
 *   }
 *
 *   @CacheEvict('user:profile', {
 *     keyPattern: 'user:*',
 *     condition: (args, result) => result.success
 *   })
 *   async updateUserProfile(userId: string, profileData: any): Promise<boolean> {
 *     return await this.userRepository.updateProfile(userId, profileData);
 *   }
 * }
 * ```
 */
export function CacheEvict(keyPrefix: string, options?: CacheEvictOptions) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const originalMethod = method;

    descriptor.value = async function (...args: any[]) {
      // 获取缓存服务实例
      const cacheService = (this as any).cacheService;
      if (!cacheService) {
        console.warn(
          'CacheService not found, executing method without cache eviction'
        );
        return originalMethod.apply(this, args);
      }

      let result: any;

      // 在方法执行前清除缓存
      if (options?.beforeInvocation) {
        await evictCache(cacheService, keyPrefix, args, options);
      }

      try {
        // 执行原方法
        result = await originalMethod.apply(this, args);
      } catch (error) {
        console.error(
          `Method execution failed for ${target.constructor.name}.${propertyName}`,
          error
        );
        throw error;
      }

      // 在方法执行后清除缓存
      if (!options?.beforeInvocation) {
        // 检查清除条件
        if (!options?.condition || options.condition(args, result)) {
          await evictCache(cacheService, keyPrefix, args, options);
        }
      }

      return result;
    };

    // 设置元数据
    SetMetadata(DECORATOR_METADATA.CACHE_EVICT, {
      keyPrefix,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
}

/**
 * 清除缓存
 *
 * @description 根据配置清除指定的缓存
 */
async function evictCache(
  cacheService: any,
  keyPrefix: string,
  args: any[],
  options?: CacheEvictOptions
): Promise<void> {
  try {
    if (options?.allEntries) {
      // 清除所有匹配的缓存
      const pattern = options.keyPattern || `${keyPrefix}:*`;
      const keys = await cacheService.keys(pattern);

      if (keys.length > 0) {
        await cacheService.mdelete(keys);
        console.log(
          `Evicted ${keys.length} cache entries matching pattern: ${pattern}`
        );
      }
    } else {
      // 清除特定缓存
      const cacheKey = generateCacheKey(keyPrefix, args, options?.keyGenerator);
      await cacheService.delete(cacheKey);
      console.log(`Evicted cache entry: ${cacheKey}`);
    }
  } catch (error) {
    console.warn('Cache eviction failed', error);
  }
}

/**
 * 生成缓存键
 *
 * @description 根据前缀、参数和键生成器生成缓存键
 */
function generateCacheKey(
  keyPrefix: string,
  args: any[],
  keyGenerator?: (args: any[]) => string
): string {
  if (keyGenerator) {
    return `${keyPrefix}:${keyGenerator(args)}`;
  }

  // 默认键生成：基于参数序列化
  const argsKey =
    args.length > 0
      ? JSON.stringify(
          args.map((arg) =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          )
        )
      : 'no-args';

  return `${keyPrefix}:${argsKey}`;
}

/**
 * 缓存清除条件辅助函数
 *
 * @description 提供常用的缓存清除条件判断
 */
export const EvictConditions = {
  /**
   * 总是清除
   */
  always: () => true,

  /**
   * 从不清除
   */
  never: () => false,

  /**
   * 基于结果成功状态清除
   */
  onSuccess: (args: any[], result?: any) =>
    result !== undefined && result !== null && result !== false,

  /**
   * 基于结果错误状态清除
   */
  onError: (args: any[], result?: any) =>
    result && typeof result === 'object' && 'error' in result,

  /**
   * 基于参数条件清除
   */
  whenArgs: (predicate: (args: any[]) => boolean) => (args: any[]) =>
    predicate(args),

  /**
   * 基于结果条件清除
   */
  whenResult:
    (predicate: (result: any) => boolean) => (args: any[], result?: any) =>
      result !== undefined && predicate(result),

  /**
   * 基于参数和结果条件清除
   */
  when: (predicate: (args: any[], result?: any) => boolean) => predicate,
};

/**
 * 缓存键模式辅助函数
 *
 * @description 提供常用的缓存键模式
 */
export const KeyPatterns = {
  /**
   * 匹配所有键
   */
  all: () => '*',

  /**
   * 匹配特定前缀的所有键
   */
  prefix: (prefix: string) => `${prefix}:*`,

  /**
   * 匹配特定后缀的所有键
   */
  suffix: (suffix: string) => `*:${suffix}`,

  /**
   * 匹配特定模式的键
   */
  pattern: (pattern: string) => pattern,

  /**
   * 匹配多个前缀的键
   */
  multiplePrefixes: (prefixes: string[]) =>
    prefixes.map((prefix) => `${prefix}:*`).join('|'),

  /**
   * 匹配租户相关的键
   */
  tenantRelated: (tenantId?: string) =>
    tenantId ? `*:tenant:${tenantId}:*` : '*:tenant:*',
};

/**
 * 批量缓存清除装饰器
 *
 * @description 清除多个缓存键或模式
 *
 * @param keyPrefixes 缓存键前缀数组
 * @param options 清除选项
 */
export function CacheEvictMultiple(
  keyPrefixes: string[],
  options?: CacheEvictOptions
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const originalMethod = method;

    descriptor.value = async function (...args: any[]) {
      // 获取缓存服务实例
      const cacheService = (this as any).cacheService;
      if (!cacheService) {
        console.warn(
          'CacheService not found, executing method without cache eviction'
        );
        return originalMethod.apply(this, args);
      }

      let result: any;

      // 在方法执行前清除缓存
      if (options?.beforeInvocation) {
        await evictMultipleCache(cacheService, keyPrefixes, args, options);
      }

      try {
        // 执行原方法
        result = await originalMethod.apply(this, args);
      } catch (error) {
        console.error(
          `Method execution failed for ${target.constructor.name}.${propertyName}`,
          error
        );
        throw error;
      }

      // 在方法执行后清除缓存
      if (!options?.beforeInvocation) {
        // 检查清除条件
        if (!options?.condition || options.condition(args, result)) {
          await evictMultipleCache(cacheService, keyPrefixes, args, options);
        }
      }

      return result;
    };

    // 设置元数据
    SetMetadata(DECORATOR_METADATA.CACHE_EVICT, {
      keyPrefixes,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
}

/**
 * 清除多个缓存
 *
 * @description 根据配置清除多个缓存前缀
 */
async function evictMultipleCache(
  cacheService: any,
  keyPrefixes: string[],
  args: any[],
  options?: CacheEvictOptions
): Promise<void> {
  try {
    for (const keyPrefix of keyPrefixes) {
      if (options?.allEntries) {
        // 清除所有匹配的缓存
        const pattern = options.keyPattern || `${keyPrefix}:*`;
        const keys = await cacheService.keys(pattern);

        if (keys.length > 0) {
          await cacheService.mdelete(keys);
          console.log(
            `Evicted ${keys.length} cache entries matching pattern: ${pattern}`
          );
        }
      } else {
        // 清除特定缓存
        const cacheKey = generateCacheKey(
          keyPrefix,
          args,
          options?.keyGenerator
        );
        await cacheService.delete(cacheKey);
        console.log(`Evicted cache entry: ${cacheKey}`);
      }
    }
  } catch (error) {
    console.warn('Multiple cache eviction failed', error);
  }
}
