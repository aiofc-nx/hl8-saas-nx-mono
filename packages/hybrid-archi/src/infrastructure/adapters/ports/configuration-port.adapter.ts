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
import { ConfigService } from '@hl8/config';
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
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取配置值
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    return this.configService.get(key, defaultValue);
  }

  /**
   * 获取字符串配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 字符串配置值
   */
  getString(key: string, defaultValue?: string): string {
    return this.configService.get<string>(key, defaultValue);
  }

  /**
   * 获取数字配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 数字配置值
   */
  getNumber(key: string, defaultValue?: number): number {
    return this.configService.get<number>(key, defaultValue);
  }

  /**
   * 获取布尔配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 布尔配置值
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    return this.configService.get<boolean>(key, defaultValue);
  }

  /**
   * 获取对象配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 对象配置值
   */
  getObject<T = Record<string, unknown>>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }

  /**
   * 获取数组配置
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 数组配置值
   */
  getArray<T = unknown[]>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }

  /**
   * 检查配置是否存在
   *
   * @param key - 配置键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.configService.has(key);
  }

  /**
   * 获取所有配置
   *
   * @returns 所有配置
   */
  getAll(): Record<string, unknown> {
    return this.configService.getAll();
  }

  /**
   * 获取配置键列表
   *
   * @returns 配置键列表
   */
  getKeys(): string[] {
    return this.configService.getKeys();
  }

  /**
   * 获取配置值列表
   *
   * @returns 配置值列表
   */
  getValues(): unknown[] {
    return this.configService.getValues();
  }

  /**
   * 获取配置条目
   *
   * @returns 配置条目
   */
  getEntries(): Array<[string, unknown]> {
    return this.configService.getEntries();
  }

  /**
   * 设置配置值
   *
   * @param key - 配置键
   * @param value - 配置值
   */
  set(key: string, value: unknown): void {
    this.configService.set(key, value);
  }

  /**
   * 删除配置
   *
   * @param key - 配置键
   */
  delete(key: string): void {
    this.configService.delete(key);
  }

  /**
   * 清空所有配置
   */
  clear(): void {
    this.configService.clear();
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
