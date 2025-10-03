/**
 * 通用缓存装饰器
 *
 * @description 缓存相关装饰器
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 缓存TTL装饰器
 *
 * @description 为方法指定缓存TTL时间
 * @param ttl - 缓存时间（秒）
 * @returns 装饰器函数
 */
export const CacheTTL = (ttl: number): MethodDecorator =>
  SetMetadata('cacheTTL', ttl);

/**
 * 缓存键装饰器
 *
 * @description 为方法指定缓存键
 * @param key - 缓存键
 * @returns 装饰器函数
 */
export const CacheKey = (key: string): MethodDecorator =>
  SetMetadata('cacheKey', key);

/**
 * 禁用缓存装饰器
 *
 * @description 标记方法禁用缓存
 * @returns 装饰器函数
 */
export const NoCache = (): MethodDecorator => SetMetadata('noCache', true);

/**
 * 缓存失效装饰器
 *
 * @description 标记方法会失效相关缓存
 * @param keys - 要失效的缓存键模式
 * @returns 装饰器函数
 */
export const CacheInvalidate = (...keys: string[]): MethodDecorator =>
  SetMetadata('cacheInvalidate', keys);
