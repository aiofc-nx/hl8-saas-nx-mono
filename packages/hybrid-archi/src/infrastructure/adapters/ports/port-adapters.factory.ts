/**
 * 端口适配器工厂
 *
 * 提供端口适配器的动态创建和管理能力。
 * 作为通用功能组件，支持端口适配器的生命周期管理。
 *
 * @description 端口适配器工厂实现端口适配器的动态创建和管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { TypedConfigModule } from '@hl8/config';
import { EventService } from '@hl8/messaging';

import { LoggerPortAdapter } from './logger-port.adapter';
import { IdGeneratorPortAdapter } from './id-generator-port.adapter';
import { TimeProviderPortAdapter } from './time-provider-port.adapter';
import { ValidationPortAdapter } from './validation-port.adapter';
import { ConfigurationPortAdapter } from './configuration-port.adapter';
import { EventBusPortAdapter } from './event-bus-port.adapter';

/**
 * 端口适配器类型
 */
export type PortAdapterType =
  | 'logger'
  | 'idGenerator'
  | 'timeProvider'
  | 'validation'
  | 'configuration'
  | 'eventBus';

/**
 * 端口适配器注册信息
 */
export interface IPortAdapterRegistration {
  /** 适配器类型 */
  adapterType: PortAdapterType;
  /** 适配器实例 */
  instance: any;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 端口适配器工厂
 *
 * 提供端口适配器的动态创建和管理
 */
@Injectable()
export class PortAdaptersFactory {
  private readonly adapters = new Map<
    PortAdapterType,
    IPortAdapterRegistration
  >();

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly configService: TypedConfigModule,
    private readonly eventService: EventService
  ) {}

  /**
   * 创建端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  createAdapter(adapterType: PortAdapterType): any {
    // 检查适配器是否已存在
    if (this.adapters.has(adapterType)) {
      const registration = this.adapters.get(adapterType)!;
      registration.lastAccessedAt = new Date();
      return registration.instance;
    }

    // 创建适配器实例
    let adapter: any;

    switch (adapterType) {
      case 'logger':
        adapter = new LoggerPortAdapter(this.logger);
        break;
      case 'idGenerator':
        adapter = new IdGeneratorPortAdapter();
        break;
      case 'timeProvider':
        adapter = new TimeProviderPortAdapter();
        break;
      case 'validation':
        adapter = new ValidationPortAdapter();
        break;
      case 'configuration':
        adapter = new ConfigurationPortAdapter(this.configService);
        break;
      case 'eventBus':
        adapter = new EventBusPortAdapter(this.eventService);
        break;
      default:
        throw new Error(`未知的端口适配器类型: ${adapterType}`);
    }

    // 注册适配器
    const registration: IPortAdapterRegistration = {
      adapterType,
      instance: adapter,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.adapters.set(adapterType, registration);

    this.logger.debug(`创建端口适配器: ${adapterType}`, {
      adapterType,
    });

    return adapter;
  }

  /**
   * 获取端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  getAdapter(adapterType: PortAdapterType): any | null {
    const registration = this.adapters.get(adapterType);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance;
  }

  /**
   * 获取或创建端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  getOrCreateAdapter(adapterType: PortAdapterType): any {
    const existingAdapter = this.getAdapter(adapterType);
    if (existingAdapter) {
      return existingAdapter;
    }

    return this.createAdapter(adapterType);
  }

  /**
   * 销毁端口适配器
   *
   * @param adapterType - 适配器类型
   */
  async destroyAdapter(adapterType: PortAdapterType): Promise<void> {
    const registration = this.adapters.get(adapterType);
    if (!registration) {
      return;
    }

    try {
      // 清理适配器资源
      if (adapterType === 'logger' && registration.instance.clearCache) {
        await registration.instance.clearCache();
      }

      // 移除适配器注册
      this.adapters.delete(adapterType);

      this.logger.debug(`销毁端口适配器: ${adapterType}`);
    } catch (error) {
      this.logger.error(`销毁端口适配器失败: ${adapterType}`, error);
      throw error;
    }
  }

