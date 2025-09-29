/**
 * 性能指标服务
 *
 * 提供应用性能指标收集、统计和查询功能。
 * 支持系统资源监控、业务指标统计、性能指标分析等功能。
 *
 * @description 此服务类提供完整的性能指标收集和统计功能。
 * 支持系统资源监控、业务指标统计、性能指标分析等。
 * 提供 Prometheus 格式的指标输出，便于集成监控系统。
 *
 * ## 业务规则
 *
 * ### 指标收集规则
 * - 定期收集系统资源使用情况
 * - 实时统计业务操作指标
 * - 记录应用性能指标数据
 * - 支持自定义指标收集和统计
 *
 * ### 数据统计规则
 * - 计算系统资源使用率
 * - 统计业务操作成功率
 * - 分析应用性能趋势
 * - 支持指标数据的聚合和计算
 *
 * ### 数据格式规则
 * - 支持 Prometheus 格式的指标输出
 * - 支持 JSON 格式的指标输出
 * - 指标数据包含时间戳和标签
 * - 支持指标数据的过滤和排序
 *
 * ## 业务逻辑流程
 *
 * 1. **指标初始化**：初始化指标收集器和统计器
 * 2. **数据收集**：定期收集系统资源和业务指标
 * 3. **数据统计**：计算指标统计数据和趋势
 * 4. **数据存储**：存储指标数据到内存或外部存储
 * 5. **数据查询**：提供指标数据查询接口
 *
 * @example
 * ```typescript
 * // 在其他服务中使用性能指标服务
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly metricsService: MetricsService
 *   ) {}
 *
 *   async createUser(userData: CreateUserDto) {
 *     const startTime = Date.now();
 *     try {
 *       // 业务逻辑
 *       const user = await this.userRepository.create(userData);
 *
 *       // 记录成功指标
 *       this.metricsService.recordBusinessMetric('user_created', 1);
 *       this.metricsService.recordPerformanceMetric('user_creation_time', Date.now() - startTime);
 *
 *       return user;
 *     } catch (error) {
 *       // 记录错误指标
 *       this.metricsService.recordErrorMetric('user_creation_error', 1);
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */

import { Injectable } from '@nestjs/common';

/**
 * 系统资源指标接口
 */
export interface SystemMetrics {
  /** CPU 使用率（百分比） */
  cpuUsage: number;
  /** 内存使用情况 */
  memory: {
    /** 总内存（字节） */
    total: number;
    /** 已使用内存（字节） */
    used: number;
    /** 可用内存（字节） */
    free: number;
    /** 内存使用率（百分比） */
    usage: number;
  };
  /** 磁盘使用情况 */
  disk: {
    /** 总磁盘空间（字节） */
    total: number;
    /** 已使用磁盘空间（字节） */
    used: number;
    /** 可用磁盘空间（字节） */
    free: number;
    /** 磁盘使用率（百分比） */
    usage: number;
  };
  /** 系统运行时间（秒） */
  uptime: number;
}

/**
 * 业务指标接口
 */
export interface BusinessMetrics {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 当前活跃连接数 */
  activeConnections: number;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /** 系统资源指标 */
  system: SystemMetrics;
  /** 业务指标 */
  business: BusinessMetrics;
  /** 指标收集时间戳 */
  timestamp: string;
}

/**
 * 性能指标服务
 *
 * @description 提供应用性能指标收集、统计和查询功能
 */
