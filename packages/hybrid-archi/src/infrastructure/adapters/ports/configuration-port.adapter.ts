/**
 * 配置端口适配器
 *
 * 实现应用层配置端口接口，提供统一的配置管理能力。
 * 作为通用功能组件，支持多种配置源和配置格式。
 *
 * @description 配置端口适配器实现应用层配置管理需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { TypedConfigModule } from '@hl8/config';
import { IConfigurationPort } from '../../../application/ports/shared/shared-ports.interface';

/**
 * 配置类型枚举
 */
export enum ConfigurationType {
  /** 字符串配置 */
  STRING = 'string',
  /** 数字配置 */
  NUMBER = 'number',
  /** 布尔配置 */
  BOOLEAN = 'boolean',
  /** 对象配置 */
  OBJECT = 'object',
  /** 数组配置 */
  ARRAY = 'array',
}

/**
 * 配置端口适配器
 *
 * 实现应用层配置端口接口
 */
@Injectable()
export class ConfigurationPortAdapter implements IConfigurationPort {
  constructor(private readonly configService: TypedConfigModule) {}

  /**
   * 获取配置值
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    // 检查ConfigService是否有get方法
    if (typeof (this.configService as { get?: (key: string, defaultValue?: T) => T }).get === 'function') {
      return (this.configService as { get: (key: string, defaultValue?: T) => T }).get(key, defaultValue);
    } else {
      console.warn('ConfigService不支持get方法');
      return defaultValue as T;
    }
  }

  /**
   * 获取字符串配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 字符串配置值
   */
  getString(key: string, defaultValue?: string): string {
    return this.get<string>(key, defaultValue);
  }

  /**
   * 获取数字配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 数字配置值
   */
  getNumber(key: string, defaultValue?: number): number {
    return this.get<number>(key, defaultValue);
  }

  /**
   * 获取布尔配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 布尔配置值
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    return this.get<boolean>(key, defaultValue);
  }

  /**
   * 获取对象配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 对象配置值
   */
  getObject<T = Record<string, unknown>>(key: string, defaultValue?: T): T {
    return this.get<T>(key, defaultValue);
  }

  /**
   * 获取数组配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 数组配置值
   */
  getArray<T = unknown[]>(key: string, defaultValue?: T): T {
    return this.get<T>(key, defaultValue);
  }

  /**
   * 检查配置是否存在
   *
   * @param key - 配置键
   * @returns 是否存在
   */
  has(key: string): boolean {
    // 检查ConfigService是否有has方法
    if (typeof (this.configService as { has?: (key: string) => boolean }).has === 'function') {
      return (this.configService as { has: (key: string) => boolean }).has(key);
    } else {
      console.warn('ConfigService不支持has方法');
      return false;
    }
  }

  /**
   * 获取所有配置
   *
   * @returns 所有配置
   */
  getAll(): Record<string, unknown> {
    // 检查ConfigService是否有getAll方法
    if (typeof (this.configService as { getAll?: () => Record<string, unknown> }).getAll === 'function') {
      return (this.configService as { getAll: () => Record<string, unknown> }).getAll();
    } else {
      console.warn('ConfigService不支持getAll方法');
      return {};
    }
  }

  /**
   * 获取配置键列表
   *
   * @returns 配置键列表
   */
  getKeys(): string[] {
    // 检查ConfigService是否有getKeys方法
    if (typeof (this.configService as { getKeys?: () => string[] }).getKeys === 'function') {
      return (this.configService as { getKeys: () => string[] }).getKeys();
    } else {
      console.warn('ConfigService不支持getKeys方法');
      return [];
    }
  }

  /**
   * 获取配置值列表
   *
   * @returns 配置值列表
   */
  getValues(): unknown[] {
    // 检查ConfigService是否有getValues方法
    if (typeof (this.configService as { getValues?: () => unknown[] }).getValues === 'function') {
      return (this.configService as { getValues: () => unknown[] }).getValues();
    } else {
      console.warn('ConfigService不支持getValues方法');
      return [];
    }
  }

