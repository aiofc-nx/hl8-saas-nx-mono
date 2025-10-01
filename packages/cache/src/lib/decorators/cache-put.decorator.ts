/**
 * 缓存更新装饰器
 *
 * @description 提供声明式的缓存更新功能，自动处理租户上下文
 * 总是执行方法并更新缓存，支持条件更新
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';
import { DECORATOR_METADATA } from '../constants';

/**
 * 缓存更新选项
 */
export interface CachePutOptions {
  /** 缓存键生成器 */
  keyGenerator?: (args: any[]) => string;

  /** 更新条件 */
  condition?: (args: any[], result?: any) => boolean;

  /** 排除条件 */
  unless?: (result: any) => boolean;

  /** 是否在方法执行前更新缓存 */
  beforeInvocation?: boolean;
}

/**
 * 缓存更新装饰器
 *
 * @description 总是执行方法并更新缓存，支持租户上下文
 *
 * @param keyPrefix 缓存键前缀
 * @param ttl 缓存过期时间（秒）
 * @param options 更新选项
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @CachePut('user', 3600)
 *   async createUser(userData: any): Promise<User> {
 *     return await this.userRepository.create(userData);
 *   }
 *
 *   @CachePut('user:profile', 1800, {
 *     condition: (args, result) => result.success,
 *     unless: (result) => result.isDeleted
 *   })
 *   async updateUserProfile(userId: string, profileData: any): Promise<UserProfile> {
 *     return await this.userRepository.updateProfile(userId, profileData);
 *   }
 *
 *   @CachePut('user:stats', 600, {
 *     beforeInvocation: true,
 *     keyGenerator: (args) => `user:${args[0]}:stats`
 *   })
 *   async refreshUserStats(userId: string): Promise<UserStats> {
 *     return await this.userRepository.calculateStats(userId);
 *   }
 * }
 * ```
 */
