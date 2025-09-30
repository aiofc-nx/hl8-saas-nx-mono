/**
 * 序列化器工具
 *
 * @description 提供数据序列化和反序列化功能
 * 支持JSON、MessagePack、自定义序列化等
 *
 * @since 1.0.0
 */

import { Serializer } from '../types/cache.types';

/**
 * JSON序列化器
 *
 * @description 基于JSON的序列化器
 */
export class JsonSerializer implements Serializer {
  /**
   * 序列化
   */
  serialize(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new Error(`JSON序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化
   */
  deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`JSON反序列化失败: ${(error as Error).message}`);
    }
  }
}

/**
 * 压缩JSON序列化器
 *
 * @description 基于JSON的压缩序列化器
 */
export class CompressedJsonSerializer implements Serializer {
  /**
   * 序列化
   */
  serialize(value: any): string {
    try {
      const json = JSON.stringify(value);
      // 简单的压缩：移除不必要的空格
      return json.replace(/\s+/g, ' ').trim();
    } catch (error) {
      throw new Error(`压缩JSON序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化
   */
  deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`压缩JSON反序列化失败: ${(error as Error).message}`);
    }
  }
}

/**
 * 安全序列化器
 *
 * @description 提供安全的序列化，处理循环引用
 */
export class SafeJsonSerializer implements Serializer {
  private readonly maxDepth: number;
  private readonly circularRefMarker: string;

  constructor(maxDepth: number = 10, circularRefMarker: string = '[Circular]') {
    this.maxDepth = maxDepth;
    this.circularRefMarker = circularRefMarker;
  }

