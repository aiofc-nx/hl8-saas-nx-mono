/**
 * 基础设施工厂
 *
 * 提供基础设施服务的动态创建和管理能力。
 * 作为通用功能组件，支持基础设施服务的生命周期管理。
 *
 * @description 基础设施工厂实现基础设施服务的动态创建和管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { DatabaseService } from '@hl8/database';
import { EventService, MessagingService } from '@hl8/messaging';
import { TenantContextService } from '@hl8/multi-tenancy';

// 导入所有适配器
import { LoggerPortAdapter } from '../adapters/ports/logger-port.adapter';
import { IdGeneratorPortAdapter } from '../adapters/ports/id-generator-port.adapter';
import { TimeProviderPortAdapter } from '../adapters/ports/time-provider-port.adapter';
import { ValidationPortAdapter } from '../adapters/ports/validation-port.adapter';
import { ConfigurationPortAdapter } from '../adapters/ports/configuration-port.adapter';
import { EventBusPortAdapter } from '../adapters/ports/event-bus-port.adapter';

import { BaseRepositoryAdapter } from '../adapters/repositories/base-repository.adapter';
import { BaseAggregateRepositoryAdapter } from '../adapters/repositories/base-aggregate-repository.adapter';
import { DomainServiceAdapter } from '../adapters/services/domain-service.adapter';

import { EventStoreAdapter } from '../adapters/event-store/event-store.adapter';
import { MessageQueueAdapter } from '../adapters/message-queue/message-queue.adapter';
import { CacheAdapter } from '../adapters/cache/cache.adapter';
import { DatabaseAdapter } from '../adapters/database/database.adapter';

/**
 * 基础设施服务类型枚举
 */
export enum InfrastructureServiceType {
  /** 端口适配器 */
  PORT_ADAPTER = 'port_adapter',
  /** 仓储适配器 */
  REPOSITORY_ADAPTER = 'repository_adapter',
  /** 领域服务适配器 */
  DOMAIN_SERVICE_ADAPTER = 'domain_service_adapter',
  /** 事件存储适配器 */
  EVENT_STORE_ADAPTER = 'event_store_adapter',
  /** 消息队列适配器 */
  MESSAGE_QUEUE_ADAPTER = 'message_queue_adapter',
  /** 缓存适配器 */
  CACHE_ADAPTER = 'cache_adapter',
  /** 数据库适配器 */
  DATABASE_ADAPTER = 'database_adapter',
}

/**
 * 基础设施服务配置
 */
export interface IInfrastructureServiceConfig {
  /** 服务名称 */
  serviceName: string;
  /** 服务类型 */
  serviceType: InfrastructureServiceType;
  /** 是否启用 */
  enabled: boolean;
  /** 配置选项 */
  options: Record<string, unknown>;
  /** 依赖服务 */
  dependencies: string[];
  /** 初始化优先级 */
  priority: number;
  /** 是否单例 */
  singleton: boolean;
}

/**
 * 基础设施服务注册信息
 */
export interface IInfrastructureServiceRegistration {
  /** 服务名称 */
  serviceName: string;
  /** 服务类型 */
  serviceType: InfrastructureServiceType;
  /** 服务配置 */
  config: IInfrastructureServiceConfig;
  /** 服务实例 */
  instance?: unknown;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
  /** 服务状态 */
  status: 'created' | 'initializing' | 'running' | 'stopped' | 'error';
  /** 错误信息 */
  error?: string;
}

/**
 * 基础设施工厂
 *
 * 提供基础设施服务的动态创建和管理
 */
