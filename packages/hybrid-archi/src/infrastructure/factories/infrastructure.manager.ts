/**
 * 基础设施管理器
 *
 * 提供基础设施服务的统一管理和协调能力。
 * 作为通用功能组件，支持基础设施服务的生命周期管理。
 *
 * @description 基础设施管理器实现基础设施服务的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  InfrastructureFactory,
  IInfrastructureServiceConfig,
  InfrastructureServiceType,
} from './infrastructure.factory';

/**
 * 基础设施管理器配置
 */
export interface IInfrastructureManagerConfig {
  /** 是否启用自动启动 */
  enableAutoStart: boolean;
  /** 是否启用自动停止 */
  enableAutoStop: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 是否启用统计收集 */
  enableStatistics: boolean;
  /** 统计收集间隔（毫秒） */
  statisticsInterval: number;
  /** 是否启用服务依赖检查 */
  enableDependencyCheck: boolean;
  /** 服务启动超时（毫秒） */
  serviceStartTimeout: number;
  /** 服务停止超时（毫秒） */
  serviceStopTimeout: number;
}

/**
 * 基础设施管理器
 *
 * 提供基础设施服务的统一管理和协调
 */
@Injectable()
export class InfrastructureManager {
  private readonly config: IInfrastructureManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private statisticsTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(
    private readonly logger: PinoLogger,
    private readonly infrastructureFactory: InfrastructureFactory,
    config: Partial<IInfrastructureManagerConfig> = {}
  ) {
    this.config = {
      enableAutoStart: config.enableAutoStart ?? true,
      enableAutoStop: config.enableAutoStop ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
      enableStatistics: config.enableStatistics ?? true,
      statisticsInterval: config.statisticsInterval ?? 10 * 60 * 1000, // 10分钟
      enableDependencyCheck: config.enableDependencyCheck ?? true,
      serviceStartTimeout: config.serviceStartTimeout ?? 30000, // 30秒
      serviceStopTimeout: config.serviceStopTimeout ?? 10000, // 10秒
    };

    this.initialize();
  }

  /**
   * 创建基础设施服务
   *
   * @param config - 服务配置
   * @returns 服务实例
   */
  createService(config: IInfrastructureServiceConfig): any {
    this.logger.debug(`创建基础设施服务: ${config.serviceName}`, {
      serviceType: config.serviceType,
      config: config.options,
    });

    return this.infrastructureFactory.createService(config);
  }

  /**
   * 获取基础设施服务
   *
   * @param serviceName - 服务名称
   * @returns 服务实例
   */
  getService(serviceName: string): any | null {
    return this.infrastructureFactory.getService(serviceName);
  }

  /**
   * 获取或创建基础设施服务
   *
   * @param config - 服务配置
   * @returns 服务实例
   */
  getOrCreateService(config: IInfrastructureServiceConfig): any {
    return this.infrastructureFactory.getOrCreateService(config);
  }

  /**
   * 初始化服务
   *
   * @param serviceName - 服务名称
   */
  async initializeService(serviceName: string): Promise<void> {
    this.logger.debug(`初始化基础设施服务: ${serviceName}`);
    await this.infrastructureFactory.initializeService(serviceName);
  }

  /**
   * 启动服务
   *
   * @param serviceName - 服务名称
   */
  async startService(serviceName: string): Promise<void> {
    this.logger.debug(`启动基础设施服务: ${serviceName}`);
    await this.infrastructureFactory.startService(serviceName);
  }

  /**
   * 停止服务
   *
   * @param serviceName - 服务名称
   */
  async stopService(serviceName: string): Promise<void> {
    this.logger.debug(`停止基础设施服务: ${serviceName}`);
    await this.infrastructureFactory.stopService(serviceName);
  }

  /**
   * 销毁服务
   *
   * @param serviceName - 服务名称
   */
  async destroyService(serviceName: string): Promise<void> {
    this.logger.debug(`销毁基础设施服务: ${serviceName}`);
    await this.infrastructureFactory.destroyService(serviceName);
  }

  /**
   * 获取所有服务
   *
   * @returns 服务注册信息列表
   */
  getAllServices(): any[] {
    return this.infrastructureFactory.getAllServices();
  }

  /**
   * 获取服务注册信息
   *
   * @param serviceName - 服务名称
   * @returns 服务注册信息
   */
  getServiceRegistration(serviceName: string): any {
    return this.infrastructureFactory.getServiceRegistration(serviceName);
  }

  /**
   * 健康检查所有服务
   *
   * @returns 健康检查结果
   */
  async healthCheckAllServices(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有基础设施服务');
    return await this.infrastructureFactory.healthCheckAllServices();
  }

  /**
   * 获取服务统计信息
   *
   * @returns 服务统计信息
   */
  getServiceStatistics(): any {
    return this.infrastructureFactory.getServiceStatistics();
  }

