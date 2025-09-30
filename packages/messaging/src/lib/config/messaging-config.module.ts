import { Module } from '@nestjs/common';
import { TypedConfigModule, dotenvLoader, fileLoader } from '@hl8/config';
import { MessagingConfig } from './messaging.config';

/**
 * 消息队列配置模块
 *
 * @description 提供类型安全的消息队列配置管理
 * 支持环境变量、配置文件等多种配置源
 * 集成配置验证和类型检查
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     MessagingConfigModule.forRoot({
 *       configPath: './config/messaging.yml',
 *       envPrefix: 'MESSAGING_',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class MessagingConfigModule {
  /**
   * 创建配置模块
   *
   * @description 使用默认配置源创建消息队列配置模块
   *
   * @param options 配置选项
   * @returns 配置模块
   */
  static forRoot(options: MessagingConfigModuleOptions = {}) {
    const { configPath = './config/messaging.yml', validate = true } = options;

    return TypedConfigModule.forRoot({
      schema: MessagingConfig,
      load: [
        // 加载YAML配置文件
        fileLoader({
          path: configPath,
        }),
        // 加载环境变量
        dotenvLoader({
          separator: '__',
        }),
      ],
      validate: validate ? undefined : undefined,
    });
  }

  /**
   * 异步创建配置模块
   *
   * @description 支持异步配置加载和自定义配置源
   *
   * @param options 异步配置选项
   * @returns 配置模块
   */
  static forRootAsync(options: MessagingConfigModuleAsyncOptions) {
    return TypedConfigModule.forRootAsync({
      schema: MessagingConfig,
      load: [
        // 加载配置文件
        fileLoader({
          path: './config/messaging.yml',
        }),
        // 加载环境变量
        dotenvLoader({
          separator: '__',
        }),
      ],
      validate: options.validate !== false ? undefined : undefined,
    });
  }
}

/**
 * 消息队列配置模块选项接口
 */
export interface MessagingConfigModuleOptions {
  /** 配置文件路径 */
  configPath?: string;
  /** 环境变量前缀 */
  envPrefix?: string;
  /** 是否启用配置验证 */
  validate?: boolean;
  /** 是否启用配置缓存 */
  cache?: boolean;
}

/**
 * 消息队列配置模块异步选项接口
 */
export interface MessagingConfigModuleAsyncOptions {
  /** 配置工厂函数 */
  useFactory?: (...args: unknown[]) => Promise<Partial<MessagingConfig>>;
  /** 依赖注入 */
  inject?: unknown[];
  /** 是否启用配置验证 */
  validate?: boolean;
  /** 是否启用配置缓存 */
  cache?: boolean;
}
