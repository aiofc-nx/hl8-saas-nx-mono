/**
 * HL8 SAAS平台日志增强功能使用示例
 *
 * @description 展示日志过滤、聚合、告警等高级功能的使用方法
 * 包含完整的使用示例和最佳实践
 *
 * @fileoverview 日志增强功能使用示例文件
 * @since 1.0.0
 */

import {
  createLogFilter,
  createLogAggregator,
  createLogAlertManager,
  createLogAnalysisWorkflow,
  Alert,
} from './enhanced-features';
import { LogEntry, LogLevel } from './types';

/**
 * 日志过滤功能示例
 */
export class LogFilterExamples {
  /**
   * 基本过滤示例
   */
  async basicFiltering(entries: LogEntry[]): Promise<LogEntry[]> {
    const filter = createLogFilter()
      .level({ min: 'info' })
      .content({ includes: ['error', 'exception'] })
      .timeRange({ last: { hours: 24 } });

    const filteredEntries = await filter.filter(entries);

    console.log(`过滤前: ${entries.length} 条日志`);
    console.log(`过滤后: ${filteredEntries.length} 条日志`);

    return filteredEntries;
  }

  /**
   * 高级过滤示例
   */
  async advancedFiltering(entries: LogEntry[]): Promise<LogEntry[]> {
    const filter = createLogFilter()
      .level({ min: 'warn', max: 'error' })
      .content({
        includes: ['database', 'connection'],
        excludes: ['test', 'debug'],
      })
      .context({ userId: ['user-123', 'user-456'] })
      .timeRange({
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      })
      .custom((entry) => {
        return !!(
          entry.data &&
          typeof entry.data === 'object' &&
          'responseTime' in entry.data &&
          (entry.data['responseTime'] as number) > 1000
        );
      });

    const filteredEntries = await filter.filter(entries);

    console.log(`高级过滤结果: ${filteredEntries.length} 条日志`);

    return filteredEntries;
  }
}

/**
 * 日志聚合功能示例
 */
export class LogAggregationExamples {
  /**
   * 时间聚合示例
   */
  async timeAggregation(entries: LogEntry[]): Promise<void> {
    const aggregator = createLogAggregator();

    // 按小时聚合
    const hourlyResult = await aggregator.aggregateByTime(entries, 'hour');
    console.log('按小时聚合结果:');
    hourlyResult.forEach((item) => {
      console.log(`${item.key}: ${item.count} 条日志`);
    });

    // 按天聚合
    const dailyResult = await aggregator.aggregateByTime(entries, 'day');
    console.log('按天聚合结果:');
    dailyResult.forEach((item) => {
      console.log(`${item.key}: ${item.count} 条日志`);
    });
  }

  /**
   * 级别聚合示例
   */
  async levelAggregation(entries: LogEntry[]): Promise<void> {
    const aggregator = createLogAggregator();

    const levelResult = await aggregator.aggregateByLevel(entries);
    console.log('按级别聚合结果:');
    levelResult.forEach((item) => {
      console.log(`${item.level}: ${item.count} 条日志`);
    });
  }

  /**
   * 用户聚合示例
   */
  async userAggregation(entries: LogEntry[]): Promise<void> {
    const aggregator = createLogAggregator();

    const userResult = await aggregator.aggregateByUser(entries);
    console.log('用户活跃度排行:');
    userResult.forEach((item, index) => {
      console.log(`${index + 1}. ${item.userId}: ${item.count} 条日志`);
    });
  }
}

/**
 * 日志告警功能示例
 */
export class LogAlertExamples {
  private alertManager: ReturnType<typeof createLogAlertManager>;

  constructor() {
    this.alertManager = createLogAlertManager();
  }

  /**
   * 基本告警示例
   */
  async basicAlerts(): Promise<void> {
    // 添加错误率告警
    this.alertManager.addRule({
      name: 'Error Rate Alert',
      condition: 'frequency',
      threshold: 10,
      timeWindow: { minutes: 5 },
      level: 'high',
    });

    // 添加响应时间告警
    this.alertManager.addRule({
      name: 'Response Time Alert',
      condition: 'threshold',
      threshold: 5000,
      level: 'medium',
    });

    console.log('告警规则已添加');
  }

  /**
   * 处理日志条目示例
   */
  async processLogEntries(entries: LogEntry[]): Promise<void> {
    console.log(`开始处理 ${entries.length} 条日志条目...`);

    const triggeredAlerts = await this.alertManager.processLogEntries(entries);

    if (triggeredAlerts.length > 0) {
      console.log(`触发了 ${triggeredAlerts.length} 个告警:`);
      triggeredAlerts.forEach((alert: Alert) => {
        console.log(
          `- ${alert.ruleName}: ${alert.message} (级别: ${alert.level})`
        );
      });
    } else {
      console.log('没有触发任何告警');
    }

    // 显示活跃告警
    const activeAlerts = this.alertManager.getActiveAlerts();
    console.log(`当前活跃告警数量: ${activeAlerts.length}`);
  }