  /**
   * 获取所有适配器
   *
   * @returns 适配器注册信息列表
   */
  getAllAdapters(): IPortAdapterRegistration[] {
    return Array.from(this.adapters.values());
  }

  /**
   * 获取适配器注册信息
   *
   * @param adapterType - 适配器类型
   * @returns 适配器注册信息
   */
  getAdapterRegistration(
    adapterType: PortAdapterType
  ): IPortAdapterRegistration | null {
    return this.adapters.get(adapterType) || null;
  }

  /**
   * 清理过期适配器
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的适配器数量
   */
  async cleanupExpiredAdapters(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredAdapters: PortAdapterType[] = [];

    for (const [adapterType, registration] of this.adapters) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredAdapters.push(adapterType);
      }
    }

    for (const adapterType of expiredAdapters) {
      await this.destroyAdapter(adapterType);
    }

    this.logger.debug(`清理过期端口适配器: ${expiredAdapters.length}`, {
      expiredAdapters,
    });

    return expiredAdapters.length;
  }

  /**
   * 获取适配器统计信息
   *
   * @returns 适配器统计信息
   */
  getAdapterStatistics(): {
    totalAdapters: number;
    activeAdapters: number;
    adapterTypes: Record<PortAdapterType, number>;
    averageAge: number;
    oldestAdapter: PortAdapterType | null;
    newestAdapter: PortAdapterType | null;
  } {
    const adapters = Array.from(this.adapters.values());
    const now = new Date();

    const adapterTypes: Record<PortAdapterType, number> = {
      logger: 0,
      idGenerator: 0,
      timeProvider: 0,
      validation: 0,
      configuration: 0,
      eventBus: 0,
    };

    let totalAge = 0;
    let oldestAdapter: PortAdapterType | null = null;
    let newestAdapter: PortAdapterType | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const adapter of adapters) {
      // 统计适配器类型
      adapterTypes[adapter.adapterType]++;

      // 计算年龄
      const age = now.getTime() - adapter.createdAt.getTime();
      totalAge += age;

      // 找到最老的适配器
      if (age > oldestAge) {
        oldestAge = age;
        oldestAdapter = adapter.adapterType;
      }

      // 找到最新的适配器
      if (age < newestAge) {
        newestAge = age;
        newestAdapter = adapter.adapterType;
      }
    }

    return {
      totalAdapters: adapters.length,
      activeAdapters: adapters.filter((a) => a.initialized).length,
      adapterTypes,
      averageAge: adapters.length > 0 ? totalAge / adapters.length : 0,
      oldestAdapter,
      newestAdapter,
    };
  }

  /**
   * 健康检查所有适配器
   *
   * @returns 健康检查结果
   */
  async healthCheckAllAdapters(): Promise<Record<PortAdapterType, any>> {
    const results: Record<PortAdapterType, any> = {} as any;

    for (const [adapterType, registration] of this.adapters) {
      try {
        // 检查适配器是否可用
        const isHealthy = await this.checkAdapterHealth(
          adapterType,
          registration.instance
        );
        results[adapterType] = {
          healthy: isHealthy,
          status: isHealthy ? 'healthy' : 'unhealthy',
          adapterType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
        };
      } catch (error) {
        results[adapterType] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          adapterType,
        };
      }
    }

    return results;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查适配器健康状态
   */
  private async checkAdapterHealth(
    adapterType: PortAdapterType,
    instance: any
  ): Promise<boolean> {
    try {
      switch (adapterType) {
        case 'logger':
          // 检查日志适配器
          instance.debug('健康检查');
          return true;
        case 'idGenerator': {
          // 检查ID生成器适配器
          const id = instance.generate();
          return typeof id === 'string' && id.length > 0;
        }
        case 'timeProvider': {
          // 检查时间提供者适配器
          const time = instance.now();
          return time instanceof Date;
        }
        case 'validation':
          // 检查验证适配器
          return typeof instance.validate === 'function';
        case 'configuration':
          // 检查配置适配器
          return typeof instance.get === 'function';
        case 'eventBus':
          // 检查事件总线适配器
          return typeof instance.publish === 'function';
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}
