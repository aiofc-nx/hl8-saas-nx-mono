/**
 * 领域服务工厂
 *
 * 提供领域服务的动态创建和管理能力。
 * 作为通用功能组件，支持领域服务的生命周期管理。
 *
 * @description 领域服务工厂实现领域服务的动态创建和管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  DomainServiceAdapter,
  IDomainServiceConfig,
} from './domain-service.adapter';

/**
 * 领域服务注册信息
 */
export interface IDomainServiceRegistration {
  /** 服务名称 */
  serviceName: string;
  /** 服务类型 */
  serviceType: string;
  /** 服务配置 */
  config: IDomainServiceConfig;
  /** 服务实例 */
  instance?: DomainServiceAdapter;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 领域服务工厂
 *
 * 提供领域服务的动态创建和管理
 */
@Injectable()
export class DomainServiceFactory {
  private readonly services = new Map<string, IDomainServiceRegistration>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService
  ) {}

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
    // 检查服务是否已存在
    if (this.services.has(serviceName)) {
      const registration = this.services.get(serviceName)!;
      registration.lastAccessedAt = new Date();
      return registration.instance!;
    }

    // 创建服务实例
    const service = new DomainServiceAdapter(
      this.logger,
      this.cacheService,
      serviceName,
      config
    );

    // 注册服务
    const registration: IDomainServiceRegistration = {
      serviceName,
      serviceType,
      config: {
        enableCache: config.enableCache ?? true,
        cacheTtl: config.cacheTtl ?? 300,
        enableLogging: config.enableLogging ?? true,
        enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
        enableTransaction: config.enableTransaction ?? true,
        maxRetries: config.maxRetries ?? 3,
        retryDelay: config.retryDelay ?? 1000,
      },
      instance: service,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.services.set(serviceName, registration);

    this.logger.debug(`创建领域服务: ${serviceName}`, {
      serviceType,
      config: registration.config,
    });

    return service;
  }

  /**
   * 获取领域服务
   *
   * @param serviceName - 服务名称
   * @returns 领域服务实例
   */
  getService(serviceName: string): DomainServiceAdapter | null {
    const registration = this.services.get(serviceName);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance!;
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
    const existingService = this.getService(serviceName);
    if (existingService) {
      return existingService;
    }

    return this.createService(serviceName, serviceType, config);
  }

  /**
   * 销毁领域服务
   *
   * @param serviceName - 服务名称
   */
  async destroyService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      return;
    }

    try {
      // 清理服务缓存
      if (registration.config.enableCache) {
        await registration.instance!.clearCache();
      }

      // 移除服务注册
      this.services.delete(serviceName);

      this.logger.debug(`销毁领域服务: ${serviceName}`);
    } catch (error) {
      this.logger.error(`销毁领域服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有服务
   *
   * @returns 服务注册信息列表
   */
  getAllServices(): IDomainServiceRegistration[] {
    return Array.from(this.services.values());
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
    return this.services.get(serviceName) || null;
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
    const registration = this.services.get(serviceName);
    if (!registration) {
      throw new Error(`服务不存在: ${serviceName}`);
    }

    Object.assign(registration.config, config);
    registration.instance!.updateConfiguration(registration.config);

    this.logger.debug(`更新领域服务配置: ${serviceName}`, {
      config: registration.config,
    });
  }

  /**
   * 清理过期服务
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的服务数量
   */
  async cleanupExpiredServices(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredServices: string[] = [];

    for (const [serviceName, registration] of this.services) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredServices.push(serviceName);
      }
    }

    for (const serviceName of expiredServices) {
      await this.destroyService(serviceName);
    }

    this.logger.debug(`清理过期领域服务: ${expiredServices.length}`, {
      expiredServices,
    });

    return expiredServices.length;
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
    const services = Array.from(this.services.values());
    const now = new Date();

    const serviceTypes: Record<string, number> = {};
    let totalAge = 0;
    let oldestService: string | null = null;
    let newestService: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const service of services) {
      // 统计服务类型
      serviceTypes[service.serviceType] =
        (serviceTypes[service.serviceType] || 0) + 1;

      // 计算年龄
      const age = now.getTime() - service.createdAt.getTime();
      totalAge += age;

      // 找到最老的服务
      if (age > oldestAge) {
        oldestAge = age;
        oldestService = service.serviceName;
      }

      // 找到最新的服务
      if (age < newestAge) {
        newestAge = age;
        newestService = service.serviceName;
      }
    }

    return {
      totalServices: services.length,
      activeServices: services.filter((s) => s.initialized).length,
      serviceTypes,
      averageAge: services.length > 0 ? totalAge / services.length : 0,
      oldestService,
      newestService,
    };
  }

  /**
   * 健康检查所有服务
   *
   * @returns 健康检查结果
   */
  async healthCheckAllServices(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [serviceName, registration] of this.services) {
      try {
        const health = await registration.instance!.healthCheck();
        results[serviceName] = health;
      } catch (error) {
        results[serviceName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return results;
  }
}