  /**
   * 告警管理示例
   */
  async alertManagement(): Promise<void> {
    const activeAlerts = this.alertManager.getActiveAlerts();
    console.log(`活跃告警数量: ${activeAlerts.length}`);

    // 确认告警
    if (activeAlerts.length > 0) {
      const alertId = activeAlerts[0].id;
      const acknowledged = this.alertManager.acknowledgeAlert(alertId, 'admin');
      console.log(`告警 ${alertId} 确认状态: ${acknowledged}`);
    }

    // 解决告警
    if (activeAlerts.length > 0) {
      const alertId = activeAlerts[0].id;
      const resolved = this.alertManager.resolveAlert(alertId, 'admin');
      console.log(`告警 ${alertId} 解决状态: ${resolved}`);
    }
  }
}

/**
 * 综合使用示例
 */
export class LogAnalysisExamples {
  /**
   * 完整日志分析流程
   */
  async completeAnalysis(entries: LogEntry[]): Promise<void> {
    const workflow = createLogAnalysisWorkflow();

    try {
      const result = await workflow.analyzeLogs(entries);

      console.log('=== 日志分析结果 ===');
      console.log(`过滤后日志数量: ${result.filteredCount}`);
      console.log(`时间聚合结果: ${result.timeAggregation.length} 个时间段`);
      console.log(`级别聚合结果: ${result.levelAggregation.length} 个级别`);
      console.log(`用户聚合结果: ${result.userAggregation.length} 个用户`);
      console.log(`触发告警数量: ${result.triggeredAlerts.length}`);

      // 显示详细结果
      console.log('\n=== 时间聚合详情 ===');
      result.timeAggregation.forEach((item) => {
        console.log(`${item.key}: ${item.count} 条日志`);
      });

      console.log('\n=== 级别聚合详情 ===');
      result.levelAggregation.forEach((item) => {
        console.log(`${item.level}: ${item.count} 条日志`);
      });

      console.log('\n=== 用户聚合详情 ===');
      result.userAggregation.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.userId}: ${item.count} 条日志`);
      });

      if (result.triggeredAlerts.length > 0) {
        console.log('\n=== 触发告警详情 ===');
        result.triggeredAlerts.forEach((alert) => {
          console.log(`- ${alert.ruleName}: ${alert.message} (${alert.level})`);
        });
      }
    } catch (error) {
      console.error('日志分析失败:', error);
    }
  }
}

/**
 * 创建示例数据
 */
export function createSampleLogEntries(): LogEntry[] {
  const now = new Date();
  const entries: LogEntry[] = [];

  // 创建不同级别的日志条目
  const levels: LogLevel[] = ['info', 'warn', 'error', 'debug'];
  const messages = [
    'User login successful',
    'Database connection failed',
    'High memory usage detected',
    'Processing request data',
    'Authentication failed',
    'Cache miss occurred',
    'API response time exceeded threshold',
    'File upload completed',
  ];

  for (let i = 0; i < 100; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const timestamp = new Date(
      now.getTime() - Math.random() * 24 * 60 * 60 * 1000
    );

    entries.push({
      timestamp,
      level,
      message,
      context: {
        requestId: `req-${i}`,
        userId: `user-${Math.floor(Math.random() * 10)}`,
        traceId: `trace-${i}`,
      },
      data: {
        responseTime: Math.floor(Math.random() * 5000),
        memoryUsage: Math.floor(Math.random() * 100),
      },
    });
  }

  return entries;
}

/**
 * 运行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('=== HL8 SAAS平台日志增强功能示例 ===\n');

  // 创建示例数据
  const sampleEntries = createSampleLogEntries();
  console.log(`创建了 ${sampleEntries.length} 条示例日志\n`);

  // 过滤示例
  console.log('1. 日志过滤示例');
  const filterExamples = new LogFilterExamples();
  await filterExamples.basicFiltering(sampleEntries);
  await filterExamples.advancedFiltering(sampleEntries);
  console.log('');

  // 聚合示例
  console.log('2. 日志聚合示例');
  const aggregationExamples = new LogAggregationExamples();
  await aggregationExamples.timeAggregation(sampleEntries);
  await aggregationExamples.levelAggregation(sampleEntries);
  await aggregationExamples.userAggregation(sampleEntries);
  console.log('');

  // 告警示例
  console.log('3. 日志告警示例');
  const alertExamples = new LogAlertExamples();
  await alertExamples.basicAlerts();
  await alertExamples.processLogEntries(sampleEntries);
  await alertExamples.alertManagement();
  console.log('');

  // 综合分析示例
  console.log('4. 综合分析示例');
  const analysisExamples = new LogAnalysisExamples();
  await analysisExamples.completeAnalysis(sampleEntries);

  console.log('\n=== 示例运行完成 ===');
}

// 如果直接运行此文件，执行所有示例
// 注意：由于CommonJS限制，此功能在Node.js环境中可能不可用
// 建议通过其他方式调用 runAllExamples()
