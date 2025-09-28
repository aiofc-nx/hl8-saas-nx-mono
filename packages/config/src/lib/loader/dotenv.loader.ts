/**
 * 环境变量加载器
 *
 * @description 从环境变量加载配置的加载器
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { ConfigLoader } from '../interfaces/typed-config-module-options.interface';
import { ErrorHandler, ConfigError } from '../errors';
import { ConfigRecord, KeyTransformer } from '../types';

/**
 * 环境变量加载器选项接口
 *
 * @description 定义环境变量加载器的选项
 * @interface DotenvLoaderOptions
 * @since 1.0.0
 */
import { DotenvLoaderOptions } from '../types/loader.types';

/**
 * 环境变量加载器
 *
 * @description 从环境变量加载配置的加载器
 * @param options 环境变量加载器选项
 * @returns 配置加载器函数
 * @example
 * ```typescript
 * const loader = dotenvLoader({
 *   envFilePath: '.env',
 *   separator: '__',
 *   keyTransformer: (key) => key.toLowerCase()
 * });
 * ```
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
export const dotenvLoader = (
  options: DotenvLoaderOptions = {}
): ConfigLoader => {
  const {
    envFilePath,
    ignoreEnvFile = false,
    ignoreEnvVars = false,
    separator,
    keyTransformer,
    enableExpandVariables = true,
  } = options;

  return (): ConfigRecord => {
    let config: ConfigRecord = {};

    // 加载环境变量文件
    if (!ignoreEnvFile && envFilePath) {
      try {
        const result = dotenv.config({ path: envFilePath });
        if (result.error) {
          throw ErrorHandler.handleFileLoadError(
            result.error,
            Array.isArray(envFilePath) ? envFilePath.join(', ') : envFilePath,
            { ignoreEnvFile, ignoreEnvVars }
          );
        }
        config = { ...config, ...result.parsed };
      } catch (error) {
        if (error instanceof ConfigError) {
          throw error;
        }
        throw ErrorHandler.handleFileLoadError(
          error as Error,
          Array.isArray(envFilePath) ? envFilePath.join(', ') : envFilePath,
          { ignoreEnvFile, ignoreEnvVars }
        );
      }
    }

    // 加载环境变量
    if (!ignoreEnvVars) {
      config = { ...config, ...process.env };
    }

    // 展开变量
    if (enableExpandVariables) {
      try {
        config = expandVariables(config);
      } catch (error) {
        throw ErrorHandler.handleVariableExpansionError(
          error as Error,
          'expandVariables',
          { enableExpandVariables, configKeys: Object.keys(config) }
        );
      }
    }

    // 应用键转换器
    if (keyTransformer) {
      config = transformKeys(config, keyTransformer);
    }

    // 应用分隔符解析
    if (separator) {
      config = parseWithSeparator(config, separator);
    }

    return config;
  };
};

/**
 * 展开变量
 *
 * @description 展开配置中的变量引用
 * @param config 配置对象
 * @returns 展开后的配置对象
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
function expandVariables(config: ConfigRecord): ConfigRecord {
  const expanded = dotenvExpand.expand({
    parsed: config as Record<string, string>,
  });
  return (expanded.parsed || config) as ConfigRecord;
}

/**
 * 转换键
 *
 * @description 转换配置对象的键
 * @param config 配置对象
 * @param transformer 键转换器
 * @returns 转换后的配置对象
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
function transformKeys(
  config: ConfigRecord,
  transformer: KeyTransformer
): ConfigRecord {
  const result: ConfigRecord = {};
  for (const [key, value] of Object.entries(config)) {
    const transformedKey = transformer(key);
    result[transformedKey] = value as ConfigRecord;
  }
  return result;
}

/**
 * 使用分隔符解析
 *
 * @description 使用分隔符将扁平化的键解析为嵌套对象
 * @param config 配置对象
 * @param separator 分隔符
 * @returns 解析后的配置对象
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
function parseWithSeparator(
  config: ConfigRecord,
  separator: string
): ConfigRecord {
  const result: ConfigRecord = {};

  for (const [key, value] of Object.entries(config)) {
    const keys = key.split(separator);
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k] as ConfigRecord;
    }

    current[keys[keys.length - 1]] = value as ConfigRecord;
  }

  return result;
}
