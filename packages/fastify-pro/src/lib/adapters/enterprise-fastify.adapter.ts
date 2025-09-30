/**
 * 企业级Fastify适配器 - NestJS集成接口
 *
 * @description 完整替代NestJS官方FastifyAdapter的企业级实现
 * 继承并增强NestJS官方适配器，无缝集成企业级功能，为应用开发者提供统一的接口
 *
 * ## 核心特点
 *
 * ### 🎯 **设计定位**
 * - **NestJS集成**：完全兼容NestJS生态系统，可直接替换官方FastifyAdapter
 * - **企业级增强**：在标准功能基础上，无缝集成企业级功能
 * - **应用接口**：面向应用开发者的主要使用接口
 * - **完整替代**：100%兼容官方适配器，同时提供企业级增强
 *
 * ### 🏗️ **架构特色**
 * - **双层架构**：继承NestJS官方适配器 + 内置CoreFastifyAdapter企业级功能
 * - **透明集成**：企业级功能对应用开发者透明，无需修改现有代码
 * - **优雅降级**：企业级功能启动失败时，自动降级到标准模式
 * - **配置驱动**：通过配置选项灵活控制企业级功能的启用
 *
 * @since 1.0.0
 */

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { CoreFastifyAdapter } from './core-fastify.adapter';
import { IFastifyEnterpriseConfig } from '../types/fastify.types';

/**
 * 企业级Fastify选项
 */
export interface IEnterpriseFastifyOptions {
  /** 标准Fastify选项 */
  logger?: boolean;
  trustProxy?: boolean;

  /** 企业级功能配置 */
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableMultiTenant?: boolean;
    tenantHeader?: string;
    corsOptions?: {
      origin?: boolean | string | string[];
      credentials?: boolean;
    };
    logger?: {
      level?: string;
      prettyPrint?: boolean;
      serializers?: Record<string, unknown>;
    };
  };
}

/**
 * 企业级Fastify适配器
 *
 * @description 继承NestJS官方FastifyAdapter，添加完整的企业级功能
 */
export class EnterpriseFastifyAdapter extends FastifyAdapter {
  private readonly enterpriseCore?: CoreFastifyAdapter;
  private readonly enterpriseConfig: NonNullable<
    IEnterpriseFastifyOptions['enterprise']
  >;

  constructor(options?: IEnterpriseFastifyOptions) {
    // 提取企业级配置，传递标准配置给父类
    const { enterprise, ...fastifyOptions } = options || {};
    super(fastifyOptions);

    this.enterpriseConfig = enterprise || {};

    // 企业级功能将在异步初始化中创建
    // 因为需要加载配置，而构造函数不能是异步的
  }

  /**
   * 异步初始化企业级功能
   *
   * @description 基于配置异步初始化企业级功能
   */
  async initializeEnterpriseFeatures(): Promise<void> {
    try {
      const enabled = await this.isEnterpriseEnabled();

      if (enabled && !this.enterpriseCore) {
        const enterpriseCore = new CoreFastifyAdapter(
          this.createEnterpriseConfig()
        );

        // 将enterpriseCore赋值给readonly字段需要类型断言
        (this as unknown as { enterpriseCore: unknown }).enterpriseCore =
          enterpriseCore;

        console.log('✅ 企业级Fastify功能已初始化');
      }
    } catch (error) {
      console.warn(
        '企业级功能初始化失败，使用标准模式:',
        (error as Error).message
      );
    }
  }

  /**
   * 检查是否启用了企业级功能
   */
  private async isEnterpriseEnabled(): Promise<boolean> {
    return !!(
      this.enterpriseConfig.enableHealthCheck ||
      this.enterpriseConfig.enablePerformanceMonitoring ||
      this.enterpriseConfig.enableMultiTenant
    );
  }

  /**
   * 创建企业级配置
   */
  private createEnterpriseConfig(): IFastifyEnterpriseConfig {
    return {
      server: {
        port: 3000, // 默认端口，实际由listen方法覆盖
        host: '0.0.0.0',
      },
      plugins: this.enterpriseConfig.corsOptions
        ? [
            {
              name: 'cors',
              enabled: true,
              priority: 1,
              options: this.enterpriseConfig.corsOptions,
            },
          ]
        : [],
      middleware: this.enterpriseConfig.enableMultiTenant
        ? [
            {
              name: 'tenant',
              enabled: true,
              priority: 1,
              options: {
                tenantHeader:
                  this.enterpriseConfig.tenantHeader || 'X-Tenant-ID',
                validateTenant: true,
              },
            },
          ]
        : [],
      routes: [],
      monitoring: {
        enableMetrics:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
        enableHealthCheck: this.enterpriseConfig.enableHealthCheck || false,
        enablePerformanceMonitoring:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
      },
      security: {
        enableHelmet: false,
        enableCORS: !!this.enterpriseConfig.corsOptions,
        enableRateLimit: false,
      },
      logging: {
        level: 'info' as const,
        prettyPrint: true,
      },
    };
  }

  /**
   * 重写listen方法，添加企业级启动逻辑
   */
  override async listen(
    port: string | number,
    ...args: unknown[]
  ): Promise<unknown> {
    // 启动企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.start();
        console.log('✅ 企业级Fastify功能已启动');
      } catch (error) {
        console.warn(
          '企业级功能启动失败，继续使用标准模式:',
          (error as Error).message
        );
      }
    }

    // 调用父类listen方法
    return super.listen(port, ...(args as [string, () => void]));
  }

  /**
   * 重写close方法，添加企业级清理逻辑
   */
  override async close(): Promise<undefined> {
    // 停止企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.stop();
        console.log('✅ 企业级Fastify功能已停止');
      } catch (error) {
        console.warn('企业级功能停止失败:', (error as Error).message);
      }
    }

    // 调用父类close方法
    await super.close();
    return undefined;
  }

  /**
   * 获取企业级健康状态
   */
  async getEnterpriseHealthStatus(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getHealthStatus()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }

  /**
   * 获取企业级性能指标
   */
  async getEnterprisePerformanceMetrics(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getPerformanceMetrics()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }
}
