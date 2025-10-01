/**
 * HL8 SAAS平台日志增强功能
 *
 * @description 提供日志过滤、聚合、告警等高级功能
 * 包含完整的使用示例和最佳实践
 *
 * @fileoverview 日志增强功能实现文件
 * @since 1.0.0
 */

import { LogEntry, LogLevel } from './types';
import { PinoLogger } from './pino-logger';

/**
 * 告警接口
 *
 * @description 定义日志告警的数据结构
 */
export interface Alert {
  id: string;
  ruleName: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
}

/**
 * 日志过滤条件接口
 *
 * @description 定义日志过滤的各种条件类型
 */
interface FilterCriteria {
  level?: {
    min?: LogLevel;
    max?: LogLevel;
    include?: LogLevel[];
    exclude?: LogLevel[];
  };
  content?: { includes?: string[]; excludes?: string[]; regex?: RegExp };
  context?: { userId?: string | string[]; requestId?: string | string[] };
  timeRange?: {
    start?: Date;
    end?: Date;
    last?: { hours?: number; days?: number };
  };
  custom?: (entry: LogEntry) => boolean;
}

/**
 * 日志过滤功能
 *
 * @description 提供强大的日志过滤功能
 * 支持基于级别、内容、上下文、时间等多种条件的过滤
 */
export class LogFilter {
  private filters: FilterCriteria[] = [];

  /**
   * 添加级别过滤
   */
  level(filter: {
    min?: LogLevel;
    max?: LogLevel;
    include?: LogLevel[];
    exclude?: LogLevel[];
  }): LogFilter {
    this.filters.push({ level: filter });
    return this;
  }

  /**
   * 添加内容过滤
   */
  content(filter: {
    includes?: string[];
    excludes?: string[];
    regex?: RegExp;
  }): LogFilter {
    this.filters.push({ content: filter });
    return this;
  }

  /**
   * 添加上下文过滤
   */
  context(filter: {
    userId?: string | string[];
    requestId?: string | string[];
  }): LogFilter {
    this.filters.push({ context: filter });
    return this;
  }

  /**
   * 添加时间范围过滤
   */
  timeRange(filter: {
    start?: Date;
    end?: Date;
    last?: { hours?: number; days?: number };
  }): LogFilter {
    this.filters.push({ timeRange: filter });
    return this;
  }

  /**
   * 添加自定义过滤
   */
  custom(filter: (entry: LogEntry) => boolean): LogFilter {
    this.filters.push({ custom: filter });
    return this;
  }

