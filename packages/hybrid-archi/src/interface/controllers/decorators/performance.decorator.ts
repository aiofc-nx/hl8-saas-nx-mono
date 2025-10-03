/**
 * 性能监控装饰器
 *
 * @description 为控制器方法提供性能监控功能
 * 支持响应时间、吞吐量、错误率等性能指标监控
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 性能监控装饰器
 *
 * @description 启用性能监控
 *
 * @param config - 性能监控配置
 * @returns 装饰器
 */
export function PerformanceMonitoring(
  config: {
    enabled?: boolean;
    recordResponseTime?: boolean;
    recordThroughput?: boolean;
    recordErrorRate?: boolean;
    recordMemoryUsage?: boolean;
    recordCpuUsage?: boolean;
    thresholds?: {
      responseTime?: number;
      memoryUsage?: number;
      cpuUsage?: number;
    };
  } = {}
): MethodDecorator {
  const defaultConfig = {
    enabled: true,
    recordResponseTime: true,
    recordThroughput: true,
    recordErrorRate: true,
    recordMemoryUsage: false,
    recordCpuUsage: false,
    thresholds: {
      responseTime: 1000,
      memoryUsage: 80,
      cpuUsage: 80,
    },
    ...config,
  };

  return SetMetadata('performance_monitoring', defaultConfig);
}

/**
 * 性能阈值装饰器
 *
 * @description 设置性能阈值
 *
 * @param thresholds - 性能阈值配置
 * @returns 装饰器
 */
export function PerformanceThresholds(thresholds: {
  responseTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}): MethodDecorator {
  return SetMetadata('performance_thresholds', thresholds);
}

/**
 * 性能告警装饰器
 *
 * @description 启用性能告警
 *
 * @param config - 告警配置
 * @returns 装饰器
 */
export function PerformanceAlerting(config: {
  enabled?: boolean;
  channels?: string[];
  thresholds?: Record<string, number>;
}): MethodDecorator {
  return SetMetadata('performance_alerting', config);
}