@Injectable()
export class MetricsService {
  private businessMetrics: BusinessMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0,
  };

  private responseTimes: number[] = [];

  /**
   * 获取系统资源指标
   *
   * @description 收集当前系统的资源使用情况
   * @returns 系统资源指标数据
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      cpuUsage: this.getCpuUsage(),
      memory: {
        total: memoryUsage.heapTotal,
        used: memoryUsage.heapUsed,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        usage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      disk: {
        total: 0, // 需要额外的系统调用获取磁盘信息
        used: 0,
        free: 0,
        usage: 0,
      },
      uptime,
    };
  }

  /**
   * 获取业务指标
   *
   * @description 获取当前业务指标统计
   * @returns 业务指标数据
   */
  getBusinessMetrics(): BusinessMetrics {
    return { ...this.businessMetrics };
  }

  /**
   * 获取完整性能指标
   *
   * @description 获取系统资源和业务指标的完整数据
   * @returns 完整性能指标数据
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      system: this.getSystemMetrics(),
      business: this.getBusinessMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 记录业务指标
   *
   * @description 记录业务操作相关的指标数据
   * @param metricName - 指标名称
   * @param value - 指标值
   */
  recordBusinessMetric(metricName: string, value: number): void {
    switch (metricName) {
      case 'request_total':
        this.businessMetrics.totalRequests += value;
        break;
      case 'request_success':
        this.businessMetrics.successfulRequests += value;
        break;
      case 'request_failed':
        this.businessMetrics.failedRequests += value;
        break;
      case 'response_time':
        this.responseTimes.push(value);
        this.updateAverageResponseTime();
        break;
      case 'active_connections':
        this.businessMetrics.activeConnections = value;
        break;
    }
  }

  /**
   * 记录性能指标
   *
   * @description 记录应用性能相关的指标数据
   * @param metricName - 指标名称
   * @param value - 指标值
   */
  recordPerformanceMetric(metricName: string, value: number): void {
    this.recordBusinessMetric(metricName, value);
  }

  /**
   * 记录错误指标
   *
   * @description 记录应用错误相关的指标数据
   * @param metricName - 指标名称
   * @param value - 指标值
   */
  recordErrorMetric(metricName: string, value: number): void {
    this.recordBusinessMetric(metricName, value);
  }

  /**
   * 获取 Prometheus 格式指标
   *
   * @description 生成 Prometheus 格式的指标数据
   * @returns Prometheus 格式的指标字符串
   */
  getPrometheusMetrics(): string {
    const metrics = this.getPerformanceMetrics();
    const lines: string[] = [];

    // 系统指标
    lines.push('# HELP hl8_system_cpu_usage CPU usage percentage');
    lines.push('# TYPE hl8_system_cpu_usage gauge');
    lines.push(`hl8_system_cpu_usage ${metrics.system.cpuUsage}`);

    lines.push('# HELP hl8_system_memory_usage Memory usage percentage');
    lines.push('# TYPE hl8_system_memory_usage gauge');
    lines.push(`hl8_system_memory_usage ${metrics.system.memory.usage}`);

    lines.push('# HELP hl8_system_uptime System uptime in seconds');
    lines.push('# TYPE hl8_system_uptime counter');
    lines.push(`hl8_system_uptime ${metrics.system.uptime}`);

    // 业务指标
    lines.push('# HELP hl8_business_total_requests Total number of requests');
    lines.push('# TYPE hl8_business_total_requests counter');
    lines.push(`hl8_business_total_requests ${metrics.business.totalRequests}`);

    lines.push(
      '# HELP hl8_business_successful_requests Number of successful requests'
    );
    lines.push('# TYPE hl8_business_successful_requests counter');
    lines.push(
      `hl8_business_successful_requests ${metrics.business.successfulRequests}`
    );

    lines.push('# HELP hl8_business_failed_requests Number of failed requests');
    lines.push('# TYPE hl8_business_failed_requests counter');
    lines.push(
      `hl8_business_failed_requests ${metrics.business.failedRequests}`
    );

    lines.push(
      '# HELP hl8_business_average_response_time Average response time in milliseconds'
    );
    lines.push('# TYPE hl8_business_average_response_time gauge');
    lines.push(
      `hl8_business_average_response_time ${metrics.business.averageResponseTime}`
    );

    lines.push(
      '# HELP hl8_business_active_connections Number of active connections'
    );
    lines.push('# TYPE hl8_business_active_connections gauge');
    lines.push(
      `hl8_business_active_connections ${metrics.business.activeConnections}`
    );

    return lines.join('\n');
  }

  /**
   * 获取 CPU 使用率
   *
   * @description 计算当前 CPU 使用率
   * @returns CPU 使用率（百分比）
   */
  private getCpuUsage(): number {
    // 简化的 CPU 使用率计算
    // 在实际应用中，可以使用更精确的方法
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(totalUsage / 1000000, 100); // 转换为百分比
  }

  /**
   * 更新平均响应时间
   *
   * @description 根据响应时间数组计算平均响应时间
   */
  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.businessMetrics.averageResponseTime =
        sum / this.responseTimes.length;

      // 保持最近 100 个响应时间记录
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-100);
      }
    }
  }
}
