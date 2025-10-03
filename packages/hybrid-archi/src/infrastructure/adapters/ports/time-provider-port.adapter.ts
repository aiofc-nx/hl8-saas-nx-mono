/**
 * 时间提供端口适配器
 *
 * 实现应用层时间提供端口接口，提供统一的时间服务能力。
 * 作为通用功能组件，支持多种时间格式和时区处理。
 *
 * @description 时间提供端口适配器实现应用层时间服务需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { ITimeProviderPort } from '../../../application/ports/shared/shared-ports.interface';

/**
 * 时间格式枚举
 */
export enum TimeFormat {
  /** ISO 8601格式 */
  ISO_8601 = 'iso8601',
  /** Unix时间戳（秒） */
  UNIX_TIMESTAMP = 'unix_timestamp',
  /** Unix时间戳（毫秒） */
  UNIX_TIMESTAMP_MS = 'unix_timestamp_ms',
  /** 自定义格式 */
  CUSTOM = 'custom',
}

/**
 * 时区配置接口
 */
export interface ITimezoneConfig {
  /** 时区标识符 */
  timezone: string;
  /** 是否使用UTC */
  useUTC: boolean;
  /** 偏移量（分钟） */
  offset?: number;
}

/**
 * 时间提供端口适配器
 *
 * 实现应用层时间提供端口接口
 */
@Injectable()
export class TimeProviderPortAdapter implements ITimeProviderPort {
  private readonly timezoneConfig: ITimezoneConfig;

  constructor(
    timezoneConfig: ITimezoneConfig = { timezone: 'UTC', useUTC: true }
  ) {
    this.timezoneConfig = timezoneConfig;
  }

  /**
   * 获取当前时间
   *
   * @returns 当前时间
   */
  now(): Date {
    return new Date();
  }

  /**
   * 获取当前时间戳（秒）
   *
   * @returns 当前时间戳
   */
  timestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 获取当前时间戳（毫秒）
   *
   * @returns 当前时间戳（毫秒）
   */
  timestampMs(): number {
    return Date.now();
  }

  /**
   * 获取当前时间的ISO字符串
   *
   * @returns ISO格式的时间字符串
   */
  isoString(): string {
    return new Date().toISOString();
  }

  /**
   * 格式化时间
   *
   * @param date - 要格式化的时间
   * @param format - 格式类型
   * @returns 格式化后的时间字符串
   */
  format(date: Date, format = 'iso8601'): string {
    switch (format) {
      case 'iso8601':
        return this.formatISO8601(date);
      case 'unix_timestamp':
        return Math.floor(date.getTime() / 1000).toString();
      case 'unix_timestamp_ms':
        return date.getTime().toString();
      case 'custom':
        return this.formatCustom(date);
      default:
        return this.formatISO8601(date);
    }
  }

  /**
   * 解析时间字符串
   *
   * @param timeString - 时间字符串
   * @param format - 格式类型
   * @returns 解析后的时间对象
   */
  parse(timeString: string, format: TimeFormat = TimeFormat.ISO_8601): Date {
    switch (format) {
      case TimeFormat.ISO_8601:
        return new Date(timeString);
      case TimeFormat.UNIX_TIMESTAMP:
        return new Date(parseInt(timeString, 10) * 1000);
      case TimeFormat.UNIX_TIMESTAMP_MS:
        return new Date(parseInt(timeString, 10));
      case TimeFormat.CUSTOM:
        return this.parseCustom(timeString);
      default:
        return new Date(timeString);
    }
  }

  /**
   * 创建时间
   *
   * @param year - 年
   * @param month - 月（0-11）
   * @param day - 日
   * @param hour - 时
   * @param minute - 分
   * @param second - 秒
   * @param millisecond - 毫秒
   * @returns 创建的时间对象
   */
  create(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0
  ): Date {
    return new Date(year, month, day, hour, minute, second, millisecond);
  }

  /**
   * 添加时间
   *
   * @param date - 基准时间
   * @param amount - 数量
   * @param unit - 单位
   * @returns 添加后的时间
   */
  add(date: Date, amount: number, unit: 'ms' | 's' | 'm' | 'h' | 'd'): Date {
    const result = new Date(date);

    switch (unit) {
      case 'ms':
        result.setMilliseconds(result.getMilliseconds() + amount);
        break;
      case 's':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'h':
        result.setHours(result.getHours() + amount);
        break;
      case 'd':
        result.setDate(result.getDate() + amount);
        break;
    }

    return result;
  }

  /**
   * 计算时间差
   *
   * @param start - 开始时间
   * @param end - 结束时间
   * @param unit - 单位
   * @returns 时间差
   */
  diff(
    start: Date,
    end: Date,
    unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days'
  ): number {
    const diffMs = end.getTime() - start.getTime();

    switch (unit) {
      case 'milliseconds':
        return diffMs;
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      default:
        return diffMs;
    }
  }

  /**
   * 比较时间
   *
   * @param date1 - 时间1
   * @param date2 - 时间2
   * @returns 比较结果（-1: date1 < date2, 0: date1 = date2, 1: date1 > date2）
   */
  compare(date1: Date, date2: Date): number {
    const time1 = date1.getTime();
    const time2 = date2.getTime();

    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
  }

  /**
   * 检查时间是否在范围内
   *
   * @param date - 要检查的时间
   * @param start - 开始时间
   * @param end - 结束时间
   * @returns 是否在范围内
   */
  isBetween(date: Date, start: Date, end: Date): boolean {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }

  /**
   * 获取时区配置
   *
   * @returns 时区配置
   */
  getTimezoneConfig(): ITimezoneConfig {
    return { ...this.timezoneConfig };
  }

  /**
   * 设置时区配置
   *
   * @param config - 时区配置
   */
  setTimezoneConfig(config: ITimezoneConfig): void {
    Object.assign(this.timezoneConfig, config);
  }

  // ==================== 私有方法 ====================

  /**
   * 格式化ISO 8601时间
   */
  private formatISO8601(date: Date): string {
    return date.toISOString();
  }

  /**
   * 格式化自定义时间
   */
  private formatCustom(date: Date): string {
    // 自定义格式化逻辑
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * 解析自定义时间
   */
  private parseCustom(timeString: string): Date {
    // 自定义解析逻辑
    return new Date(timeString);
  }
}
