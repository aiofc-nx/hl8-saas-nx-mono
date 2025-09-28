/**
 * 类型化配置模块
 *
 * 提供完全类型安全的配置管理模块，支持配置文件解析、环境变量管理、
 * 配置验证、变量扩展等功能。基于 class-validator 和 class-transformer
 * 实现类型安全的配置管理。
 *
 * @description 此模块是配置系统的核心，提供统一的配置管理接口。
 * 支持多格式配置文件加载、环境变量替换、配置验证和缓存功能。
 * 遵循 Clean Architecture 的基础设施层设计原则。
 *
 * ## 业务规则
 *
 * ### 配置加载规则
 * - 支持 JSON、YAML、YML 格式的配置文件
 * - 支持环境变量替换和默认值设置
 * - 支持远程配置加载和本地配置文件
 * - 配置加载失败时阻止应用启动
 *
 * ### 配置验证规则
 * - 基于 class-validator 进行配置验证
 * - 支持自定义验证规则和验证选项
 * - 验证失败时提供详细的错误信息
 * - 支持嵌套配置的递归验证
 *
 * ### 类型安全规则
 * - 配置类必须继承自基础配置类
 * - 支持 TypeScript 类型推断和自动补全
 * - 编译时类型检查确保配置正确性
 * - 运行时类型验证确保配置完整性
 *
 * ### 缓存管理规则
 * - 支持内存缓存和文件缓存策略
 * - 支持缓存键前缀和自定义键生成器
 * - 支持缓存过期时间（TTL）设置
 * - 支持缓存统计和事件监听
 * - 支持缓存失效和更新策略
 *
 * ## 业务逻辑流程
 *
 * 1. **配置加载**：从文件系统或远程服务加载配置
 * 2. **环境变量替换**：替换配置中的环境变量引用
 * 3. **配置标准化**：执行自定义的配置转换逻辑
 * 4. **配置验证**：使用 class-validator 验证配置完整性
 * 5. **提供者注册**：将配置注册为 NestJS 提供者
 * 6. **缓存初始化**：初始化配置缓存（如果启用）
 *
 * @example
 * ```typescript
 * import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
 * import { Module, Injectable } from '@nestjs/common';
 * import { Type } from 'class-transformer';
 * import { IsString, IsNumber, ValidateNested } from 'class-validator';
 *
 * // 定义配置类
 * export class DatabaseConfig {
 *   @IsString()
 *   public readonly host!: string;
 *
 *   @IsNumber()
 *   @Type(() => Number)
 *   public readonly port!: number;
 * }
 *
 * export class RootConfig {
 *   @ValidateNested()
 *   @Type(() => DatabaseConfig)
 *   public readonly database!: DatabaseConfig;
 * }
 *
 * // 配置模块
 * @Module({
 *   imports: [
 *     TypedConfigModule.forRoot({
 *       schema: RootConfig,
 *       load: [
 *         fileLoader({ path: './config/app.yml' }),
 *         dotenvLoader({ separator: '__' })
 *       ]
 *     })
 *   ],
 * })
 * export class AppModule {}
 *
 * // 使用配置 - 完全类型安全
 * @Injectable()
 * export class DatabaseService {
 *   constructor(
 *     private readonly config: RootConfig,
 *     private readonly databaseConfig: DatabaseConfig
 *   ) {}
 *
 *   connect() {
 *     // 完全的类型推断和自动补全
 *     console.log(`${this.databaseConfig.host}:${this.databaseConfig.port}`);
 *   }
 * }
 * ```
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { red, yellow, cyan, blue } from 'chalk';
import type { ClassConstructor } from 'class-transformer';
import type { ValidatorOptions, ValidationError } from 'class-validator';
const merge = require('lodash.merge');
import {
  TypedConfigModuleAsyncOptions,
  TypedConfigModuleOptions,
} from './interfaces/typed-config-module-options.interface';
import { forEachDeep } from './utils/for-each-deep.util';
import { identity } from './utils/identity.util';
import { debug } from './utils/debug.util';
import { validateSync, plainToClass } from './utils/imports.util';
import { ErrorHandler, ConfigError } from './errors';
import { ConfigRecord, ConfigNormalizer, ConfigValidator } from './types';
import { CacheManager, CacheOptions } from './cache';

/**
 * 类型化配置模块类
 *
 * 类型化配置模块的核心实现类，提供同步和异步的配置模块创建方法。
 * 支持配置加载、验证、标准化和提供者注册等完整功能。
 *
 * @description 此类是配置模块的核心实现，封装了配置管理的所有业务逻辑。
 * 支持多种配置加载器、自定义验证函数、配置标准化和缓存管理。
 * 遵循 NestJS 模块设计模式，提供完整的依赖注入支持。
 *
 * ## 业务规则
 *
 * ### 模块创建规则
 * - 同步创建：使用 forRoot 方法创建同步配置模块
 * - 异步创建：使用 forRootAsync 方法创建异步配置模块
 * - 全局模块：默认注册为全局模块，可在整个应用中使用
 * - 提供者注册：自动注册配置类和嵌套配置对象为提供者
 *
 * ### 配置加载规则
 * - 支持单个或多个配置加载器
 * - 配置加载器按顺序执行，后续配置会覆盖前面的配置
 * - 支持同步和异步配置加载器混合使用
 * - 配置加载失败时阻止模块创建
 *
 * ### 配置验证规则
 * - 默认使用 class-validator 进行配置验证
 * - 支持自定义验证函数和验证选项
 * - 验证失败时提供详细的错误信息和堆栈跟踪
 * - 验证通过后返回类型化的配置对象
 *
 * ### 缓存管理规则
 * - 支持可选的配置缓存功能
 * - 缓存键基于配置内容和配置类名称
 * - 支持缓存失效和更新策略
 * - 缓存统计和监控功能
 *
 * @example
 * ```typescript
 * // 同步配置模块创建
 * const syncModule = TypedConfigModule.forRoot({
 *   schema: RootConfig,
 *   load: fileLoader({ path: './config/app.yml' })
 * });
 *
 * // 异步配置模块创建
 * const asyncModule = await TypedConfigModule.forRootAsync({
 *   schema: RootConfig,
 *   load: remoteLoader('http://config-server/api/config')
 * });
 * ```
 */
