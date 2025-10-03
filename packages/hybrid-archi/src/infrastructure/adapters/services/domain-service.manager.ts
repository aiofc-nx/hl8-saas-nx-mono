/**
 * 领域服务管理器
 *
 * 提供领域服务的统一管理和协调能力。
 * 作为通用功能组件，支持领域服务的生命周期管理和依赖注入。
 *
 * @description 领域服务管理器实现领域服务的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  DomainServiceAdapter,
  IDomainServiceConfig,
} from './domain-service.adapter';
import {
  DomainServiceFactory,
  IDomainServiceRegistration,
} from './domain-service.factory';

/**
 * 领域服务管理器配置
 */
export interface IDomainServiceManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 服务最大年龄（毫秒） */
  maxServiceAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
}

/**
 * 领域服务管理器
 *
 * 提供领域服务的统一管理和协调
 */
@Injectable()
export class DomainServiceManager {
  private readonly config: IDomainServiceManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly serviceFactory: DomainServiceFactory,
    config: Partial<IDomainServiceManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxServiceAge: config.maxServiceAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
    };

    this.initialize();
  }

  /**
   * 创建领域服务
   *
   * @param serviceName - 服务名称
   * @param serviceType - 服务类型
   * @param config - 服务配置
   * @returns 领域服务实例
   */
  createService(
    serviceName: string,
    serviceType: string,
    config: Partial<IDomainServiceConfig> = {}
  ): DomainServiceAdapter {
    this.logger.debug(`创建领域服务: ${serviceName}`, {
      serviceType,
      config,
    });

    return this.serviceFactory.createService(serviceName, serviceType, config);
  }

  /**
   * 获取领域服务
   *
   * @param serviceName - 服务名称
   * @returns 领域服务实例
   */
  getService(serviceName: string): DomainServiceAdapter | null {
    return this.serviceFactory.getService(serviceName);
  }

  /**
   * 获取或创建领域服务
   *
   * @param serviceName - 服务名称
   * @param serviceType - 服务类型
   * @param config - 服务配置
   * @returns 领域服务实例
   */
  getOrCreateService(
    serviceName: string,
    serviceType: string,
    config: Partial<IDomainServiceConfig> = {}
  ): DomainServiceAdapter {
    return this.serviceFactory.getOrCreateService(
      serviceName,
      serviceType,
      config
    );
  }

  /**
   * 销毁领域服务
   *
   * @param serviceName - 服务名称
   */
  async destroyService(serviceName: string): Promise<void> {
    this.logger.debug(`销毁领域服务: ${serviceName}`);
    await this.serviceFactory.destroyService(serviceName);
  }

  /**
   * 获取所有服务
   *
   * @returns 服务注册信息列表
   */
  getAllServices(): IDomainServiceRegistration[] {
    return this.serviceFactory.getAllServices();
  }

  /**
   * 获取服务注册信息
   *
   * @param serviceName - 服务名称
   * @returns 服务注册信息
   */
  getServiceRegistration(
    serviceName: string
  ): IDomainServiceRegistration | null {
    return this.serviceFactory.getServiceRegistration(serviceName);
  }

  /**
   * 更新服务配置
   *
   * @param serviceName - 服务名称
   * @param config - 新配置
   */
  updateServiceConfiguration(
    serviceName: string,
    config: Partial<IDomainServiceConfig>
  ): void {
    this.logger.debug(`更新领域服务配置: ${serviceName}`, { config });
    this.serviceFactory.updateServiceConfiguration(serviceName, config);
  }

  /**
   * 获取服务统计信息
   *
   * @returns 服务统计信息
   */
  getServiceStatistics(): {
    totalServices: number;
    activeServices: number;
    serviceTypes: Record<string, number>;
    averageAge: number;
    oldestService: string | null;
    newestService: string | null;
  } {
    return this.serviceFactory.getServiceStatistics();
  }

  /**
   * 健康检查所有服务
   *
   * @returns 健康检查结果
   */
  async healthCheckAllServices(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有领域服务');
    return await this.serviceFactory.healthCheckAllServices();
  }

  /**
   * 清理过期服务
   *
   * @returns 清理的服务数量
   */
  async cleanupExpiredServices(): Promise<number> {
    this.logger.debug('开始清理过期领域服务');
    return await this.serviceFactory.cleanupExpiredServices(
      this.config.maxServiceAge
    );
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IDomainServiceManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getServiceStatistics();
    const healthy = statistics.totalServices > 0;

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
    this.logger.info('启动领域服务管理器');

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
    this.logger.info('停止领域服务管理器');

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
    this.logger.info('销毁领域服务管理器');

    // 停止管理器
    this.stop();

    // 销毁所有服务
    const services = this.getAllServices();
    for (const service of services) {
      await this.destroyService(service.serviceName);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化领域服务管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredServices();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个服务`);
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
        const healthResults = await this.healthCheckAllServices();
        const unhealthyServices = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyServices.length > 0) {
          this.logger.warn('发现不健康的领域服务', {
            unhealthyServices: unhealthyServices.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }
}