@Injectable()
export class InfrastructureFactory {
  private readonly services = new Map<
    string,
    IInfrastructureServiceRegistration
  >();
  private readonly serviceConstructors = new Map<
    InfrastructureServiceType,
    unknown
  >();

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
    private readonly eventService: EventService,
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService
  ) {
    this.initializeServiceConstructors();
  }

  /**
   * 创建基础设施服务
   *
   * @param config - 服务配置
   * @returns 服务实例
   */
  createService(config: IInfrastructureServiceConfig): unknown {
    // 检查服务是否已存在
    if (this.services.has(config.serviceName)) {
      const registration = this.services.get(config.serviceName)!;
      registration.lastAccessedAt = new Date();
      return registration.instance;
    }

    try {
      // 创建服务实例
      const ServiceConstructor = this.serviceConstructors.get(
        config.serviceType
      );
      if (!ServiceConstructor) {
        throw new Error(`未知的服务类型: ${config.serviceType}`);
      }

      const instance = this.instantiateService(ServiceConstructor as { new (...args: unknown[]): unknown }, config);

      // 注册服务
      const registration: IInfrastructureServiceRegistration = {
        serviceName: config.serviceName,
        serviceType: config.serviceType,
        config,
        instance,
        initialized: false,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        status: 'created',
      };

      this.services.set(config.serviceName, registration);

      this.logger.debug(`创建基础设施服务: ${config.serviceName}`, {
        serviceType: config.serviceType,
        config: config.options,
      });

      return instance;
    } catch (error) {
      this.logger.error(`创建基础设施服务失败: ${config.serviceName}`, error, {
        serviceType: config.serviceType,
        config: config.options,
      });
      throw error;
    }
  }

  /**
   * 获取基础设施服务
   *
   * @param serviceName - 服务名称
   * @returns 服务实例
   */
  getService(serviceName: string): unknown | null {
    const registration = this.services.get(serviceName);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance;
  }

  /**
   * 获取或创建基础设施服务
   *
   * @param config - 服务配置
   * @returns 服务实例
   */
  getOrCreateService(config: IInfrastructureServiceConfig): unknown {
    const existingService = this.getService(config.serviceName);
    if (existingService) {
      return existingService;
    }

    return this.createService(config);
  }

  /**
   * 初始化服务
   *
   * @param serviceName - 服务名称
   */
  async initializeService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      throw new Error(`服务不存在: ${serviceName}`);
    }

    if (registration.initialized) {
      return;
    }

    try {
      registration.status = 'initializing';

      // 初始化服务
      if (
        registration.instance &&
        typeof (registration.instance as { initialize?: () => Promise<void> }).initialize === 'function'
      ) {
        await (registration.instance as { initialize: () => Promise<void> }).initialize();
      }

      registration.initialized = true;
      registration.status = 'running';

      this.logger.debug(`初始化基础设施服务成功: ${serviceName}`);
    } catch (error) {
      registration.status = 'error';
      registration.error =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`初始化基础设施服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 启动服务
   *
   * @param serviceName - 服务名称
   */
  async startService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      throw new Error(`服务不存在: ${serviceName}`);
    }

    try {
      // 启动服务
      if (
        registration.instance &&
        typeof (registration.instance as { start?: () => Promise<void> }).start === 'function'
      ) {
        await (registration.instance as { start: () => Promise<void> }).start();
      }

      registration.status = 'running';

      this.logger.debug(`启动基础设施服务成功: ${serviceName}`);
    } catch (error) {
      registration.status = 'error';
      registration.error =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`启动基础设施服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 停止服务
   *
   * @param serviceName - 服务名称
   */
  async stopService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      return;
    }

    try {
      // 停止服务
      if (
        registration.instance &&
        typeof (registration.instance as { stop?: () => Promise<void> }).stop === 'function'
      ) {
        await (registration.instance as { stop: () => Promise<void> }).stop();
      }

      registration.status = 'stopped';

      this.logger.debug(`停止基础设施服务成功: ${serviceName}`);
    } catch (error) {
      registration.status = 'error';
      registration.error =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`停止基础设施服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 销毁服务
   *
   * @param serviceName - 服务名称
   */
  async destroyService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      return;
    }

    try {
      // 销毁服务
      if (
        registration.instance &&
        typeof (registration.instance as { destroy?: () => Promise<void> }).destroy === 'function'
      ) {
        await (registration.instance as { destroy: () => Promise<void> }).destroy();
      }

      // 移除服务注册
      this.services.delete(serviceName);

      this.logger.debug(`销毁基础设施服务成功: ${serviceName}`);
    } catch (error) {
      this.logger.error(`销毁基础设施服务失败: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有服务
   *
   * @returns 服务注册信息列表
   */
  getAllServices(): IInfrastructureServiceRegistration[] {
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
  ): IInfrastructureServiceRegistration | null {
    return this.services.get(serviceName) || null;
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
        const isHealthy = await this.checkServiceHealth(
          serviceName,
          registration.instance
        );
        results[serviceName] = {
          healthy: isHealthy,
          healthStatus: isHealthy ? 'healthy' : 'unhealthy',
          serviceName,
          serviceType: registration.serviceType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
          status: registration.status,
        };
      } catch (error) {
        results[serviceName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          serviceName,
        };
      }
    }

    return results;
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
    serviceStatuses: Record<string, number>;
    averageAge: number;
    oldestService: string | null;
    newestService: string | null;
  } {
    const services = Array.from(this.services.values());
    const now = new Date();

    const serviceTypes: Record<string, number> = {};
    const serviceStatuses: Record<string, number> = {};
    let totalAge = 0;
    let oldestService: string | null = null;
    let newestService: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const service of services) {
      // 统计服务类型
      serviceTypes[service.serviceType] =
        (serviceTypes[service.serviceType] || 0) + 1;

      // 统计服务状态
      serviceStatuses[service.status] =
        (serviceStatuses[service.status] || 0) + 1;

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
      activeServices: services.filter(
        (s) => s.initialized && s.status === 'running'
      ).length,
      serviceTypes,
      serviceStatuses,
      averageAge: services.length > 0 ? totalAge / services.length : 0,
      oldestService,
      newestService,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化服务构造函数映射
   */
  private initializeServiceConstructors(): void {
    // 端口适配器
    this.serviceConstructors.set(InfrastructureServiceType.PORT_ADAPTER, {
      logger: LoggerPortAdapter,
      idGenerator: IdGeneratorPortAdapter,
      timeProvider: TimeProviderPortAdapter,
      validation: ValidationPortAdapter,
      configuration: ConfigurationPortAdapter,
      eventBus: EventBusPortAdapter,
    });

    // 仓储适配器
    this.serviceConstructors.set(InfrastructureServiceType.REPOSITORY_ADAPTER, {
      base: BaseRepositoryAdapter,
      aggregate: BaseAggregateRepositoryAdapter,
    });

    // 领域服务适配器
    this.serviceConstructors.set(
      InfrastructureServiceType.DOMAIN_SERVICE_ADAPTER,
      {
        domain: DomainServiceAdapter,
      }
    );

    // 事件存储适配器
    this.serviceConstructors.set(
      InfrastructureServiceType.EVENT_STORE_ADAPTER,
      {
        eventStore: EventStoreAdapter,
      }
    );

    // 消息队列适配器
    this.serviceConstructors.set(
      InfrastructureServiceType.MESSAGE_QUEUE_ADAPTER,
      {
        messageQueue: MessageQueueAdapter,
      }
    );

    // 缓存适配器
    this.serviceConstructors.set(InfrastructureServiceType.CACHE_ADAPTER, {
      cache: CacheAdapter,
    });

    // 数据库适配器
    this.serviceConstructors.set(InfrastructureServiceType.DATABASE_ADAPTER, {
      database: DatabaseAdapter,
    });
  }

  /**
   * 实例化服务
   */
  private instantiateService(
    ServiceConstructor: new (...args: unknown[]) => unknown,
    config: IInfrastructureServiceConfig
  ): any {
    const serviceType = config.serviceType;
    const serviceName = config.serviceName;
    const options = config.options;

    // 根据服务类型创建实例
    switch (serviceType) {
      case InfrastructureServiceType.PORT_ADAPTER:
        return this.createPortAdapter(serviceName, options);

      case InfrastructureServiceType.REPOSITORY_ADAPTER:
        return this.createRepositoryAdapter(serviceName, options);

      case InfrastructureServiceType.DOMAIN_SERVICE_ADAPTER:
        return this.createDomainServiceAdapter(serviceName, options);

      case InfrastructureServiceType.EVENT_STORE_ADAPTER:
        return this.createEventStoreAdapter(serviceName, options);

      case InfrastructureServiceType.MESSAGE_QUEUE_ADAPTER:
        return this.createMessageQueueAdapter(serviceName, options);

      case InfrastructureServiceType.CACHE_ADAPTER:
        return this.createCacheAdapter(serviceName, options);

      case InfrastructureServiceType.DATABASE_ADAPTER:
        return this.createDatabaseAdapter(serviceName, options);

      default:
        throw new Error(`不支持的服务类型: ${serviceType}`);
    }
  }

  /**
   * 创建端口适配器
   */
  private createPortAdapter(serviceName: string, options: Record<string, unknown>): any {
    const adapterType = options['adapterType'] || 'logger';

    switch (adapterType) {
      case 'logger':
        return new LoggerPortAdapter(this.logger);
      case 'idGenerator':
        return new IdGeneratorPortAdapter();
      case 'timeProvider':
        return new TimeProviderPortAdapter();
      case 'validation':
        return new ValidationPortAdapter();
      case 'configuration':
        return new ConfigurationPortAdapter(options['configService'] as any);
      case 'eventBus':
        return new EventBusPortAdapter(this.eventService);
      default:
        throw new Error(`不支持的端口适配器类型: ${adapterType}`);
    }
  }

  /**
   * 创建仓储适配器
   */
  private createRepositoryAdapter(serviceName: string, options: Record<string, unknown>): any {
    const adapterType = options['adapterType'] || 'base';

    switch (adapterType) {
      case 'base':
        return new BaseRepositoryAdapter(
          this.databaseService,
          this.cacheService,
          this.logger,
          (options['entityName'] as string) || 'Entity',
          options
        );
      case 'aggregate':
        return new BaseAggregateRepositoryAdapter(
          this.databaseService,
          this.cacheService,
          this.logger,
          this.eventService,
          (options['entityName'] as string) || 'Aggregate',
          options
        );
      default:
        throw new Error(`不支持的仓储适配器类型: ${adapterType}`);
    }
  }

  /**
   * 创建领域服务适配器
   */
  private createDomainServiceAdapter(serviceName: string, options: Record<string, unknown>): any {
    return new DomainServiceAdapter(
      this.logger,
      this.cacheService,
      serviceName,
      options
    );
  }

  /**
   * 创建事件存储适配器
   */
  private createEventStoreAdapter(serviceName: string, options: any): any {
    return new EventStoreAdapter(
      this.databaseService,
      this.cacheService,
      this.logger,
      options
    );
  }

  /**
   * 创建消息队列适配器
   */
  private createMessageQueueAdapter(serviceName: string, options: any): any {
    return new MessageQueueAdapter(
      this.messagingService,
      this.cacheService,
      this.logger,
      options
    );
  }

  /**
   * 创建缓存适配器
   */
  private createCacheAdapter(serviceName: string, options: any): any {
    return new CacheAdapter(this.cacheService, this.logger, options);
  }

  /**
   * 创建数据库适配器
   */
  private createDatabaseAdapter(serviceName: string, options: any): any {
    return new DatabaseAdapter(this.databaseService, this.logger, options);
  }

  /**
   * 检查服务健康状态
   */
  private async checkServiceHealth(
    serviceName: string,
    instance: any
  ): Promise<boolean> {
    try {
      // 检查服务是否有健康检查方法
      if (instance && typeof instance.healthCheck === 'function') {
        return await instance.healthCheck();
      }

      // 检查服务是否有状态属性
      if (instance && typeof instance.status === 'string') {
        return instance.status === 'running';
      }

      // 默认认为服务健康
      return true;
    } catch {
      return false;
    }
  }
}