@Module({})
export class TypedConfigModule {
  /**
   * 创建类型化配置模块
   *
   * 同步创建类型化配置模块，加载和验证配置后返回可用的动态模块。
   * 适用于配置数据已准备好且无需异步加载的场景。
   *
   * @description 此方法执行同步的配置加载、验证和模块创建流程。
   * 支持多个配置加载器的链式调用，后续加载器会覆盖前面的配置。
   * 配置验证失败时会抛出详细的错误信息并阻止模块创建。
   *
   * ## 业务规则
   *
   * ### 配置加载规则
   * - 支持单个或多个同步配置加载器
   * - 配置加载器按数组顺序执行
   * - 后续配置会深度合并到前面的配置中
   * - 配置加载失败时抛出 ConfigError 异常
   *
   * ### 配置验证规则
   * - 使用 class-validator 进行配置验证
   * - 支持自定义验证选项和验证函数
   * - 验证失败时提供详细的错误路径和约束信息
   * - 验证通过后返回类型化的配置对象
   *
   * ### 模块注册规则
   * - 默认注册为全局模块（isGlobal: true）
   * - 自动注册配置类和嵌套配置对象为提供者
   * - 支持可选的缓存管理器注册
   * - 提供者可在整个应用中进行依赖注入
   *
   * ## 业务逻辑流程
   *
   * 1. **配置加载**：执行所有配置加载器获取原始配置
   * 2. **配置合并**：深度合并多个配置加载器的结果
   * 3. **配置标准化**：执行自定义的配置转换逻辑
   * 4. **配置验证**：使用 class-validator 验证配置完整性
   * 5. **提供者创建**：创建配置类和嵌套对象的提供者
   * 6. **缓存初始化**：初始化配置缓存（如果启用）
   * 7. **模块返回**：返回完整的动态模块
   *
   * @param options - 配置模块选项，包含配置类、加载器和验证选项
   * @returns 配置完成的动态模块，可直接导入到 NestJS 应用中
   *
   * @throws {ConfigError} 当配置加载失败时抛出
   * @throws {ValidationError} 当配置验证失败时抛出
   * @throws {Error} 当模块创建过程中发生未知错误时抛出
   *
   * @example
   * ```typescript
   * // 基础用法
   * const module = TypedConfigModule.forRoot({
   *   schema: RootConfig,
   *   load: fileLoader({ path: './config/app.yml' })
   * });
   *
   * // 多加载器用法
   * const module = TypedConfigModule.forRoot({
   *   schema: RootConfig,
   *   load: [
   *     fileLoader({ path: './config/default.yml' }),
   *     dotenvLoader({ separator: '__' }),
   *     fileLoader({ path: './config/local.yml' })
   *   ],
   *   validationOptions: { whitelist: true }
   * });
   *
   * // 自定义验证函数用法
   * const module = TypedConfigModule.forRoot({
   *   schema: RootConfig,
   *   load: fileLoader(),
   *   validate: (config) => {
   *     // 自定义验证逻辑
   *     if (config.port < 1024) {
   *       throw new Error('Port must be >= 1024');
   *     }
   *     return config;
   *   }
   * });
   * ```
   */
  public static forRoot(options: TypedConfigModuleOptions): DynamicModule {
    const rawConfig = this.getRawConfig(options.load);
    return this.getDynamicModule(options, rawConfig);
  }