  /**
   * 启动所有服务
   */
  async startAllServices(): Promise<void> {
    this.logger.info('启动所有基础设施服务');

    const services = this.getAllServices();
    const sortedServices = this.sortServicesByPriority(services);

    for (const service of sortedServices) {
      try {
        await this.startServiceWithTimeout(service.serviceName);
      } catch (error) {
        this.logger.error(`启动服务失败: ${service.serviceName}`, error);
        // 继续启动其他服务
      }
    }

    this.logger.info(`启动所有基础设施服务完成: ${services.length}`, {
      serviceCount: services.length,
    });
  }

  /**
   * 停止所有服务
   */
  async stopAllServices(): Promise<void> {
    this.logger.info('停止所有基础设施服务');

    const services = this.getAllServices();
    const sortedServices = this.sortServicesByPriority(services).reverse();

    for (const service of sortedServices) {
      try {
        await this.stopServiceWithTimeout(service.serviceName);
      } catch (error) {
        this.logger.error(`停止服务失败: ${service.serviceName}`, error);
        // 继续停止其他服务
      }
    }

    this.logger.info(`停止所有基础设施服务完成: ${services.length}`, {
      serviceCount: services.length,
    });
  }

  /**
   * 重启服务
   *
   * @param serviceName - 服务名称
   */
  async restartService(serviceName: string): Promise<void> {
    this.logger.debug(`重启基础设施服务: ${serviceName}`);

    try {
      await this.stopService(serviceName);
      await this.startService(serviceName);
    } catch (error) {
      this.logger.error(`重启服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 重启所有服务
   */
  async restartAllServices(): Promise<void> {
    this.logger.info('重启所有基础设施服务');

    await this.stopAllServices();
    await this.startAllServices();

    this.logger.info('重启所有基础设施服务完成');
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IInfrastructureManagerConfig;
    statistics: any;
    healthy: boolean;
    initialized: boolean;
    timestamp: Date;
  } {
    const statistics = this.getServiceStatistics();
    const healthy = statistics.totalServices > 0;

    return {
      config: { ...this.config },
      statistics,
      healthy,
      initialized: this.isInitialized,
      timestamp: new Date(),
    };
  }

  /**
   * 启动管理器
   */
  start(): void {
    this.logger.info('启动基础设施管理器');

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // 启动统计收集
    if (this.config.enableStatistics) {
      this.startStatisticsCollection();
    }

    this.isInitialized = true;
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止基础设施管理器');

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // 停止统计收集
    if (this.statisticsTimer) {
      clearInterval(this.statisticsTimer);
      this.statisticsTimer = undefined;
    }

    this.isInitialized = false;
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁基础设施管理器');

    // 停止管理器
    this.stop();

    // 停止所有服务
    await this.stopAllServices();

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
    this.logger.debug('初始化基础设施管理器', {
      config: this.config,
    });
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
          this.logger.warn('发现不健康的基础设施服务', {
            unhealthyServices: unhealthyServices.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 启动统计收集
   */
  private startStatisticsCollection(): void {
    this.statisticsTimer = setInterval(async () => {
      try {
        const statistics = this.getServiceStatistics();
        this.logger.debug('基础设施服务统计信息收集完成', {
          serviceCount: statistics.totalServices,
          activeServices: statistics.activeServices,
          statistics,
        });
      } catch (error) {
        this.logger.error('统计收集失败', error);
      }
    }, this.config.statisticsInterval);
  }

  /**
   * 按优先级排序服务
   */
  private sortServicesByPriority(services: any[]): any[] {
    return services.sort((a, b) => {
      const priorityA = a.config.priority || 0;
      const priorityB = b.config.priority || 0;
      return priorityA - priorityB;
    });
  }

  /**
   * 带超时的启动服务
   */
  private async startServiceWithTimeout(serviceName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`启动服务超时: ${serviceName}`));
      }, this.config.serviceStartTimeout);

      this.startService(serviceName)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * 带超时的停止服务
   */
  private async stopServiceWithTimeout(serviceName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`停止服务超时: ${serviceName}`));
      }, this.config.serviceStopTimeout);

      this.stopService(serviceName)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * 获取所有数据库统计信息
   *
   * @returns 数据库统计信息
   */
  async getAllDatabaseStatistics(): Promise<any> {
    this.logger.debug('获取所有数据库统计信息');
    // 这里应该实现实际的统计信息收集逻辑
    return {
      totalConnections: 0,
      activeConnections: 0,
      queryCount: 0,
      errorCount: 0,
    };
  }

  /**
   * 重置所有数据库统计信息
   */
  async resetAllDatabaseStatistics(): Promise<void> {
    this.logger.debug('重置所有数据库统计信息');
    // 这里应该实现实际的统计信息重置逻辑
  }
}
