/**
 * 缓存键生成器工具
 *
 * @description 提供各种缓存键生成策略
 * 支持基于参数、对象属性、哈希等生成缓存键
 *
 * @since 1.0.0
 */

import { CacheKeyGenerator } from '../types/cache.types';

/**
 * 默认键生成器
 *
 * @description 基于所有参数的默认键生成器
 */
export const defaultKeyGenerator: CacheKeyGenerator = (args: any[]) => {
  if (args.length === 0) {
    return 'no-args';
  }

  return args
    .map((arg) => {
      if (arg === null || arg === undefined) {
        return 'null';
      }

      if (
        typeof arg === 'string' ||
        typeof arg === 'number' ||
        typeof arg === 'boolean'
      ) {
        return String(arg);
      }

      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return '[object]';
        }
      }

      return String(arg);
    })
    .join(':');
};

/**
 * 第一个参数键生成器
 *
 * @description 基于第一个参数的键生成器
 */
export const firstArgKeyGenerator: CacheKeyGenerator = (args: any[]) => {
  if (args.length === 0) {
    return 'no-args';
  }

  const firstArg = args[0];
  if (firstArg === null || firstArg === undefined) {
    return 'null';
  }

  if (
    typeof firstArg === 'string' ||
    typeof firstArg === 'number' ||
    typeof firstArg === 'boolean'
  ) {
    return String(firstArg);
  }

  if (typeof firstArg === 'object') {
    try {
      return JSON.stringify(firstArg);
    } catch {
      return '[object]';
    }
  }

  return String(firstArg);
};

/**
 * 对象属性键生成器
 *
 * @description 基于对象特定属性的键生成器
 */
export function objectPropsKeyGenerator(props: string[]): CacheKeyGenerator {
  return (args: any[]) => {
    if (args.length === 0) {
      return 'no-args';
    }

    const obj = args[0];
    if (!obj || typeof obj !== 'object') {
      return 'invalid-object';
    }

    return props
      .map((prop) => {
        const value = obj[prop];
        if (value === null || value === undefined) {
          return `${prop}=null`;
        }
        return `${prop}=${String(value)}`;
      })
      .join(':');
  };
}

/**
 * 哈希键生成器
 *
 * @description 基于参数哈希的键生成器
 */
export const hashKeyGenerator: CacheKeyGenerator = (args: any[]) => {
  const str = JSON.stringify(args);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
};

/**
 * 时间窗口键生成器
 *
 * @description 基于时间窗口的键生成器
 */
export function timeWindowKeyGenerator(
  windowSize: number, // 窗口大小（毫秒）
  baseGenerator: CacheKeyGenerator = defaultKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    const baseKey = baseGenerator(args);
    const now = Date.now();
    const window = Math.floor(now / windowSize);

    return `${baseKey}:window:${window}`;
  };
}

/**
 * 租户键生成器
 *
 * @description 基于租户ID的键生成器
 */
export function tenantKeyGenerator(
  tenantId: string,
  baseGenerator: CacheKeyGenerator = defaultKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    const baseKey = baseGenerator(args);
    return `tenant:${tenantId}:${baseKey}`;
  };
}

/**
 * 用户键生成器
 *
 * @description 基于用户ID的键生成器
 */
export function userKeyGenerator(
  userId: string,
  baseGenerator: CacheKeyGenerator = defaultKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    const baseKey = baseGenerator(args);
    return `user:${userId}:${baseKey}`;
  };
}

/**
 * 版本键生成器
 *
 * @description 基于版本的键生成器
 */
export function versionKeyGenerator(
  version: string,
  baseGenerator: CacheKeyGenerator = defaultKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    const baseKey = baseGenerator(args);
    return `v${version}:${baseKey}`;
  };
}

/**
 * 环境键生成器
 *
 * @description 基于环境的键生成器
 */
