/**
 * 缓存模块
 *
 * @description 配置缓存相关的导出
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

// 缓存提供者
export { MemoryCacheProvider } from './memory-cache.provider';
export { FileCacheProvider } from './file-cache.provider';

// 缓存管理器
export { CacheManager } from './cache.manager';

// 类型导出
export * from '../types/cache.types';