export function CachePut(
  keyPrefix: string,
  ttl?: number,
  options?: CachePutOptions
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
          'CacheService not found, executing method without cache update'
        );
        return originalMethod.apply(this, args);
      }

      let result: any;

      // 在方法执行前更新缓存
      if (options?.beforeInvocation) {
        result = await originalMethod.apply(this, args);

        // 检查更新条件
        if (options?.condition && !options.condition(args, result)) {
          console.log(
            `Cache update condition failed for ${target.constructor.name}.${propertyName}`
          );
          return result;
        }

        if (options?.unless && options.unless(result)) {
          console.log(
            `Cache update unless condition met for ${target.constructor.name}.${propertyName}`
          );
          return result;
        }

        // 更新缓存
        await updateCache(cacheService, keyPrefix, args, result, ttl, options);
        return result;
      }

      // 在方法执行后更新缓存
      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        console.error(
          `Method execution failed for ${target.constructor.name}.${propertyName}`,
          error
        );
        throw error;
      }

      // 检查更新条件
      if (options?.condition && !options.condition(args, result)) {
        console.log(
          `Cache update condition failed for ${target.constructor.name}.${propertyName}`
        );
        return result;
      }

      if (options?.unless && options.unless(result)) {
        console.log(
          `Cache update unless condition met for ${target.constructor.name}.${propertyName}`
        );
        return result;
      }

      // 更新缓存
      await updateCache(cacheService, keyPrefix, args, result, ttl, options);
      return result;
    };

    // 设置元数据
    SetMetadata(DECORATOR_METADATA.CACHE_PUT, {
      keyPrefix,
      ttl,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
}

/**
 * 更新缓存
 *
 * @description 根据配置更新缓存
 */
async function updateCache(
  cacheService: any,
  keyPrefix: string,
  args: any[],
  result: any,
  ttl?: number,
  options?: CachePutOptions
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(keyPrefix, args, options?.keyGenerator);
    await cacheService.set(cacheKey, result, ttl);
    console.log(`Updated cache for key: ${cacheKey}, ttl: ${ttl}`);
  } catch (error) {
    console.warn('Cache update failed', error);
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
 * 缓存更新条件辅助函数
 *
 * @description 提供常用的缓存更新条件判断
 */
export const UpdateConditions = {
  /**
   * 总是更新
   */
  always: () => true,

  /**
   * 从不清新
   */
  never: () => false,

  /**
   * 基于结果成功状态更新
   */
  onSuccess: (args: any[], result?: any) =>
    result !== undefined && result !== null && result !== false,

  /**
   * 基于结果错误状态更新
   */
  onError: (args: any[], result?: any) =>
    result && typeof result === 'object' && 'error' in result,

  /**
   * 基于参数条件更新
   */
  whenArgs: (predicate: (args: any[]) => boolean) => (args: any[]) =>
    predicate(args),

  /**
   * 基于结果条件更新
   */
  whenResult:
    (predicate: (result: any) => boolean) => (args: any[], result?: any) =>
      result !== undefined && predicate(result),

  /**
   * 基于参数和结果条件更新
   */
  when: (predicate: (args: any[], result?: any) => boolean) => predicate,

  /**
   * 基于结果ID更新
   */
  whenHasId: (args: any[], result?: any) =>
    result && typeof result === 'object' && 'id' in result,

  /**
   * 基于结果状态更新
   */
  whenStatus: (status: string) => (args: any[], result?: any) =>
    result && typeof result === 'object' && result.status === status,
};

/**
 * 缓存排除条件辅助函数
 *
 * @description 提供常用的缓存排除条件判断
 */
export const UpdateUnless = {
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

  /**
   * 结果状态为失败
   */
  isFailed: (result: any) =>
    result && typeof result === 'object' && result.status === 'failed',
};

/**
 * 批量缓存更新装饰器
 *
 * @description 更新多个缓存键
 *
 * @param keyPrefixes 缓存键前缀数组
 * @param ttl 缓存过期时间（秒）
 * @param options 更新选项
 */
export function CachePutMultiple(
  keyPrefixes: string[],
  ttl?: number,
  options?: CachePutOptions
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
          'CacheService not found, executing method without cache update'
        );
        return originalMethod.apply(this, args);
      }

      let result: any;

      // 在方法执行前更新缓存
      if (options?.beforeInvocation) {
        result = await originalMethod.apply(this, args);

        // 检查更新条件
        if (options?.condition && !options.condition(args, result)) {
          console.log(
            `Cache update condition failed for ${target.constructor.name}.${propertyName}`
          );
          return result;
        }

        if (options?.unless && options.unless(result)) {
          console.log(
            `Cache update unless condition met for ${target.constructor.name}.${propertyName}`
          );
          return result;
        }

        // 更新多个缓存
        await updateMultipleCache(
          cacheService,
          keyPrefixes,
          args,
          result,
          ttl,
          options
        );
        return result;
      }

      // 在方法执行后更新缓存
      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        console.error(
          `Method execution failed for ${target.constructor.name}.${propertyName}`,
          error
        );
        throw error;
      }

      // 检查更新条件
      if (options?.condition && !options.condition(args, result)) {
        console.log(
          `Cache update condition failed for ${target.constructor.name}.${propertyName}`
        );
        return result;
      }

      if (options?.unless && options.unless(result)) {
        console.log(
          `Cache update unless condition met for ${target.constructor.name}.${propertyName}`
        );
        return result;
      }

      // 更新多个缓存
      await updateMultipleCache(
        cacheService,
        keyPrefixes,
        args,
        result,
        ttl,
        options
      );
      return result;
    };

    // 设置元数据
    SetMetadata(DECORATOR_METADATA.CACHE_PUT, {
      keyPrefixes,
      ttl,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
}

/**
 * 更新多个缓存
 *
 * @description 根据配置更新多个缓存前缀
 */
async function updateMultipleCache(
  cacheService: any,
  keyPrefixes: string[],
  args: any[],
  result: any,
  ttl?: number,
  options?: CachePutOptions
): Promise<void> {
  try {
    for (const keyPrefix of keyPrefixes) {
      const cacheKey = generateCacheKey(keyPrefix, args, options?.keyGenerator);
      await cacheService.set(cacheKey, result, ttl);
      console.log(`Updated cache for key: ${cacheKey}, ttl: ${ttl}`);
    }
  } catch (error) {
    console.warn('Multiple cache update failed', error);
  }
}
