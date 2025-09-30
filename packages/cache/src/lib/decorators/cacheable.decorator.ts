/**
 * 缓存装饰器
 *
 * @description 提供声明式的缓存功能，自动处理租户上下文
 * 支持条件缓存、缓存键生成、TTL设置等功能
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';
import { CacheableOptions } from '../types/cache.types';

export const CACHEABLE_METADATA = 'cacheable';

/**
 * 缓存方法结果装饰器
 *
 * @description 自动缓存方法的返回值，支持租户上下文
 *
 * @param keyPrefix 缓存键前缀
 * @param ttl 缓存过期时间（秒）
 * @param options 缓存选项
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @Cacheable('user', 3600)
 *   async getUser(userId: string): Promise<User> {
 *     return this.userRepository.findById(userId);
 *   }
 *
 *   @Cacheable('user:profile', 1800, {
 *     condition: (result) => result !== null,
 *     unless: (result) => result.isDeleted
 *   })
 *   async getUserProfile(userId: string): Promise<UserProfile> {
 *     return this.userRepository.findProfile(userId);
 *   }
 * }
 * ```
 */
export function Cacheable(
  keyPrefix: string,
  ttl?: number,
  options?: CacheableOptions
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
          'CacheService not found, executing method without caching'
        );
        return originalMethod.apply(this, args);
      }

      // 生成缓存键
      const cacheKey = generateCacheKey(keyPrefix, args, options?.keyGenerator);

      try {
        // 尝试从缓存获取
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          console.log(`Cache hit for key: ${cacheKey}`);
          return cached;
        }

        console.log(`Cache miss for key: ${cacheKey}`);
      } catch (error) {
        console.warn(`Cache get failed for key: ${cacheKey}`, error);
      }

      // 执行原方法
      let result: any;
      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        console.error(
          `Method execution failed for ${target.constructor.name}.${propertyName}`,
          error
        );
        throw error;
      }

      // 检查缓存条件
      if (options?.condition && !options.condition(result)) {
        console.log(`Cache condition failed for key: ${cacheKey}`);
        return result;
      }

      if (options?.unless && options.unless(result)) {
        console.log(`Cache unless condition met for key: ${cacheKey}`);
        return result;
      }

      // 缓存结果
      try {
        await cacheService.set(cacheKey, result, ttl);
        console.log(`Cached result for key: ${cacheKey}, ttl: ${ttl}`);
      } catch (error) {
        console.warn(`Cache set failed for key: ${cacheKey}`, error);
      }

      return result;
    };

    // 设置元数据
    SetMetadata(CACHEABLE_METADATA, {
      keyPrefix,
      ttl,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
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
 * 默认键生成器
 *
 * @description 提供常用的键生成策略
 */
export const KeyGenerators = {
  /**
   * 基于第一个参数的键生成器
   */
  firstArg: (args: any[]) => String(args[0] || 'no-arg'),

  /**
   * 基于所有参数的键生成器
   */
  allArgs: (args: any[]) =>
    args
      .map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      )
      .join(':'),

  /**
   * 基于对象属性的键生成器
   */
  objectProps: (props: string[]) => (args: any[]) => {
    const obj = args[0];
    if (!obj || typeof obj !== 'object') return 'invalid-object';

    return props.map((prop) => `${prop}=${obj[prop] || 'undefined'}`).join(':');
  },

  /**
   * 基于哈希的键生成器
   */
  hash: (args: any[]) => {
    const str = JSON.stringify(args);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  },
};

/**
 * 缓存条件辅助函数
 *
 * @description 提供常用的缓存条件判断
 */
export const CacheConditions = {
  /**
   * 结果不为空
   */
  notNull: (result: any) => result !== null,

  /**
   * 结果不为undefined
   */
  notUndefined: (result: any) => result !== undefined,

  /**
   * 结果不为空且不为undefined
   */
  notNullOrUndefined: (result: any) => result != null,

  /**
   * 结果不为空字符串
   */
  notEmptyString: (result: any) => result !== '',

  /**
   * 结果不为空数组
   */
  notEmptyArray: (result: any) => Array.isArray(result) && result.length > 0,

  /**
   * 结果不为空对象
   */
  notEmptyObject: (result: any) =>
    result && typeof result === 'object' && Object.keys(result).length > 0,

  /**
   * 结果有特定属性
   */
  hasProperty: (property: string) => (result: any) =>
    result && typeof result === 'object' && property in result,

  /**
   * 结果满足条件
   */
  satisfies: (predicate: (result: any) => boolean) => predicate,
};

/**
 * 缓存排除条件辅助函数
 *
 * @description 提供常用的缓存排除条件判断
 */
export const CacheUnless = {
  /**
   * 结果为空
   */
  isNull: (result: any) => result === null,

  /**
   * 结果为undefined
   */
  isUndefined: (result: any) => result === undefined,

  /**
   * 结果为空或undefined
   */
  isNullOrUndefined: (result: any) => result == null,

  /**
   * 结果为空字符串
   */
  isEmptyString: (result: any) => result === '',

  /**
   * 结果为空数组
   */
  isEmptyArray: (result: any) => Array.isArray(result) && result.length === 0,

  /**
   * 结果为空对象
   */
  isEmptyObject: (result: any) =>
    !result || typeof result !== 'object' || Object.keys(result).length === 0,

  /**
   * 结果有错误属性
   */
  hasError: (result: any) =>
    result && typeof result === 'object' && 'error' in result,

  /**
   * 结果被标记为删除
   */
  isDeleted: (result: any) =>
    result && typeof result === 'object' && result.isDeleted === true,
};