  /**
   * 获取配置条目
   *
   * @returns 配置条目
   */
  getEntries(): Array<[string, unknown]> {
    // 检查ConfigService是否有getEntries方法
    if (typeof (this.configService as { getEntries?: () => Array<[string, unknown]> }).getEntries === 'function') {
      return (this.configService as { getEntries: () => Array<[string, unknown]> }).getEntries();
    } else {
      console.warn('ConfigService不支持getEntries方法');
      return [];
    }
  }

  /**
   * 设置配置值
   *
   * @param key - 配置键
   * @param value - 配置值
   */
  set(key: string, value: unknown): void {
    // 检查ConfigService是否有set方法
    if (typeof (this.configService as { set?: (key: string, value: unknown) => void }).set === 'function') {
      (this.configService as { set: (key: string, value: unknown) => void }).set(key, value);
    } else {
      console.warn('ConfigService不支持set方法');
    }
  }

  /**
   * 删除配置
   *
   * @param key - 配置键
   */
  delete(key: string): void {
    // 检查ConfigService是否有delete方法
    if (typeof (this.configService as { delete?: (key: string) => void }).delete === 'function') {
      (this.configService as { delete: (key: string) => void }).delete(key);
    } else {
      console.warn('ConfigService不支持delete方法');
    }
  }

  /**
   * 清空所有配置
   */
  clear(): void {
    // 检查ConfigService是否有clear方法
    if (typeof (this.configService as { clear?: () => void }).clear === 'function') {
      (this.configService as { clear: () => void }).clear();
    } else {
      console.warn('ConfigService不支持clear方法');
    }
  }

  /**
   * 检查配置是否有效
   *
   * @param key - 配置键
   * @param type - 配置类型
   * @returns 是否有效
   */
  isValid(key: string, type: ConfigurationType): boolean {
    const value = this.get(key);

    switch (type) {
      case ConfigurationType.STRING:
        return typeof value === 'string';
      case ConfigurationType.NUMBER:
        return typeof value === 'number' && !isNaN(value);
      case ConfigurationType.BOOLEAN:
        return typeof value === 'boolean';
      case ConfigurationType.OBJECT:
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      case ConfigurationType.ARRAY:
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 获取配置类型
   *
   * @param key - 配置键
   * @returns 配置类型
   */
  getType(key: string): ConfigurationType {
    const value = this.get(key);

    if (typeof value === 'string') {
      return ConfigurationType.STRING;
    } else if (typeof value === 'number') {
      return ConfigurationType.NUMBER;
    } else if (typeof value === 'boolean') {
      return ConfigurationType.BOOLEAN;
    } else if (Array.isArray(value)) {
      return ConfigurationType.ARRAY;
    } else if (typeof value === 'object' && value !== null) {
      return ConfigurationType.OBJECT;
    } else {
      return ConfigurationType.STRING;
    }
  }

  /**
   * 获取配置大小
   *
   * @param key - 配置键
   * @returns 配置大小
   */
  getSize(key: string): number {
    const value = this.get(key);

    if (typeof value === 'string') {
      return value.length;
    } else if (Array.isArray(value)) {
      return value.length;
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    } else {
      return 1;
    }
  }

  /**
   * 监听配置变化
   *
   * @param key - 配置键
   * @param callback - 变化回调
   */
  watch(
    key: string,
    _callback: (newValue: unknown, oldValue: unknown) => void
  ): void {
    // 这里需要实现配置监听逻辑
    // 由于 TypedConfigModule 可能不支持监听，这里提供一个基础实现
    console.warn(`配置监听功能暂未实现: ${key}`);
  }

  /**
   * 获取配置摘要
   *
   * @returns 配置摘要
   */
  getSummary(): {
    totalKeys: number;
    totalValues: number;
    types: Record<ConfigurationType, number>;
    size: number;
  } {
    const keys = this.getKeys();
    const values = this.getValues();
    const types: Record<ConfigurationType, number> = {
      [ConfigurationType.STRING]: 0,
      [ConfigurationType.NUMBER]: 0,
      [ConfigurationType.BOOLEAN]: 0,
      [ConfigurationType.OBJECT]: 0,
      [ConfigurationType.ARRAY]: 0,
    };

    let totalSize = 0;

    for (const key of keys) {
      const type = this.getType(key);
      types[type]++;
      totalSize += this.getSize(key);
    }

    return {
      totalKeys: keys.length,
      totalValues: values.length,
      types,
      size: totalSize,
    };
  }
}