  /**
   * 序列化
   */
  serialize(value: any): string {
    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return this.circularRefMarker;
          }
          seen.add(val);
        }
        return val;
      });
    } catch (error) {
      throw new Error(`安全JSON序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化
   */
  deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`安全JSON反序列化失败: ${(error as Error).message}`);
    }
  }
}

/**
 * 类型化序列化器
 *
 * @description 支持类型信息的序列化器
 */
export class TypedJsonSerializer implements Serializer {
  /**
   * 序列化
   */
  serialize(value: any): string {
    try {
      const type = this.getType(value);
      const data = JSON.stringify(value);
      return JSON.stringify({ type, data });
    } catch (error) {
      throw new Error(`类型化JSON序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化
   */
  deserialize(value: string): any {
    try {
      const { type, data } = JSON.parse(value);
      const result = JSON.parse(data);

      // 根据类型进行转换
      return this.convertType(result, type);
    } catch (error) {
      throw new Error(`类型化JSON反序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取类型
   */
  private getType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    return 'object';
  }

  /**
   * 转换类型
   */
  private convertType(value: any, type: string): any {
    switch (type) {
      case 'null':
        return null;
      case 'undefined':
        return undefined;
      case 'boolean':
        return Boolean(value);
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'date':
        return new Date(value);
      case 'regexp':
        return new RegExp(value);
      case 'object':
        return value;
      default:
        return value;
    }
  }
}

/**
 * 自定义序列化器
 *
 * @description 支持自定义序列化逻辑的序列化器
 */
export class CustomSerializer implements Serializer {
  private readonly serializeFn: (value: any) => string;
  private readonly deserializeFn: (value: string) => any;

  constructor(
    serializeFn: (value: any) => string,
    deserializeFn: (value: string) => any
  ) {
    this.serializeFn = serializeFn;
    this.deserializeFn = deserializeFn;
  }

  /**
   * 序列化
   */
  serialize(value: any): string {
    try {
      return this.serializeFn(value);
    } catch (error) {
      throw new Error(`自定义序列化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 反序列化
   */
  deserialize(value: string): any {
    try {
      return this.deserializeFn(value);
    } catch (error) {
      throw new Error(`自定义反序列化失败: ${(error as Error).message}`);
    }
  }
}

/**
 * 序列化器工厂
 *
 * @description 提供预定义的序列化器工厂
 */
export class SerializerFactory {
  /**
   * 创建JSON序列化器
   */
  static createJsonSerializer(): JsonSerializer {
    return new JsonSerializer();
  }

  /**
   * 创建压缩JSON序列化器
   */
  static createCompressedJsonSerializer(): CompressedJsonSerializer {
    return new CompressedJsonSerializer();
  }

  /**
   * 创建安全JSON序列化器
   */
  static createSafeJsonSerializer(maxDepth?: number): SafeJsonSerializer {
    return new SafeJsonSerializer(maxDepth);
  }

  /**
   * 创建类型化JSON序列化器
   */
  static createTypedJsonSerializer(): TypedJsonSerializer {
    return new TypedJsonSerializer();
  }

  /**
   * 创建自定义序列化器
   */
  static createCustomSerializer(
    serializeFn: (value: any) => string,
    deserializeFn: (value: string) => any
  ): CustomSerializer {
    return new CustomSerializer(serializeFn, deserializeFn);
  }

  /**
   * 创建Base64序列化器
   */
  static createBase64Serializer(): CustomSerializer {
    return new CustomSerializer(
      (value: any) => {
        const json = JSON.stringify(value);
        return Buffer.from(json, 'utf8').toString('base64');
      },
      (value: string) => {
        const json = Buffer.from(value, 'base64').toString('utf8');
        return JSON.parse(json);
      }
    );
  }

  /**
   * 创建URL安全序列化器
   */
  static createUrlSafeSerializer(): CustomSerializer {
    return new CustomSerializer(
      (value: any) => {
        const json = JSON.stringify(value);
        return Buffer.from(json, 'utf8').toString('base64url');
      },
      (value: string) => {
        const json = Buffer.from(value, 'base64url').toString('utf8');
        return JSON.parse(json);
      }
    );
  }
}

/**
 * 序列化器管理器
 *
 * @description 管理多个序列化器
 */
export class SerializerManager {
  private readonly serializers: Map<string, Serializer> = new Map();
  private readonly defaultSerializer: Serializer;

  constructor(defaultSerializer: Serializer = new JsonSerializer()) {
    this.defaultSerializer = defaultSerializer;
    this.registerDefaultSerializers();
  }

  /**
   * 注册序列化器
   */
  register(name: string, serializer: Serializer): void {
    this.serializers.set(name, serializer);
  }

  /**
   * 获取序列化器
   */
  get(name: string): Serializer {
    return this.serializers.get(name) || this.defaultSerializer;
  }

  /**
   * 序列化
   */
  serialize(value: any, serializerName?: string): string {
    const serializer = serializerName
      ? this.get(serializerName)
      : this.defaultSerializer;
    return serializer.serialize(value);
  }

  /**
   * 反序列化
   */
  deserialize(value: string, serializerName?: string): any {
    const serializer = serializerName
      ? this.get(serializerName)
      : this.defaultSerializer;
    return serializer.deserialize(value);
  }

  /**
   * 注册默认序列化器
   */
  private registerDefaultSerializers(): void {
    this.register('json', new JsonSerializer());
    this.register('compressed', new CompressedJsonSerializer());
    this.register('safe', new SafeJsonSerializer());
    this.register('typed', new TypedJsonSerializer());
    this.register('base64', SerializerFactory.createBase64Serializer());
    this.register('urlsafe', SerializerFactory.createUrlSafeSerializer());
  }
}

/**
 * 默认序列化器实例
 */
export const defaultSerializer = new JsonSerializer();
export const safeSerializer = new SafeJsonSerializer();
export const typedSerializer = new TypedJsonSerializer();
export const compressedSerializer = new CompressedJsonSerializer();

/**
 * 序列化器工具函数
 */
export const SerializerUtils = {
  /**
   * 检查是否可序列化
   */
  isSerializable(value: any): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 获取序列化大小
   */
  getSerializedSize(
    value: any,
    serializer: Serializer = defaultSerializer
  ): number {
    try {
      const serialized = serializer.serialize(value);
      return Buffer.byteLength(serialized, 'utf8');
    } catch {
      return 0;
    }
  },

  /**
   * 比较序列化结果
   */
  compareSerialized(
    a: any,
    b: any,
    serializer: Serializer = defaultSerializer
  ): boolean {
    try {
      const serializedA = serializer.serialize(a);
      const serializedB = serializer.serialize(b);
      return serializedA === serializedB;
    } catch {
      return false;
    }
  },
};