  /**
   * 过滤日志条目
   */
  async filter(entries: LogEntry[]): Promise<LogEntry[]> {
    const filteredEntries: LogEntry[] = [];

    for (const entry of entries) {
      let matches = true;

      for (const filter of this.filters) {
        if (!this.matchesFilter(entry, filter)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        filteredEntries.push(entry);
      }
    }

    return filteredEntries;
  }

  /**
   * 检查单个过滤条件
   */
  private matchesFilter(entry: LogEntry, filter: FilterCriteria): boolean {
    // 级别过滤
    if (filter.level) {
      const level = entry.level;
      const levelOrder = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      const entryLevelIndex = levelOrder.indexOf(level);

      if (filter.level.min) {
        const minIndex = levelOrder.indexOf(filter.level.min);
        if (entryLevelIndex < minIndex) return false;
      }

      if (filter.level.max) {
        const maxIndex = levelOrder.indexOf(filter.level.max);
        if (entryLevelIndex > maxIndex) return false;
      }

      if (filter.level.include && !filter.level.include.includes(level)) {
        return false;
      }

      if (filter.level.exclude && filter.level.exclude.includes(level)) {
        return false;
      }
    }

    // 内容过滤
    if (filter.content) {
      const message = entry.message;

      if (filter.content.includes) {
        if (
          !filter.content.includes.some((keyword: string) =>
            message.includes(keyword)
          )
        ) {
          return false;
        }
      }

      if (filter.content.excludes) {
        if (
          filter.content.excludes.some((keyword: string) =>
            message.includes(keyword)
          )
        ) {
          return false;
        }
      }

      if (filter.content.regex && !filter.content.regex.test(message)) {
        return false;
      }
    }

    // 上下文过滤
    if (filter.context) {
      if (filter.context.userId) {
        const userIds = Array.isArray(filter.context.userId)
          ? filter.context.userId
          : [filter.context.userId];
        if (!userIds.includes(entry.context?.userId || '')) {
          return false;
        }
      }

      if (filter.context.requestId) {
        const requestIds = Array.isArray(filter.context.requestId)
          ? filter.context.requestId
          : [filter.context.requestId];
        if (!requestIds.includes(entry.context?.requestId || '')) {
          return false;
        }
      }
    }

    // 时间范围过滤
    if (filter.timeRange) {
      const entryTime = entry.timestamp.getTime();

      if (
        filter.timeRange.start &&
        entryTime < filter.timeRange.start.getTime()
      ) {
        return false;
      }

      if (filter.timeRange.end && entryTime > filter.timeRange.end.getTime()) {
        return false;
      }

      if (filter.timeRange.last) {
        const now = Date.now();
        let cutoffTime = now;

        if (filter.timeRange.last.hours) {
          cutoffTime -= filter.timeRange.last.hours * 60 * 60 * 1000;
        }

        if (filter.timeRange.last.days) {
          cutoffTime -= filter.timeRange.last.days * 24 * 60 * 60 * 1000;
        }

        if (entryTime < cutoffTime) {
          return false;
        }
      }
    }

    // 自定义过滤
    if (filter.custom && !filter.custom(entry)) {
      return false;
    }

    return true;
  }
}

/**
 * 日志聚合功能
 *
 * @description 提供强大的日志聚合功能
 * 支持按时间、级别、用户等维度进行聚合分析
 */
export class LogAggregator {
  /**
   * 按时间聚合
   */
  async aggregateByTime(
    entries: LogEntry[],
    granularity: 'hour' | 'day' | 'week' | 'month' = 'hour'
  ): Promise<
    Array<{ key: string; count: number; timeRange: { start: Date; end: Date } }>
  > {
    const groups = new Map<string, LogEntry[]>();

    for (const entry of entries) {
      const key = this.getTimeKey(entry.timestamp, granularity);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }

    const results: Array<{
      key: string;
      count: number;
      timeRange: { start: Date; end: Date };
    }> = [];

    for (const [key, groupEntries] of groups) {
      const timeRange = this.getTimeRange(key, granularity);
      results.push({
        key,
        count: groupEntries.length,
        timeRange,
      });
    }

    return results.sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * 按级别聚合
   */
  async aggregateByLevel(
    entries: LogEntry[]
  ): Promise<Array<{ level: LogLevel; count: number }>> {
    const levelCounts = new Map<LogLevel, number>();

    for (const entry of entries) {
      const count = levelCounts.get(entry.level) || 0;
      levelCounts.set(entry.level, count + 1);
    }

    return Array.from(levelCounts.entries()).map(([level, count]) => ({
      level,
      count,
    }));
  }

  /**
   * 按用户聚合
   */
  async aggregateByUser(
    entries: LogEntry[]
  ): Promise<Array<{ userId: string; count: number }>> {
    const userCounts = new Map<string, number>();

    for (const entry of entries) {
      const userId = entry.context?.userId || 'anonymous';
      const count = userCounts.get(userId) || 0;
      userCounts.set(userId, count + 1);
    }

    return Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取时间键
   */
  private getTimeKey(timestamp: Date, granularity: string): string {
    const date = new Date(timestamp);

    switch (granularity) {
      case 'hour':
        return date.toISOString().slice(0, 13) + 'Z';
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      }
      case 'month':
        return date.toISOString().slice(0, 7);
      default:
        return date.toISOString();
    }
  }

  /**
   * 获取时间范围
   */
  private getTimeRange(
    key: string,
    granularity: string
  ): { start: Date; end: Date } {
    const start = new Date(key);
    const end = new Date(start);

    switch (granularity) {
      case 'hour':
        end.setHours(end.getHours() + 1);
        break;
      case 'day':
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        break;
    }

    return { start, end };
  }
}

/**
 * 日志告警功能
 *
 * @description 提供强大的日志告警功能
 * 支持基于频率、阈值、模式等条件的实时告警
 */
export class LogAlertManager {
  private rules: Array<{
    name: string;
    condition: 'frequency' | 'threshold' | 'custom';
    threshold?: number;
    timeWindow?: { minutes?: number; hours?: number };
    level: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    customTrigger?: (entries: LogEntry[]) => boolean;
  }> = [];

  private alerts: Alert[] = [];