export function environmentKeyGenerator(
  environment: string,
  baseGenerator: CacheKeyGenerator = defaultKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    const baseKey = baseGenerator(args);
    return `${environment}:${baseKey}`;
  };
}

/**
 * 组合键生成器
 *
 * @description 组合多个键生成器
 */
export function combineKeyGenerators(
  generators: CacheKeyGenerator[],
  separator: string = ':'
): CacheKeyGenerator {
  return (args: any[]) => {
    return generators.map((generator) => generator(args)).join(separator);
  };
}

/**
 * 条件键生成器
 *
 * @description 基于条件的键生成器
 */
export function conditionalKeyGenerator(
  condition: (args: any[]) => boolean,
  trueGenerator: CacheKeyGenerator,
  falseGenerator: CacheKeyGenerator
): CacheKeyGenerator {
  return (args: any[]) => {
    return condition(args) ? trueGenerator(args) : falseGenerator(args);
  };
}

/**
 * 缓存键生成器工厂
 *
 * @description 提供预定义的键生成器工厂
 */
export const KeyGeneratorFactory = {
  /**
   * 创建基于ID的键生成器
   */
  createIdKeyGenerator: (idField: string = 'id'): CacheKeyGenerator => {
    return objectPropsKeyGenerator([idField]);
  },

  /**
   * 创建基于多个字段的键生成器
   */
  createMultiFieldKeyGenerator: (fields: string[]): CacheKeyGenerator => {
    return objectPropsKeyGenerator(fields);
  },

  /**
   * 创建基于查询参数的键生成器
   */
  createQueryKeyGenerator: (): CacheKeyGenerator => {
    return (args: any[]) => {
      if (args.length === 0) {
        return 'no-query';
      }

      const query = args[0];
      if (!query || typeof query !== 'object') {
        return 'invalid-query';
      }

      // 排序键以确保一致性
      const sortedKeys = Object.keys(query).sort();
      return sortedKeys.map((key) => `${key}=${query[key]}`).join('&');
    };
  },

  /**
   * 创建基于分页的键生成器
   */
  createPaginationKeyGenerator: (): CacheKeyGenerator => {
    return (args: any[]) => {
      if (args.length === 0) {
        return 'no-pagination';
      }

      const pagination = args[0];
      if (!pagination || typeof pagination !== 'object') {
        return 'invalid-pagination';
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = pagination.offset || 0;

      return `page:${page}:limit:${limit}:offset:${offset}`;
    };
  },

  /**
   * 创建基于时间范围的键生成器
   */
  createTimeRangeKeyGenerator: (): CacheKeyGenerator => {
    return (args: any[]) => {
      if (args.length === 0) {
        return 'no-time-range';
      }

      const timeRange = args[0];
      if (!timeRange || typeof timeRange !== 'object') {
        return 'invalid-time-range';
      }

      const start = timeRange.start || timeRange.from;
      const end = timeRange.end || timeRange.to;

      if (!start || !end) {
        return 'incomplete-time-range';
      }

      return `time:${start}:${end}`;
    };
  },
};

/**
 * 键生成器验证器
 *
 * @description 验证生成的键是否符合要求
 */
export class KeyGeneratorValidator {
  private static readonly MAX_KEY_LENGTH = 250; // Redis键长度限制
  private static readonly INVALID_CHARS = /[\s\n\r\t]/g;

  /**
   * 验证键是否有效
   */
  static validate(key: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!key || key.length === 0) {
      errors.push('键不能为空');
    }

    if (key.length > this.MAX_KEY_LENGTH) {
      errors.push(`键长度超过限制 (${this.MAX_KEY_LENGTH})`);
    }

    if (this.INVALID_CHARS.test(key)) {
      errors.push('键包含无效字符');
    }

    if (key.includes(' ')) {
      errors.push('键不能包含空格');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 清理键
   */
  static sanitize(key: string): string {
    return key
      .replace(this.INVALID_CHARS, '_')
      .substring(0, this.MAX_KEY_LENGTH);
  }
}
