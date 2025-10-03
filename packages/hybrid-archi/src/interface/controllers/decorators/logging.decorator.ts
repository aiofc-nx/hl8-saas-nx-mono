/**
 * 日志记录装饰器
 *
 * @description 为控制器方法提供日志记录功能
 * 支持结构化日志、日志级别控制、敏感信息过滤等
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 日志记录装饰器
 *
 * @description 启用日志记录
 *
 * @param config - 日志配置
 * @returns 装饰器
 */
export function Logging(
  config: {
    enabled?: boolean;
    level?: 'debug' | 'info' | 'warn' | 'error';
    includeRequest?: boolean;
    includeResponse?: boolean;
    includeTiming?: boolean;
    sensitiveFields?: string[];
  } = {}
): MethodDecorator {
  const defaultConfig = {
    enabled: true,
    level: 'info',
    includeRequest: true,
    includeResponse: false,
    includeTiming: true,
    sensitiveFields: ['password', 'token', 'secret', 'key'],
  };

  return SetMetadata('logging', { ...defaultConfig, ...config });
}

/**
 * 审计日志装饰器
 *
 * @description 启用审计日志记录
 *
 * @param config - 审计配置
 * @returns 装饰器
 */
export function AuditLog(
  config: {
    enabled?: boolean;
    includeUser?: boolean;
    includeTenant?: boolean;
    includeResource?: boolean;
    includeAction?: boolean;
  } = {}
): MethodDecorator {
  return SetMetadata('audit_log', config);
}

/**
 * 错误日志装饰器
 *
 * @description 启用错误日志记录
 *
 * @param config - 错误日志配置
 * @returns 装饰器
 */
export function ErrorLogging(
  config: {
    enabled?: boolean;
    includeStack?: boolean;
    includeContext?: boolean;
    includeUser?: boolean;
  } = {}
): MethodDecorator {
  return SetMetadata('error_logging', config);
}
