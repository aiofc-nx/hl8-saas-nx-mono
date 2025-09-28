/**
 * 类型化配置模块选项接口
 *
 * @description 定义类型化配置模块的选项
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import type { ClassConstructor } from 'class-transformer';
import type { ValidatorOptions } from 'class-validator';
import {
  ConfigLoader,
  AsyncConfigLoader,
  ConfigRecord,
  ConfigNormalizer,
  ConfigValidator,
} from '../types';
import { CacheOptions } from '../types/cache.types';

// 重新导出类型以保持向后兼容
export type {
  ConfigLoader,
  AsyncConfigLoader,
  ConfigRecord,
  ConfigNormalizer,
  ConfigValidator,
} from '../types';

/**
 * 类型化配置模块选项接口
 *
 * @description 定义类型化配置模块的选项
 * @interface TypedConfigModuleOptions
 * @since 1.0.0
 */
export interface TypedConfigModuleOptions {
  /**
   * 应用配置的根对象类
   * @description 配置的根类，用于类型推断和验证
   */
  schema: ClassConstructor<ConfigRecord>;

  /**
   * 加载配置的函数，必须是同步的
   * @description 配置加载器函数或函数数组
   */
  load: ConfigLoader | ConfigLoader[];

  /**
   * 是否为全局模块
   * @description 默认为 true，将 ConfigModule 注册为全局模块
   * @default true
   */
  isGlobal?: boolean;

  /**
   * 自定义配置标准化函数
   * @description 在验证之前执行，用于类型转换、变量展开等
   * @param config 包含环境变量的配置对象
   * @returns 标准化后的配置对象
   */
  normalize?: ConfigNormalizer;

  /**
   * 自定义配置验证函数
   * @description 验证配置的函数，如果抛出异常将阻止应用启动
   * @param config 配置对象
   * @returns 验证后的配置对象
   */
  validate?: ConfigValidator;

  /**
   * 验证器选项
   * @description 传递给验证器的选项
   * @see https://github.com/typestack/class-validator
   */
  validationOptions?: ValidatorOptions;

  /**
   * 缓存选项
   * @description 配置缓存选项
   */
  cacheOptions?: CacheOptions;
}

/**
 * 异步类型化配置模块选项接口
 *
 * @description 定义异步类型化配置模块的选项
 * @interface TypedConfigModuleAsyncOptions
 * @extends TypedConfigModuleOptions
 * @since 1.0.0
 */
export interface TypedConfigModuleAsyncOptions {
  /**
   * 应用配置的根对象类
   * @description 配置的根类，用于类型推断和验证
   */
  schema: ClassConstructor<ConfigRecord>;

  /**
   * 加载配置的函数，可以是同步或异步的
   * @description 配置加载器函数或函数数组
   */
  load: ConfigLoader | AsyncConfigLoader | (ConfigLoader | AsyncConfigLoader)[];

  /**
   * 是否为全局模块
   * @description 默认为 true，将 ConfigModule 注册为全局模块
   * @default true
   */
  isGlobal?: boolean;

  /**
   * 自定义配置标准化函数
   * @description 在验证之前执行，用于类型转换、变量展开等
   * @param config 包含环境变量的配置对象
   * @returns 标准化后的配置对象
   */
  normalize?: ConfigNormalizer;

  /**
   * 自定义配置验证函数
   * @description 验证配置的函数，如果抛出异常将阻止应用启动
   * @param config 配置对象
   * @returns 验证后的配置对象
   */
  validate?: ConfigValidator;

  /**
   * 验证器选项
   * @description 传递给验证器的选项
   * @see https://github.com/typestack/class-validator
   */
  validationOptions?: ValidatorOptions;

  /**
   * 缓存选项
   * @description 配置缓存选项
   */
  cacheOptions?: CacheOptions;
}
