/**
 * 企业级Fastify插件基类
 *
 * @description 提供插件生命周期管理、健康检查、性能监控等企业级功能
 *
 * ## 核心特点
 *
 * ### 🎯 **设计定位**
 * - **插件基类**：为所有Fastify插件提供统一的基础功能
 * - **生命周期管理**：完整的插件注册、卸载、健康检查流程
 * - **性能监控**：插件性能指标收集和分析
 * - **错误处理**：统一的错误处理和恢复机制
 *
 * @since 1.0.0
 */

import { FastifyInstance } from 'fastify';
import {
  IFastifyPlugin,
  IFastifyPluginConfig,
  IFastifyPluginStatus,
} from '../types/fastify.types';

/**
 * 企业级Fastify插件基类
 *
 * @description 提供插件生命周期管理和企业级功能
 */
export abstract class CoreFastifyPlugin implements IFastifyPlugin {
  public readonly name: string;
  public readonly version: string;
  public readonly priority: number;
  public readonly enabled: boolean;
  public readonly config: IFastifyPluginConfig;

  private _isRegistered = false;
  private _registerTime?: Date;
  private _unregisterTime?: Date;
  private _errorCount = 0;
  private _successCount = 0;
  private _lastError?: Error;

  constructor(config: IFastifyPluginConfig) {
    this.name = config.name;
    this.version = (config.options?.['version'] as string) || '1.0.0';
    this.priority = config.priority || 0;
    this.enabled = config.enabled !== false;
    this.config = config;
  }

  /**
   * 注册插件
   *
   * @description 注册插件到Fastify实例
   */
  async register(fastify: FastifyInstance): Promise<void> {
    if (!this.enabled) {
      console.log(`插件已禁用: ${this.name}`);
      return;
    }

    try {
      // 插件注册前验证
      await this.validateDependencies();
      await this.validateConfiguration();

      // 插件注册
      await this.doRegister(fastify);

      // 插件注册后处理
      await this.postRegister(fastify);
      await this.setupHealthCheck();

      // 记录插件状态
      this._isRegistered = true;
      this._registerTime = new Date();

      console.log(`✅ 插件已注册: ${this.name}`);
    } catch (error) {
      this._lastError = error as Error;
      this._errorCount++;
      console.error(`❌ 插件注册失败: ${this.name}`, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   *
   * @description 从Fastify实例卸载插件
   */
  async unregister(fastify: FastifyInstance): Promise<void> {
    if (!this._isRegistered) {
      console.log(`插件未注册: ${this.name}`);
      return;
    }

    try {
      // 插件卸载前清理
      await this.preUnregister(fastify);

      // 插件卸载
      await this.doUnregister(fastify);

      // 插件卸载后清理
      await this.postUnregister();

      // 更新插件状态
      this._isRegistered = false;
      this._unregisterTime = new Date();

      console.log(`✅ 插件已卸载: ${this.name}`);
    } catch (error) {
      this._lastError = error as Error;
      this._errorCount++;
      console.error(`❌ 插件卸载失败: ${this.name}`, error);
      throw error;
    }
  }

  /**
   * 获取插件状态
   *
   * @description 获取插件的详细状态信息
   */
  async getStatus(): Promise<IFastifyPluginStatus> {
    return {
      name: this.name,
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      unregisterTime: this._unregisterTime,
      isHealthy: this.isHealthy(),
      error: this._lastError?.message,
      metrics: {
        errorCount: this._errorCount,
        successCount: this._successCount,
        successRate: this.calculateSuccessRate(),
      },
    };
  }

  /**
   * 健康检查
   *
   * @description 检查插件是否健康
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 基础健康检查
      if (!this.enabled) return false;
      if (this._lastError && this._errorCount > 5) return false;

      // 自定义健康检查
      return await this.doHealthCheck();
    } catch (error) {
      this._lastError = error as Error;
      this._errorCount++;
      return false;
    }
  }

  // ==================== 抽象方法 ====================

  /**
   * 执行插件注册
   *
   * @description 子类需要实现具体的插件注册逻辑
   */
  protected abstract doRegister(fastify: FastifyInstance): Promise<void>;

  /**
   * 执行插件卸载
   *
   * @description 子类需要实现具体的插件卸载逻辑
   */
  protected abstract doUnregister(fastify: FastifyInstance): Promise<void>;

  /**
   * 执行健康检查
   *
   * @description 子类可以重写此方法实现自定义健康检查
   */
  protected async doHealthCheck(): Promise<boolean> {
    return true;
  }

  // ==================== 钩子方法 ====================

  /**
   * 插件注册前验证
   *
   * @description 子类可以重写此方法实现自定义验证逻辑
   */
  protected async validateDependencies(): Promise<void> {
    // 默认实现：检查依赖插件
    if (this.config.dependencies) {
      for (const dep of this.config.dependencies) {
        // 这里可以检查依赖插件是否已注册
        console.log(`检查插件依赖: ${dep}`);
      }
    }
  }

  /**
   * 插件配置验证
   *
   * @description 子类可以重写此方法实现配置验证
   */
  protected async validateConfiguration(): Promise<void> {
    // 默认实现：基础配置验证
    if (!this.name) {
      throw new Error('插件名称不能为空');
    }
  }

  /**
   * 插件注册后处理
   *
   * @description 子类可以重写此方法实现注册后的处理逻辑
   */
  protected async postRegister(_fastify: FastifyInstance): Promise<void> {
    // 默认实现：记录成功
    this._successCount++;
  }

  /**
   * 插件卸载前处理
   *
   * @description 子类可以重写此方法实现卸载前的处理逻辑
   */
  protected async preUnregister(_fastify: FastifyInstance): Promise<void> {
    // 默认实现：空
  }

  /**
   * 插件卸载后处理
   *
   * @description 子类可以重写此方法实现卸载后的处理逻辑
   */
  protected async postUnregister(): Promise<void> {
    // 默认实现：空
  }

  /**
   * 设置健康检查
   *
   * @description 子类可以重写此方法设置健康检查
   */
  protected async setupHealthCheck(): Promise<void> {
    // 默认实现：空
  }

  // ==================== 私有方法 ====================

  /**
   * 检查插件是否健康
   */
  private isHealthy(): boolean {
    if (!this.enabled) return false;
    if (this._lastError && this._errorCount > 5) return false;
    return true;
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(): number {
    const total = this._errorCount + this._successCount;
    if (total === 0) return 100;
    return (this._successCount / total) * 100;
  }
}

/**
 * Fastify插件错误
 *
 * @description 插件相关的错误类
 */
export class FastifyPluginError extends Error {
  constructor(
    message: string,
    public readonly pluginName: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FastifyPluginError';
  }
}
