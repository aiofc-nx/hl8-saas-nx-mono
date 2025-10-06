/**
 * 事件数据工具函数
 *
 * @description 提供事件数据的类型安全操作工具
 * 包括类型守卫、数据转换、验证等功能
 *
 * ## 功能特性
 *
 * ### 类型守卫
 * - 提供运行时类型检查
 * - 确保事件数据的类型安全
 * - 支持类型推断和类型收缩
 *
 * ### 数据转换
 * - 提供安全的数据转换方法
 * - 支持默认值和错误处理
 * - 确保数据格式的一致性
 *
 * @since 1.0.0
 */

import { 
  EventData, 
  UserRegisteredEventData,
  TenantCreatedEventData,
  RoleCreatedEventData,
  DepartmentCreatedEventData
} from '../types/event-data.types';

/**
 * 类型守卫：检查是否为用户事件数据
 *
 * @param data - 要检查的数据
 * @returns 是否为用户事件数据
 */
export function isUserEventData(data: unknown): data is UserRegisteredEventData {
  return typeof data === 'object' && data !== null && 'userId' in data;
}

/**
 * 类型守卫：检查是否为租户事件数据
 *
 * @param data - 要检查的数据
 * @returns 是否为租户事件数据
 */
export function isTenantEventData(data: unknown): data is TenantCreatedEventData {
  return typeof data === 'object' && data !== null && 'tenantId' in data;
}

/**
 * 类型守卫：检查是否为授权事件数据
 *
 * @param data - 要检查的数据
 * @returns 是否为授权事件数据
 */
export function isAuthorizationEventData(data: unknown): data is RoleCreatedEventData {
  return typeof data === 'object' && data !== null && ('roleId' in data || 'permissionId' in data);
}

/**
 * 类型守卫：检查是否为部门事件数据
 *
 * @param data - 要检查的数据
 * @returns 是否为部门事件数据
 */
export function isDepartmentEventData(data: unknown): data is DepartmentCreatedEventData {
  return typeof data === 'object' && data !== null && 'departmentId' in data;
}

/**
 * 安全获取事件数据
 *
 * @param data - 事件数据
 * @param key - 数据键
 * @param defaultValue - 默认值
 * @returns 数据值或默认值
 */
export function getEventDataValue<T>(data: unknown, key: string, defaultValue: T): T {
  if (typeof data === 'object' && data !== null && key in data) {
    const value = (data as Record<string, unknown>)[key];
    return value as T;
  }
  return defaultValue;
}

/**
 * 验证事件数据完整性
 *
 * @param data - 事件数据
 * @param requiredFields - 必需字段列表
 * @returns 验证结果
 */
export function validateEventData(data: unknown, requiredFields: string[]): { isValid: boolean; missingFields: string[] } {
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, missingFields: requiredFields };
  }

  const dataObj = data as Record<string, unknown>;
  const missingFields = requiredFields.filter(field => !(field in dataObj));

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * 创建类型安全的事件数据
 *
 * @param data - 原始数据
 * @param type - 数据类型
 * @returns 类型安全的事件数据
 */
export function createTypedEventData<T extends EventData>(data: Partial<T>): T {
  return {
    timestamp: new Date().toISOString(),
    version: 1,
    ...data
  } as T;
}

/**
 * 事件数据序列化
 *
 * @param data - 事件数据
 * @returns 序列化后的字符串
 */
export function serializeEventData(data: EventData): string {
  return JSON.stringify(data, (key, value) => {
    // 处理特殊类型
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

/**
 * 事件数据反序列化
 *
 * @param json - JSON字符串
 * @returns 反序列化后的事件数据
 */
export function deserializeEventData(json: string): EventData {
  return JSON.parse(json) as EventData;
}

/**
 * 事件数据比较
 *
 * @param data1 - 第一个事件数据
 * @param data2 - 第二个事件数据
 * @returns 是否相等
 */
export function compareEventData(data1: EventData, data2: EventData): boolean {
  return JSON.stringify(data1) === JSON.stringify(data2);
}

/**
 * 事件数据合并
 *
 * @param base - 基础数据
 * @param override - 覆盖数据
 * @returns 合并后的数据
 */
export function mergeEventData<T extends EventData>(base: T, override: Partial<T>): T {
  return {
    ...base,
    ...override,
    timestamp: override.timestamp || base.timestamp || new Date().toISOString()
  };
}

/**
 * 事件数据过滤
 *
 * @param data - 事件数据
 * @param fields - 要保留的字段
 * @returns 过滤后的数据
 */
export function filterEventData<T extends EventData>(data: T, fields: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  fields.forEach(field => {
    if (field in data) {
      result[field] = data[field];
    }
  });
  return result;
}

/**
 * 事件数据验证器
 *
 * @description 提供事件数据的验证规则
 */
export class EventDataValidator {
  /**
   * 验证用户事件数据
   *
   * @param data - 用户事件数据
   * @returns 验证结果
   */
  static validateUserEventData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!isUserEventData(data)) {
      errors.push('Invalid user event data structure');
      return { isValid: false, errors };
    }

    if (!data.userId) {
      errors.push('userId is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证租户事件数据
   *
   * @param data - 租户事件数据
   * @returns 验证结果
   */
  static validateTenantEventData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!isTenantEventData(data)) {
      errors.push('Invalid tenant event data structure');
      return { isValid: false, errors };
    }

    if (!data.tenantId) {
      errors.push('tenantId is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证授权事件数据
   *
   * @param data - 授权事件数据
   * @returns 验证结果
   */
  static validateAuthorizationEventData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!isAuthorizationEventData(data)) {
      errors.push('Invalid authorization event data structure');
      return { isValid: false, errors };
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