  /**
   * 异步创建类型化配置模块
   *
   * 异步创建类型化配置模块，支持从远程服务或异步数据源加载配置。
   * 适用于需要从数据库、远程API或其他异步源加载配置的场景。
   *
   * @description 此方法执行异步的配置加载、验证和模块创建流程。
   * 支持异步配置加载器，如远程配置服务、数据库配置等。
   * 配置加载和验证失败时会抛出详细的错误信息并阻止模块创建。
   *
   * ## 业务规则
   *
   * ### 异步加载规则
   * - 支持单个或多个异步配置加载器
   * - 异步加载器按顺序执行，支持 Promise 链式调用
   * - 支持同步和异步加载器混合使用
   * - 异步加载失败时抛出 ConfigError 异常
   *
   * ### 配置合并规则
   * - 多个加载器按数组顺序执行
   * - 后续加载器的配置会深度合并到前面的配置中
   * - 支持配置对象的深度合并和覆盖
   * - 配置合并失败时抛出合并错误
   *
   * ### 错误处理规则
   * - 配置加载失败时提供详细的错误信息
   * - 支持错误上下文和堆栈跟踪
   * - 错误信息包含加载器名称和配置路径
   * - 错误会阻止模块创建和应用启动
   *
   * ## 业务逻辑流程
   *
   * 1. **异步加载**：顺序执行异步配置加载器
   * 2. **配置合并**：深度合并多个配置加载器的结果
   * 3. **配置标准化**：执行自定义的配置转换逻辑
   * 4. **配置验证**：使用 class-validator 验证配置完整性
   * 5. **提供者创建**：创建配置类和嵌套对象的提供者
   * 6. **缓存初始化**：初始化配置缓存（如果启用）
   * 7. **模块返回**：返回完整的动态模块
   *
   * @param options - 异步配置模块选项，包含配置类、异步加载器和验证选项
   * @returns Promise<DynamicModule> 配置完成的动态模块，可直接导入到 NestJS 应用中
   *
   * @throws {ConfigError} 当配置加载失败时抛出
   * @throws {ValidationError} 当配置验证失败时抛出
   * @throws {Error} 当模块创建过程中发生未知错误时抛出
   *
   * @example
   * ```typescript
   * import { TypedConfigModule, fileLoader, dotenvLoader, remoteLoader } from '@hl8/config';
   *
   * // 远程配置加载
   * const module = await TypedConfigModule.forRootAsync({
   *   schema: RootConfig,
   *   load: remoteLoader('http://config-server/api/config')
   * });
   *
   * // 混合加载器用法
   * const module = await TypedConfigModule.forRootAsync({
   *   schema: RootConfig,
   *   load: [
   *     fileLoader({ path: './config/default.yml' }),
   *     remoteLoader('http://config-server/api/config'),
   *     dotenvLoader({ separator: '__' })
   *   ]
   * });
   *
   * // 数据库配置加载
   * const module = await TypedConfigModule.forRootAsync({
   *   schema: RootConfig,
   *   load: async () => {
   *     const config = await database.getConfig('app');
   *     return config;
   *   }
   * });
   * ```
   */
  public static async forRootAsync(
    options: TypedConfigModuleAsyncOptions
  ): Promise<DynamicModule> {
    const rawConfig = await this.getRawConfigAsync(options.load);
    return this.getDynamicModule(options, rawConfig);
  }

