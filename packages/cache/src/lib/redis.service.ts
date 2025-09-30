/**
 * Redis服务
 *
 * @description 基于Redis的缓存服务实现
 * 提供高性能的缓存操作，支持连接池管理和健康检查
 *
 * @since 1.0.0
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from '@hl8/logger';
import { RedisConfig, ConnectionInfo } from './types/cache.types';

/**
 * Redis服务
 *
 * @description 提供Redis连接和缓存操作的核心服务
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private isConnected = false;
  private connectionInfo!: ConnectionInfo;

  constructor(
    @Inject('CACHE_MODULE_OPTIONS') private readonly options: any,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'redis-service' });
  }

  /**
   * 模块初始化
   *
   * @description 初始化Redis连接
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      this.logger.info('Redis服务已初始化');
    } catch (error) {
      this.logger.error('Redis服务初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 模块销毁
   *
   * @description 关闭Redis连接
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
      this.logger.info('Redis服务已关闭');
    } catch (error) {
      this.logger.error('Redis服务关闭失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 连接到Redis
   *
   * @description 建立Redis连接
   */
  async connect(): Promise<void> {
    try {
      const config = this.options.redis as RedisConfig;

      this.redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
        lazyConnect: config.lazyConnect || true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // 监听连接事件
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.info('Redis连接已建立');
      });

      this.redis.on('ready', () => {
        this.logger.info('Redis已准备就绪');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.logger.error('Redis连接错误', { error: (error as Error).message });
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis连接已关闭');
      });

      this.redis.on('reconnecting', () => {
        this.logger.info('Redis正在重连');
      });

      // 连接Redis
      await this.redis.connect();

      // 设置连接信息
      this.connectionInfo = {
        host: config.host,
        port: config.port,
        db: config.db || 0,
        status: 'connected',
        latency: 0,
        lastConnected: new Date(),
      };
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Redis连接失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 断开Redis连接
   *
   * @description 关闭Redis连接
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.isConnected = false;
        this.logger.info('Redis连接已断开');
      }
    } catch (error) {
      this.logger.error('Redis断开连接失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取缓存值
   *
   * @description 从Redis获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('获取缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 设置缓存值
   *
   * @description 向Redis设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error('设置缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 删除缓存
   *
   * @description 从Redis删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error('删除缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查缓存是否存在
   *
   * @description 检查Redis中是否存在指定的键
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('检查缓存存在性失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量获取缓存
   *
   * @description 批量从Redis获取多个缓存值
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      this.logger.error('批量获取缓存失败', {
        keys,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量设置缓存
   *
   * @description 批量向Redis设置多个缓存值
   */
  async mset<T>(
    pairs: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl } of pairs) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error('批量设置缓存失败', {
        pairs,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量删除缓存
   *
   * @description 批量从Redis删除多个缓存
   */
  async mdelete(keys: string[]): Promise<void> {
    try {
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.error('批量删除缓存失败', {
        keys,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 设置过期时间
   *
   * @description 为缓存设置过期时间
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error('设置过期时间失败', {
        key,
        ttl,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取剩余过期时间
   *
   * @description 获取缓存的剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error('获取过期时间失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取匹配的键
   *
   * @description 获取匹配模式的所有键
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error('获取匹配键失败', {
        pattern,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 清空所有缓存
   *
   * @description 清空Redis中的所有缓存
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Redis缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 检查连接状态
   *
   * @description 检查Redis连接是否正常
   */
  isHealthy(): boolean {
    return this.isConnected && this.redis?.status === 'ready';
  }

  /**
   * 获取连接信息
   *
   * @description 获取Redis连接信息
   */
  getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * 获取Redis实例
   *
   * @description 获取Redis实例用于高级操作
   */
  getRedis(): Redis {
    return this.redis;
  }

  /**
   * 执行Redis命令
   *
   * @description 执行原生Redis命令
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      return await this.redis.call(command, ...args);
    } catch (error) {
      this.logger.error('执行Redis命令失败', {
        command,
        args,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取Redis统计信息
   *
   * @description 获取Redis服务器统计信息
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.redis.info();
      const stats: Record<string, any> = {};

      // 解析Redis INFO输出
      info.split('\r\n').forEach((line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('获取Redis统计信息失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
