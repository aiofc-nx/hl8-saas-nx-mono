/**
 * 缓存配置
 * 
 * @description 配置Redis缓存连接参数和缓存策略
 * 支持开发、测试、生产环境的不同配置
 * 
 * @since 1.0.0
 */

export interface CacheConfig {
  store: 'redis';
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
}

/**
 * 获取缓存配置
 * 
 * @description 根据环境变量获取缓存配置
 * 
 * @returns 缓存配置对象
 * @since 1.0.0
 */
export const getCacheConfig = (): CacheConfig => {
  return {
    store: 'redis',
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0'),
    ttl: parseInt(process.env['CACHE_TTL'] || '3600'), // 默认1小时
  };
};