  /**
   * 获取动态模块
   *
   * @description 创建动态模块
   * @param options 配置模块选项
   * @param rawConfig 原始配置
   * @returns 动态模块
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static getDynamicModule(
    options: TypedConfigModuleOptions | TypedConfigModuleAsyncOptions,
    rawConfig: ConfigRecord
  ) {
    const {
      schema: Config,
      normalize = identity,
      validationOptions,
      isGlobal = true,
      validate = this.validateWithClassValidator.bind(this),
      cacheOptions,
    } = options;

    if (typeof rawConfig !== 'object') {
      throw new Error(
        `Configuration should be an object, received: ${rawConfig}. Please check the return value of \`load()\``
      );
    }

    const normalized = normalize(rawConfig);
    const config = validate(normalized, Config, validationOptions);
    const providers = this.getProviders(config, Config, cacheOptions);

    return {
      global: isGlobal,
      module: TypedConfigModule,
      providers,
      exports: providers,
    };
  }

  /**
   * 获取原始配置
   *
   * @description 同步获取原始配置
   * @param load 配置加载器
   * @returns 原始配置对象
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static getRawConfig(load: TypedConfigModuleOptions['load']) {
    if (Array.isArray(load)) {
      const config = {};
      for (const fn of load) {
        try {
          const conf = fn(config);
          merge(config, conf);
        } catch (e: any) {
          debug(
            `Config load failed: ${e}. Details: ${JSON.stringify(e.details)}`
          );
          throw e;
        }
      }
      return config;
    }
    return load();
  }

  /**
   * 异步获取原始配置
   *
   * @description 异步获取原始配置
   * @param load 配置加载器
   * @returns Promise<原始配置对象>
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static async getRawConfigAsync(
    load: TypedConfigModuleAsyncOptions['load']
  ) {
    if (Array.isArray(load)) {
      const config = {};
      for (const fn of load) {
        try {
          const conf = await fn(config);
          merge(config, conf);
        } catch (e: any) {
          debug(
            `Config load failed: ${e}. Details: ${JSON.stringify(e.details)}`
          );
          throw e;
        }
      }
      return config;
    }
    return load();
  }

  /**
   * 获取提供者
   *
   * @description 创建配置提供者
   * @param config 配置对象
   * @param Config 配置类
   * @returns 提供者数组
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static getProviders(
    config: any,
    Config: ClassConstructor<any>,
    cacheOptions?: CacheOptions
  ): Provider[] {
    const providers: Provider[] = [
      {
        provide: Config,
        useValue: config,
      },
    ];

    // 添加缓存管理器提供者
    if (cacheOptions) {
      providers.push({
        provide: CacheManager,
        useValue: new CacheManager(cacheOptions),
      });
    }

    forEachDeep(config, (value) => {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value.constructor !== Object
      ) {
        providers.push({ provide: value.constructor, useValue: value });
      }
    });

    return providers;
  }

  /**
   * 使用 class-validator 验证配置
   *
   * @description 使用 class-validator 验证配置
   * @param rawConfig 原始配置
   * @param Config 配置类
   * @param options 验证选项
   * @returns 验证后的配置
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static validateWithClassValidator(
    rawConfig: ConfigRecord,
    Config: ClassConstructor<ConfigRecord>,
    options?: Partial<ValidatorOptions>
  ) {
    const config = plainToClass(Config, rawConfig, {
      exposeDefaultValues: true,
    });

    // 默认使用最严格的验证规则
    const schemaErrors = validateSync(config, {
      forbidUnknownValues: true,
      whitelist: true,
      ...options,
    });

    if (schemaErrors.length > 0) {
      throw ErrorHandler.handleValidationError(schemaErrors, {
        configClass: Config.name,
        rawConfigKeys: Object.keys(rawConfig),
        validationOptions: options,
      });
    }

    return config;
  }

  /**
   * 获取配置错误消息
   *
   * @description 格式化配置错误消息
   * @param errors 验证错误数组
   * @returns 格式化的错误消息
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  static getConfigErrorMessage(errors: ValidationError[]): string {
    const messages = this.formatValidationError(errors)
      .map(({ property, value, constraints }) => {
        const constraintMessage = Object.entries(constraints || {})
          .map(
            ([key, val]) =>
              `    - ${key}: ${yellow(val)}, current config is \`${blue(
                JSON.stringify(value)
              )}\``
          )
          .join(`\n`);
        const msg = [
          `  - config ${cyan(property)} does not match the following rules:`,
          `${constraintMessage}`,
        ].join(`\n`);
        return msg;
      })
      .filter(Boolean)
      .join(`\n`);

    const configErrorMessage = red(
      `Configuration is not valid:\n${messages}\n`
    );
    return configErrorMessage;
  }

  /**
   * 格式化验证错误
   *
   * @description 将 class-validator 返回的验证错误对象转换为更可读的错误消息
   * @param errors 验证错误数组
   * @returns 格式化的错误对象数组
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  private static formatValidationError(errors: ValidationError[]) {
    const result: {
      property: string;
      constraints: ValidationError['constraints'];
      value: ValidationError['value'];
    }[] = [];

    const helper = (
      { property, constraints, children, value }: ValidationError,
      prefix: string
    ) => {
      const keyPath = prefix ? `${prefix}.${property}` : property;
      if (constraints) {
        result.push({
          property: keyPath,
          constraints,
          value,
        });
      }
      if (children && children.length) {
        children.forEach((child) => helper(child, keyPath));
      }
    };

    errors.forEach((error) => helper(error, ''));
    return result;
  }
}