  /**
   * 添加告警规则
   */
  addRule(rule: {
    name: string;
    condition: 'frequency' | 'threshold' | 'custom';
    threshold?: number;
    timeWindow?: { minutes?: number; hours?: number };
    level: 'low' | 'medium' | 'high' | 'critical';
    enabled?: boolean;
    customTrigger?: (entries: LogEntry[]) => boolean;
  }): string {
    const ruleId = `rule-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.rules.push({ ...rule, enabled: rule.enabled ?? true });
    return ruleId;
  }

  /**
   * 处理日志条目
   */
  async processLogEntries(entries: LogEntry[]): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let shouldTrigger = false;

      switch (rule.condition) {
        case 'frequency':
          if (rule.threshold && rule.timeWindow) {
            const timeWindow = this.calculateTimeWindow(rule.timeWindow);
            const recentEntries = entries.filter(
              (entry) => entry.timestamp.getTime() >= Date.now() - timeWindow
            );
            shouldTrigger = recentEntries.length >= rule.threshold;
          }
          break;

        case 'threshold':
          if (rule.threshold) {
            shouldTrigger = entries.some((entry) => {
              const value = this.extractNumericValue(entry);
              return typeof value === 'number' && value >= rule.threshold!;
            });
          }
          break;

        case 'custom':
          if (rule.customTrigger) {
            shouldTrigger = rule.customTrigger(entries);
          }
          break;
      }

      if (shouldTrigger) {
        const alert: Alert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ruleName: rule.name,
          level: rule.level as LogLevel,
          message: `Alert triggered: ${rule.name}`,
          timestamp: new Date(),
          status: 'active',
        };

        this.alerts.push(alert);
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => alert.status === 'active');
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      return true;
    }
    return false;
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      return true;
    }
    return false;
  }

  /**
   * 计算时间窗口
   */
  private calculateTimeWindow(timeWindow: {
    minutes?: number;
    hours?: number;
  }): number {
    let totalMs = 0;
    if (timeWindow.minutes) totalMs += timeWindow.minutes * 60 * 1000;
    if (timeWindow.hours) totalMs += timeWindow.hours * 60 * 60 * 1000;
    return totalMs;
  }

  /**
   * 提取数值
   */
  private extractNumericValue(entry: LogEntry): number | null {
    if (entry.data && typeof entry.data === 'object') {
      const data = entry.data as Record<string, unknown>;
      for (const value of Object.values(data)) {
        if (typeof value === 'number') {
          return value;
        }
      }
    }

    const numericMatch = entry.message.match(/\d+/);
    return numericMatch ? parseInt(numericMatch[0], 10) : null;
  }
}

/**
 * 日志分析工作流
 *
 * @description 提供完整的日志分析工作流
 * 包含过滤、聚合、告警等功能的综合使用
 */
export class LogAnalysisWorkflow {
  private logger: PinoLogger;
  private filter: LogFilter;
  private aggregator: LogAggregator;
  private alertManager: LogAlertManager;

  constructor() {
    this.logger = new PinoLogger();
    this.filter = new LogFilter();
    this.aggregator = new LogAggregator();
    this.alertManager = new LogAlertManager();
  }

  /**
   * 执行完整的日志分析流程
   */
  async analyzeLogs(entries: LogEntry[]): Promise<{
    filteredCount: number;
    timeAggregation: Array<{
      key: string;
      count: number;
      timeRange: { start: Date; end: Date };
    }>;
    levelAggregation: Array<{ level: LogLevel; count: number }>;
    userAggregation: Array<{ userId: string; count: number }>;
    triggeredAlerts: Array<{
      id: string;
      ruleName: string;
      level: string;
      message: string;
      timestamp: Date;
    }>;
  }> {
    this.logger.info('开始日志分析流程', { totalEntries: entries.length });

    try {
      // 1. 过滤日志
      this.logger.info('步骤1: 过滤日志');
      const filteredEntries = await this.filter
        .level({ min: 'info' })
        .content({ includes: ['error', 'exception'] })
        .timeRange({ last: { hours: 24 } })
        .filter(entries);

      this.logger.info('过滤完成', { filteredCount: filteredEntries.length });

      // 2. 聚合分析
      this.logger.info('步骤2: 聚合分析');
      const timeAggregation = await this.aggregator.aggregateByTime(
        filteredEntries,
        'hour'
      );
      const levelAggregation = await this.aggregator.aggregateByLevel(
        filteredEntries
      );
      const userAggregation = await this.aggregator.aggregateByUser(
        filteredEntries
      );

      // 3. 告警处理
      this.logger.info('步骤3: 告警处理');
      this.alertManager.addRule({
        name: 'Error Rate Alert',
        condition: 'frequency',
        threshold: 10,
        timeWindow: { minutes: 5 },
        level: 'high',
      });

      const triggeredAlerts = await this.alertManager.processLogEntries(
        filteredEntries
      );

      this.logger.info('日志分析流程完成');

      return {
        filteredCount: filteredEntries.length,
        timeAggregation,
        levelAggregation,
        userAggregation,
        triggeredAlerts,
      };
    } catch (error) {
      this.logger.error('日志分析流程失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * 创建日志过滤器
 */
export function createLogFilter(): LogFilter {
  return new LogFilter();
}

/**
 * 创建日志聚合器
 */
export function createLogAggregator(): LogAggregator {
  return new LogAggregator();
}

/**
 * 创建日志告警管理器
 */
export function createLogAlertManager(): LogAlertManager {
  return new LogAlertManager();
}

/**
 * 创建日志分析工作流
 */
export function createLogAnalysisWorkflow(): LogAnalysisWorkflow {
  return new LogAnalysisWorkflow();
}
