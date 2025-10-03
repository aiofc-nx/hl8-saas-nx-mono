/**
 * 端口适配器管理器
 *
 * 提供端口适配器的统一管理和协调能力。
 * 作为通用功能组件，支持端口适配器的生命周期管理和依赖注入。
 *
 * @description 端口适配器管理器实现端口适配器的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { TypedConfigModule } from '@hl8/config';
import { EventService } from '@hl8/messaging';
import {
  PortAdaptersFactory,
  PortAdapterType,
  IPortAdapterRegistration,
} from './port-adapters.factory';

/**
 * 端口适配器管理器配置
 */
export interface IPortAdaptersManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 适配器最大年龄（毫秒） */
  maxAdapterAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
}

/**
 * 端口适配器管理器
 *
 * 提供端口适配器的统一管理和协调
 */
@Injectable()
export class PortAdaptersManager {
  private readonly config: IPortAdaptersManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly configService: TypedConfigModule,
    private readonly eventService: EventService,
    private readonly adaptersFactory: PortAdaptersFactory,
    config: Partial<IPortAdaptersManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxAdapterAge: config.maxAdapterAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
    };

    this.initialize();
  }

  /**
   * 创建端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  createAdapter(adapterType: PortAdapterType): any {
    this.logger.debug(`创建端口适配器: ${adapterType}`, {
      adapterType,
    });

    return this.adaptersFactory.createAdapter(adapterType);
  }

  /**
   * 获取端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  getAdapter(adapterType: PortAdapterType): any | null {
    return this.adaptersFactory.getAdapter(adapterType);
  }

  /**
   * 获取或创建端口适配器
   *
   * @param adapterType - 适配器类型
   * @returns 端口适配器实例
   */
  getOrCreateAdapter(adapterType: PortAdapterType): any {
    return this.adaptersFactory.getOrCreateAdapter(adapterType);
  }

  /**
   * 销毁端口适配器
   *
   * @param adapterType - 适配器类型
   */
  async destroyAdapter(adapterType: PortAdapterType): Promise<void> {
    this.logger.debug(`销毁端口适配器: ${adapterType}`);
    await this.adaptersFactory.destroyAdapter(adapterType);
  }

  /**
   * 获取所有适配器
   *
   * @returns 适配器注册信息列表
   */
  getAllAdapters(): IPortAdapterRegistration[] {
    return this.adaptersFactory.getAllAdapters();
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
    return this.adaptersFactory.getAdapterRegistration(adapterType);
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
    return this.adaptersFactory.getAdapterStatistics();
  }

  /**
   * 健康检查所有适配器
   *
   * @returns 健康检查结果
   */
  async healthCheckAllAdapters(): Promise<Record<PortAdapterType, any>> {
    this.logger.debug('开始健康检查所有端口适配器');
    return await this.adaptersFactory.healthCheckAllAdapters();
  }

  /**
   * 清理过期适配器
   *
   * @returns 清理的适配器数量
   */
  async cleanupExpiredAdapters(): Promise<number> {
    this.logger.debug('开始清理过期端口适配器');
    return await this.adaptersFactory.cleanupExpiredAdapters(
      this.config.maxAdapterAge
    );
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IPortAdaptersManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getAdapterStatistics();
    const healthy = statistics.totalAdapters > 0;

    return {
      config: { ...this.config },
      statistics,
      healthy,
      timestamp: new Date(),
    };
  }

  /**
   * 启动管理器
   */
  start(): void {
    this.logger.info('启动端口适配器管理器');

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止端口适配器管理器');

    // 停止自动清理
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁端口适配器管理器');

    // 停止管理器
    this.stop();

    // 销毁所有适配器
    const adapters = this.getAllAdapters();
    for (const adapter of adapters) {
      await this.destroyAdapter(adapter.adapterType);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化端口适配器管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredAdapters();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个适配器`);
        }
      } catch (error) {
        this.logger.error('自动清理失败', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthResults = await this.healthCheckAllAdapters();
        const unhealthyAdapters = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyAdapters.length > 0) {
          this.logger.warn('发现不健康的端口适配器', {
            unhealthyAdapters: unhealthyAdapters.map(([type]) => type),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }
}
