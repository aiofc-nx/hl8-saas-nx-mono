/**
 * 文件加载器
 *
 * @description 从文件系统加载配置文件的加载器
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ConfigLoader } from '../interfaces/typed-config-module-options.interface';
import { ErrorHandler, ConfigError } from '../errors';
import { ConfigRecord, ConfigParser, EnvSubstitutor } from '../types';

/**
 * 文件加载器选项接口
 *
 * @description 定义文件加载器的选项
 * @interface FileLoaderOptions
 * @since 1.0.0
 */
import { FileLoaderOptions } from '../types/loader.types';

/**
 * 文件加载器
 *
 * @description 从文件系统加载配置文件的加载器
 * @param options 文件加载器选项
 * @returns 配置加载器函数
 * @example
 * ```typescript
 * const loader = fileLoader({
 *   path: './config/app.yml',
 *   ignoreEnvironmentVariableSubstitution: false
 * });
 * ```
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
export const fileLoader = (options: FileLoaderOptions = {}): ConfigLoader => {
  const {
    path: filePath,
    searchFrom = process.cwd(),
    basename = 'config',
    ignoreEnvironmentVariableSubstitution = false,
  } = options;

  return (): ConfigRecord => {
    try {
      const configPath = filePath || findConfigFile(searchFrom, basename);

      if (!configPath) {
        throw ErrorHandler.handleFileNotFoundError(basename, {
          searchFrom,
          filePath,
          basename,
        });
      }

      const content = fs.readFileSync(configPath, 'utf8');
      const ext = path.extname(configPath).toLowerCase();

      let config: ConfigRecord;

      try {
        switch (ext) {
          case '.json':
            config = JSON.parse(content) as ConfigRecord;
            break;
          case '.yml':
          case '.yaml':
            config = yaml.load(content) as ConfigRecord;
            break;
          default:
            throw ErrorHandler.handleFileFormatError(
              new Error(`Unsupported file format: ${ext}`),
              configPath,
              'json, yml, yaml',
              { ext, configPath }
            );
        }
      } catch (error) {
        if (error instanceof ConfigError) {
          throw error;
        }
        throw ErrorHandler.handleParseError(error as Error, content, {
          configPath,
          ext,
        });
      }

      if (!ignoreEnvironmentVariableSubstitution) {
        try {
          config = substituteEnvironmentVariables(config);
        } catch (error) {
          throw ErrorHandler.handleVariableExpansionError(
            error as Error,
            'substituteEnvironmentVariables',
            { configPath, ignoreEnvironmentVariableSubstitution }
          );
        }
      }

      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw ErrorHandler.handleUnknownError(error as Error, {
        searchFrom,
        basename,
        filePath,
      });
    }
  };
};

/**
 * 查找配置文件
 *
 * @description 在指定目录中查找配置文件
 * @param searchFrom 搜索目录
 * @param basename 文件名
 * @returns 配置文件路径或 null
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
function findConfigFile(searchFrom: string, basename: string): string | null {
  const extensions = ['.json', '.yml', '.yaml'];

  for (const ext of extensions) {
    const filePath = path.join(searchFrom, `${basename}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

/**
 * 替换环境变量
 *
 * @description 在配置对象中替换环境变量
 * @param config 配置对象
 * @returns 替换后的配置对象
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */
function substituteEnvironmentVariables(config: ConfigRecord): ConfigRecord {
  if (typeof config === 'string') {
    return (config as string).replace(
      /\$\{([^}]+)\}/g,
      (match: string, key: string) => {
        const value = process.env[key];
        return value !== undefined ? value : match;
      }
    ) as unknown as ConfigRecord;
  }

  if (Array.isArray(config)) {
    return config.map(
      substituteEnvironmentVariables
    ) as unknown as ConfigRecord;
  }

  if (config && typeof config === 'object') {
    const result: ConfigRecord = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = substituteEnvironmentVariables(value as ConfigRecord);
    }
    return result;
  }

  return config;
}
