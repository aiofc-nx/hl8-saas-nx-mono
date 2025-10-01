/**
 * 监控统计类型定义
 *
 * @description 定义数据库监控和统计相关的类型
 * 包括性能监控、健康检查、资源使用等
 *
 * @fileoverview 数据库监控类型定义文件
 * @since 1.0.0
 */

// ============================================================================
// 监控配置类型 (Monitoring Configuration Types)
// ============================================================================

/**
 * 监控配置
 *
 * @description 数据库监控功能的配置选项
 */
export interface MonitoringConfig {
  /**
   * 是否启用统计功能
   */
  enableStats: boolean;

  /**
   * 是否启用健康检查
   */
  enableHealthCheck: boolean;

  /**
   * 统计信息收集间隔（毫秒）
   */
  statsInterval: number;

  /**
   * 慢查询阈值（毫秒）
   */
  slowQueryThreshold: number;

  /**
   * 是否启用查询日志
   */
  enableQueryLogging?: boolean;

  /**
   * 是否启用性能追踪
   */
  enablePerformanceTracing?: boolean;
}

// ============================================================================
// 监控服务接口 (Monitor Service Interface)
// ============================================================================

/**
 * 数据库监控接口
 *
 * @description 定义数据库监控服务的操作接口
 */
export interface IDatabaseMonitor {
  /**
   * 获取连接统计信息
   *
   * @returns 连接统计
   */
  getConnectionStats(): Promise<ConnectionStatsInfo>;

  /**
   * 获取租户连接统计
   *
   * @param tenantId - 租户ID
   * @returns 租户连接统计
   */
  getTenantConnectionStats(tenantId: string): Promise<ConnectionStatsInfo>;

  /**
   * 获取查询统计信息
   *
   * @returns 查询统计
   */
  getQueryStats(): Promise<QueryStatsInfo>;

  /**
   * 获取慢查询列表
   *
   * @param threshold - 时间阈值（毫秒）
   * @returns 慢查询列表
   */
  getSlowQueries(threshold: number): Promise<SlowQuery[]>;

  /**
   * 执行健康检查
   *
   * @returns 健康状态
   */
  healthCheck(): Promise<HealthStatus>;

  /**
   * 执行租户健康检查
   *
   * @param tenantId - 租户ID
   * @returns 租户健康状态
   */
  tenantHealthCheck(tenantId: string): Promise<HealthStatus>;

  /**
   * 获取内存使用情况
   *
   * @returns 内存使用信息
   */
  getMemoryUsage(): Promise<MemoryUsage>;

  /**
   * 获取磁盘使用情况
   *
   * @returns 磁盘使用信息
   */
  getDiskUsage(): Promise<DiskUsage>;

  /**
   * 获取CPU使用情况
   *
   * @returns CPU使用信息
   */
  getCPUUsage(): Promise<CPUUsage>;
}

// ============================================================================
// 统计信息类型 (Statistics Types)
// ============================================================================

/**
 * 连接统计信息
 *
 * @description 数据库连接的统计信息
 */
export interface ConnectionStatsInfo {
  /**
   * 总连接数
   */
  total: number;

  /**
   * 活跃连接数
   */
  active: number;

  /**
   * 空闲连接数
   */
  idle: number;

  /**
   * 等待连接数
   */
  waiting: number;

  /**
   * 平均连接时间（毫秒）
   */
  averageConnectionTime: number;

  /**
   * 最大连接数（峰值）
   */
  peakConnections: number;
}

/**
 * 查询统计信息
 *
 * @description 数据库查询的统计信息
 */
export interface QueryStatsInfo {
  /**
   * 总查询数
   */
  total: number;

  /**
   * 成功查询数
   */
  successful: number;

  /**
   * 失败查询数
   */
  failed: number;

  /**
   * 慢查询数
   */
  slow: number;

  /**
   * 平均查询时间（毫秒）
   */
  averageTime: number;

  /**
   * 最慢查询时间（毫秒）
   */
  slowestTime: number;

  /**
   * 查询频率（每秒）
   */
  qps: number;
}

/**
 * 慢查询信息
 *
 * @description 慢查询的详细信息
 */
export interface SlowQuery {
  /**
   * 查询ID
   */
  id: string;

  /**
   * SQL语句
   */
  sql: string;

  /**
   * 执行时间（毫秒）
   */
  executionTime: number;

  /**
   * 执行时间戳
   */
  timestamp: Date;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 参数
   */
  params?: unknown[];
}

// ============================================================================
// 健康检查类型 (Health Check Types)
// ============================================================================

/**
 * 健康状态
 *
 * @description 数据库的健康检查结果
 */
export interface HealthStatus {
  /**
   * 健康状态
   */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /**
   * 检查时间
   */
  checkedAt: Date;

  /**
   * 连接状态
   */
  connection: boolean;

  /**
   * 响应时间（毫秒）
   */
  responseTime: number;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 详细信息
   */
  details?: Record<string, unknown>;
}

// ============================================================================
// 资源使用类型 (Resource Usage Types)
// ============================================================================

/**
 * 内存使用信息
 *
 * @description 数据库的内存使用情况
 */
export interface MemoryUsage {
  /**
   * 已使用内存（字节）
   */
  used: number;

  /**
   * 总内存（字节）
   */
  total: number;

  /**
   * 使用百分比
   */
  percentage: number;
}

/**
 * 磁盘使用信息
 *
 * @description 数据库的磁盘使用情况
 */
export interface DiskUsage {
  /**
   * 已使用空间（字节）
   */
  used: number;

  /**
   * 总空间（字节）
   */
  total: number;

  /**
   * 使用百分比
   */
  percentage: number;
}

/**
 * CPU使用信息
 *
 * @description 数据库的CPU使用情况
 */
export interface CPUUsage {
  /**
   * CPU使用百分比
   */
  percentage: number;

  /**
   * 核心数
   */
  cores: number;

  /**
   * 负载
   */
  load: number[];
}
