/**
 * 类型化配置模块
 *
 * @description 提供完全类型安全的配置管理模块
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
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
 * @description 提供完全类型安全的配置管理模块
 * @class TypedConfigModule
 * @since 1.0.0
 */
@Module({})
export class TypedConfigModule {
  /**
   * 创建类型化配置模块
   *
   * @description 同步创建类型化配置模块
   * @param options 配置模块选项
   * @returns 动态模块
   * @example
   * ```typescript
   * const module = TypedConfigModule.forRoot({
   *   schema: RootConfig,
   *   load: fileLoader(),
   * });
   * ```
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
   */
  public static forRoot(options: TypedConfigModuleOptions): DynamicModule {
    const rawConfig = this.getRawConfig(options.load);
    return this.getDynamicModule(options, rawConfig);
  }

  /**
   * 异步创建类型化配置模块
   *
   * @description 异步创建类型化配置模块
   * @param options 配置模块选项
   * @returns Promise<DynamicModule>
   * @example
   * ```typescript
   * const module = await TypedConfigModule.forRootAsync({
   *   schema: RootConfig,
   *   load: remoteLoader('http://config-server'),
   * });
   * ```
   * @author HL8 SAAS Platform Team
   * @since 1.0.0
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
