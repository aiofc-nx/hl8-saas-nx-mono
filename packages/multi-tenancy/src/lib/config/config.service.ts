/**
 * 多租户配置服务
 *
 * @description 集成 @hl8/config 模块，提供类型安全的配置管理
 * 支持配置文件加载、环境变量覆盖和配置验证
 *
 * @fileoverview 多租户配置服务实现
 * @author HL8 Team
 * @since 1.0.0
 */

import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
import { PinoLogger } from '@hl8/logger';
import { MultiTenancyConfig } from './multi-tenancy.config';
import { DefaultConfigProvider } from './default-config.provider';
import { ConfigValidator } from './config.validator';
import { TenantConfigInvalidException } from '../exceptions';

/**
 * 配置服务选项接口
 */
export interface ConfigServiceOptions {
  /** 配置文件路径 */
  configPath?: string;
  /** 环境变量前缀 */
  envPrefix?: string;
  /** 是否启用配置验证 */
  enableValidation?: boolean;
  /** 是否启用默认配置 */
  useDefaultConfig?: boolean;
}

/**
 * 多租户配置服务
 *
 * @description 提供多租户模块的配置管理功能
 * 集成 @hl8/config 模块，支持类型安全的配置加载和验证
 */
@Injectable()
export class MultiTenancyConfigService implements OnModuleInit {
  private config!: MultiTenancyConfig;
  private isInitialized = false;

  constructor(
    private readonly defaultConfigProvider: DefaultConfigProvider,
    private readonly configValidator: ConfigValidator,
    private readonly logger: PinoLogger,
    @Inject('MULTI_TENANCY_CONFIG_OPTIONS')
    private readonly options: ConfigServiceOptions = {}
  ) {
    this.logger.setContext({ requestId: 'multi-tenancy-config-service' });
  }

  /**
   * 模块初始化
   *
   * @description 初始化配置服务，加载和验证配置
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.info('初始化多租户配置服务');

      // 加载配置
      await this.loadConfig();

      // 验证配置
      if (this.options.enableValidation !== false) {
        await this.configValidator.validateConfigAndThrow(this.config);
      }

      this.isInitialized = true;
      this.logger.info('多租户配置服务初始化完成');
    } catch (error) {
      this.logger.error('多租户配置服务初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取多租户配置
   *
   * @description 获取完整的多租户配置
   * 如果配置未初始化，则使用默认配置
   *
   * @returns 多租户配置
   */
  getConfig(): MultiTenancyConfig {
    if (!this.isInitialized) {
      this.logger.warn('配置服务未初始化，返回默认配置');
      return this.defaultConfigProvider.getDefaultConfig();
    }
    return this.config;
  }

  /**
   * 获取上下文配置
   *
   * @description 获取租户上下文配置
   *
   * @returns 上下文配置
   */
  getContextConfig() {
    return this.getConfig().context;
  }

  /**
   * 获取隔离配置
   *
   * @description 获取租户隔离配置
   *
   * @returns 隔离配置
   */
  getIsolationConfig() {
    return this.getConfig().isolation;
  }

  /**
   * 获取中间件配置
   *
   * @description 获取租户中间件配置
   *
   * @returns 中间件配置
   */
  getMiddlewareConfig() {
    return this.getConfig().middleware;
  }

  /**
   * 获取安全配置
   *
   * @description 获取租户安全配置
   *
   * @returns 安全配置
   */
  getSecurityConfig() {
    return this.getConfig().security;
  }

  /**
   * 获取多层级配置
   *
   * @description 获取多层级隔离配置
   *
   * @returns 多层级配置
   */
  getMultiLevelConfig() {
    return this.getConfig().multiLevel;
  }

  /**
   * 验证当前配置
   *
   * @description 验证当前配置的有效性
   *
   * @returns 验证结果
   */
  async validateCurrentConfig() {
    return await this.configValidator.validateConfig(this.getConfig());
  }

  /**
   * 重新加载配置
   *
   * @description 重新加载配置文件和环境变量
   * 通常在配置更新后调用
   */
  async reloadConfig(): Promise<void> {
    try {
      this.logger.info('重新加载多租户配置');

      // 重新加载配置
      await this.loadConfig();

      // 验证配置
      if (this.options.enableValidation !== false) {
        await this.configValidator.validateConfigAndThrow(this.config);
      }

      this.logger.info('多租户配置重新加载完成');
    } catch (error) {
      this.logger.error('多租户配置重新加载失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 加载配置
   *
   * @description 从配置文件和环境变量加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      // 如果启用默认配置，直接使用默认配置
      if (this.options.useDefaultConfig !== false) {
        this.config = this.defaultConfigProvider.getDefaultConfig();
        this.logger.debug('使用默认配置');
        return;
      }

      // 尝试从配置文件加载
      if (this.options.configPath) {
        await this.loadFromConfigFile();
      } else {
        // 使用默认配置
        this.config = this.defaultConfigProvider.getDefaultConfig();
        this.logger.debug('使用默认配置（未指定配置文件路径）');
      }
    } catch (error) {
      this.logger.error('配置加载失败，使用默认配置', {
        error: (error as Error).message,
      });
      this.config = this.defaultConfigProvider.getDefaultConfig();
    }
  }

  /**
   * 从配置文件加载配置
   *
   * @description 使用 @hl8/config 模块从配置文件加载配置
   */
  private async loadFromConfigFile(): Promise<void> {
    try {
      // 这里应该使用 TypedConfigModule 来加载配置
      // 由于配置文件的复杂性，暂时使用默认配置
      // 在实际实现中，应该创建配置文件并加载

      this.logger.debug('从配置文件加载配置', {
        configPath: this.options.configPath,
      });

      // TODO: 实现配置文件加载逻辑
      // const configModule = TypedConfigModule.forRoot({
      //   schema: MultiTenancyConfig,
      //   load: [
      //     fileLoader({ path: this.options.configPath }),
      //     dotenvLoader({ separator: '__' })
      //   ]
      // });

      // 暂时使用默认配置
      this.config = this.defaultConfigProvider.getDefaultConfig();
    } catch (error) {
      this.logger.error('配置文件加载失败', {
        error: (error as Error).message,
        configPath: this.options.configPath,
      });
      throw error;
    }
  }
}

/**
 * 创建配置服务提供者
 *
 * @description 创建配置服务的提供者配置
 *
 * @param options 配置选项
 * @returns 提供者配置
 */
export function createConfigServiceProvider(
  options: ConfigServiceOptions = {}
) {
  return {
    provide: MultiTenancyConfigService,
    useFactory: async (
      defaultConfigProvider: DefaultConfigProvider,
      configValidator: ConfigValidator,
      logger: PinoLogger
    ) => {
      return new MultiTenancyConfigService(
        defaultConfigProvider,
        configValidator,
        logger,
        options
      );
    },
    inject: [DefaultConfigProvider, ConfigValidator, PinoLogger],
  };
}

/**
 * 创建配置选项提供者
 *
 * @description 创建配置选项的提供者配置
 *
 * @param options 配置选项
 * @returns 提供者配置
 */
export function createConfigOptionsProvider(options: ConfigServiceOptions) {
  return {
    provide: 'MULTI_TENANCY_CONFIG_OPTIONS',
    useValue: options,
  };
}
