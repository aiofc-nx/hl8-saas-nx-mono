/**
 * 基础基础设施适配器
 *
 * 提供业务模块所需的通用基础设施适配器实现。
 * 作为通用功能组件，提供基础设施的统一适配能力。
 *
 * @description 通用基础设施功能组件适配器
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  IBaseInfrastructureService,
  IInfrastructureServiceManager,
  IInfrastructureHealth,
  InfrastructureServiceStatus,
} from './base-infrastructure.interface';

/**
 * 基础基础设施适配器
 *
 * 提供业务模块所需的通用基础设施适配功能
 */
@Injectable()
export class BaseInfrastructureAdapter implements IBaseInfrastructureService {
  private status: InfrastructureServiceStatus =
    InfrastructureServiceStatus.NOT_INITIALIZED;
  private initialized = false;
  private started = false;

  constructor(
    public readonly serviceId: string,
    public readonly serviceName: string,
    public readonly serviceVersion: string,
    private readonly configuration: Record<string, unknown> = {}
  ) {}

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.status = InfrastructureServiceStatus.INITIALIZING;

    try {
      // 执行初始化逻辑
      await this.onInitialize();

      this.initialized = true;
      this.status = InfrastructureServiceStatus.RUNNING;
    } catch (error) {
      this.status = InfrastructureServiceStatus.ERROR;
      throw new Error(
        `基础设施服务初始化失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 启动服务
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.started) {
      return;
    }

    try {
      // 执行启动逻辑
      await this.onStart();

      this.started = true;
      this.status = InfrastructureServiceStatus.RUNNING;
    } catch (error) {
      this.status = InfrastructureServiceStatus.ERROR;
      throw new Error(
        `基础设施服务启动失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 停止服务
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    this.status = InfrastructureServiceStatus.STOPPING;

    try {
      // 执行停止逻辑
      await this.onStop();

      this.started = false;
      this.status = InfrastructureServiceStatus.STOPPED;
    } catch (error) {
      this.status = InfrastructureServiceStatus.ERROR;
      throw new Error(
        `基础设施服务停止失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<IInfrastructureHealth> {
    try {
      const isHealthy = this.status === InfrastructureServiceStatus.RUNNING;
      const details = await this.onHealthCheck();

      return {
        healthy: isHealthy,
        status: this.status,
        lastChecked: new Date(),
        details,
      };
    } catch (error) {
      return {
        healthy: false,
        status: InfrastructureServiceStatus.ERROR,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): InfrastructureServiceStatus {
    return this.status;
  }

  /**
   * 获取服务配置
   */
  getConfiguration(): Record<string, unknown> {
    return { ...this.configuration };
  }

  // ==================== 可重写的方法 ====================

  /**
   * 初始化钩子
   * 子类可以重写此方法来实现具体的初始化逻辑
   */
  protected async onInitialize(): Promise<void> {
    // 默认实现：空操作
  }

  /**
   * 启动钩子
   * 子类可以重写此方法来实现具体的启动逻辑
   */
  protected async onStart(): Promise<void> {
    // 默认实现：空操作
  }

  /**
   * 停止钩子
   * 子类可以重写此方法来实现具体的停止逻辑
   */
  protected async onStop(): Promise<void> {
    // 默认实现：空操作
  }

  /**
   * 健康检查钩子
   * 子类可以重写此方法来实现具体的健康检查逻辑
   */
  protected async onHealthCheck(): Promise<Record<string, unknown>> {
    return {
      serviceId: this.serviceId,
      serviceName: this.serviceName,
      serviceVersion: this.serviceVersion,
      status: this.status,
      initialized: this.initialized,
      started: this.started,
    };
  }
}

/**
 * 基础设施服务管理器
 *
 * 提供业务模块所需的通用基础设施管理功能
 */
@Injectable()
export class InfrastructureServiceManager
  implements IInfrastructureServiceManager
{
  private readonly services = new Map<string, IBaseInfrastructureService>();

  /**
   * 注册基础设施服务
   */
  registerService(service: IBaseInfrastructureService): void {
    this.services.set(service.serviceId, service);
  }

  /**
   * 注销基础设施服务
   */
  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
  }

  /**
   * 获取基础设施服务
   */
  getService(serviceId: string): IBaseInfrastructureService | undefined {
    return this.services.get(serviceId);
  }

  /**
   * 获取所有基础设施服务
   */
  getAllServices(): IBaseInfrastructureService[] {
    return Array.from(this.services.values());
  }

  /**
   * 启动所有基础设施服务
   */
  async startAllServices(): Promise<void> {
    const startPromises = Array.from(this.services.values()).map((service) =>
      service.start().catch((error) => {
        console.error(`启动服务 ${service.serviceId} 失败:`, error);
        throw error;
      })
    );

    await Promise.all(startPromises);
  }

  /**
   * 停止所有基础设施服务
   */
  async stopAllServices(): Promise<void> {
    const stopPromises = Array.from(this.services.values()).map((service) =>
      service.stop().catch((error) => {
        console.error(`停止服务 ${service.serviceId} 失败:`, error);
        throw error;
      })
    );

    await Promise.all(stopPromises);
  }

  /**
   * 健康检查所有服务
   */
  async healthCheckAllServices(): Promise<
    Record<string, IInfrastructureHealth>
  > {
    const healthChecks = new Map<string, Promise<IInfrastructureHealth>>();

    for (const [serviceId, service] of this.services) {
      healthChecks.set(serviceId, service.healthCheck());
    }

    const results: Record<string, IInfrastructureHealth> = {};

    for (const [serviceId, healthCheck] of healthChecks) {
      try {
        results[serviceId] = await healthCheck;
      } catch (error) {
        results[serviceId] = {
          healthy: false,
          status: InfrastructureServiceStatus.ERROR,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return results;
  }
}
