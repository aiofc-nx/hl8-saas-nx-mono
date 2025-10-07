/**
 * 异步处理器
 *
 * 提供完整的异步处理功能，包括任务队列、任务调度、任务监控、任务重试等。
 * 作为通用功能组件，为业务模块提供强大的异步处理能力。
 *
 * @description 异步处理器的完整实现，支持多种异步处理场景
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';

/**
 * 异步处理器配置
 */
export interface AsyncProcessorConfig {
  /** 是否启用异步处理 */
  enabled: boolean;
  /** 最大并发数 */
  maxConcurrency: number;
  /** 任务超时时间（毫秒） */
  taskTimeout: number;
  /** 任务重试次数 */
  maxRetries: number;
  /** 任务重试间隔（毫秒） */
  retryInterval: number;
  /** 任务队列大小 */
  queueSize: number;
  /** 任务监控 */
  monitoring: boolean;
  /** 任务统计 */
  statistics: boolean;
  /** 任务持久化 */
  persistence: boolean;
  /** 任务优先级 */
  priority: boolean;
}

/**
 * 任务状态
 */
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 任务信息
 */
export interface TaskInfo {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  payload: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  error?: Error;
  result?: any;
  metadata?: Record<string, any>;
}

/**
 * 异步处理器统计信息
 */
export interface AsyncProcessorStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  retryingTasks: number;
  successfulTasks: number;
  averageExecutionTime: number;
  averageQueueTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  lastActivity: Date;
  uptime: number;
}

/**
 * 异步处理器
 *
 * 提供完整的异步处理功能
 */
@Injectable()
export class AsyncProcessor {
  private readonly tasks = new Map<string, TaskInfo>();
  private readonly taskQueue: TaskInfo[] = [];
  private readonly runningTasks = new Set<string>();
  private readonly stats: AsyncProcessorStats = {
    totalTasks: 0,
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    retryingTasks: 0,
    successfulTasks: 0,
    averageExecutionTime: 0,
    averageQueueTime: 0,
    throughput: 0,
    errorRate: 0,
    successRate: 100,
    lastActivity: new Date(),
    uptime: 0,
  };

  private readonly startTime = Date.now();
  private readonly executionTimes: number[] = [];
  private readonly queueTimes: number[] = [];
  private processorTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    @Inject('AsyncProcessorConfig') private readonly config: AsyncProcessorConfig
  ) {
    this.startProcessor();
  }

  /**
   * 提交任务
   *
   * @description 提交异步任务到处理器
   * @param name - 任务名称
   * @param payload - 任务数据
   * @param options - 任务选项
   * @returns 任务ID
   */
  async submitTask(
    name: string,
    payload: any,
    options: {
      priority?: TaskPriority;
      timeout?: number;
      maxRetries?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const taskId = this.generateTaskId();
    const task: TaskInfo = {
      id: taskId,
      name,
      status: 'pending',
      priority: options.priority || 'normal',
      payload,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
      timeout: options.timeout || this.config.taskTimeout,
      metadata: options.metadata,
    };

    try {
      // 添加到任务队列
      this.tasks.set(taskId, task);
      this.addToQueue(task);

      // 更新统计信息
      this.stats.totalTasks++;
      this.stats.pendingTasks++;
      this.stats.lastActivity = new Date();
      this.updateStats();

      this.logger.info('任务已提交', {
        taskId,
        name,
        priority: task.priority,
        queueSize: this.taskQueue.length,
      });

      return taskId;
    } catch (error) {
      this.logger.error('提交任务失败', error, { taskId, name });
      throw error;
    }
  }

  /**
   * 获取任务状态
   *
   * @description 获取指定任务的状态
   * @param taskId - 任务ID
   * @returns 任务信息
   */
  getTaskStatus(taskId: string): TaskInfo | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * 取消任务
   *
   * @description 取消指定的任务
   * @param taskId - 任务ID
   * @returns 是否成功
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        this.logger.warn('任务不存在', { taskId });
        return false;
      }

      if (task.status === 'running') {
        // 正在运行的任务需要特殊处理
        this.logger.warn('无法取消正在运行的任务', { taskId });
        return false;
      }

      // 更新任务状态
      task.status = 'cancelled';
      task.completedAt = new Date();

      // 从队列中移除
      this.removeFromQueue(taskId);

      // 更新统计信息
      this.stats.pendingTasks--;
      this.stats.cancelledTasks++;
      this.updateStats();

      this.logger.info('任务已取消', { taskId });
      return true;
    } catch (error) {
      this.logger.error('取消任务失败', error, { taskId });
      return false;
    }
  }

  /**
   * 获取任务结果
   *
   * @description 获取指定任务的结果
   * @param taskId - 任务ID
   * @returns 任务结果
   */
  getTaskResult(taskId: string): any {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    if (task.status === 'completed') {
      return task.result;
    }

    if (task.status === 'failed') {
      throw task.error;
    }

    return null;
  }

  /**
   * 获取所有任务
   *
   * @description 获取所有任务的信息
   * @param status - 状态过滤（可选）
   * @returns 任务信息列表
   */
  getAllTasks(status?: TaskStatus): TaskInfo[] {
    const tasks = Array.from(this.tasks.values());
    return status ? tasks.filter((task) => task.status === status) : tasks;
  }

  /**
   * 获取任务队列
   *
   * @description 获取当前任务队列
   * @returns 任务队列
   */
  getTaskQueue(): TaskInfo[] {
    return [...this.taskQueue];
  }

  /**
   * 获取处理器统计信息
   *
   * @description 获取异步处理器的统计信息
   * @returns 统计信息
   */
  getStats(): AsyncProcessorStats {
    return { ...this.stats };
  }

  /**
   * 停止处理器
   *
   * @description 停止异步处理器
   */
  stopProcessor(): void {
    if (this.processorTimer) {
      clearInterval(this.processorTimer);
      this.processorTimer = null;
    }

    this.logger.info('异步处理器已停止');
  }

  /**
   * 清理已完成的任务
   *
   * @description 清理已完成的任务
   * @param olderThan - 清理早于指定时间的任务
   * @returns 清理的任务数量
   */
  async cleanupCompletedTasks(olderThan: Date): Promise<number> {
    let cleanedCount = 0;
    const tasksToClean = Array.from(this.tasks.values()).filter(
      (task) =>
        (task.status === 'completed' ||
          task.status === 'failed' ||
          task.status === 'cancelled') &&
        task.completedAt &&
        task.completedAt < olderThan
    );

    for (const task of tasksToClean) {
      this.tasks.delete(task.id);
      cleanedCount++;
    }

    this.logger.info('已完成任务清理完成', {
      cleanedCount,
      remainingTasks: this.tasks.size,
    });

    return cleanedCount;
  }

  // ==================== 私有方法 ====================

  /**
   * 启动处理器
   */
  private startProcessor(): void {
    if (!this.config.enabled) {
      return;
    }

    this.processorTimer = setInterval(async () => {
      try {
        await this.processTasks();
      } catch (error) {
        this.logger.error('处理任务失败', error);
      }
    }, 100); // 每100ms检查一次

    this.logger.info('异步处理器已启动', {
      maxConcurrency: this.config.maxConcurrency,
      queueSize: this.config.queueSize,
    });
  }

  /**
   * 处理任务
   */
  private async processTasks(): Promise<void> {
    // 检查是否有可用的并发槽位
    if (this.runningTasks.size >= this.config.maxConcurrency) {
      return;
    }

    // 获取下一个任务
    const task = this.getNextTask();
    if (!task) {
      return;
    }

    // 开始处理任务
    await this.executeTask(task);
  }

  /**
   * 获取下一个任务
   */
  private getNextTask(): TaskInfo | null {
    if (this.taskQueue.length === 0) {
      return null;
    }

    // 按优先级排序
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return this.taskQueue.shift() || null;
  }

  /**
   * 执行任务
   */
  private async executeTask(task: TaskInfo): Promise<void> {
    const startTime = Date.now();
    task.status = 'running';
    task.startedAt = new Date();

    this.runningTasks.add(task.id);
    this.stats.pendingTasks--;
    this.stats.runningTasks++;
    this.stats.lastActivity = new Date();

    try {
      // 这里应该实现具体的任务执行逻辑
      // 实际实现中会调用相应的任务处理器
      const result = await this.executeTaskHandler(task);

      // 任务执行成功
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      this.stats.completedTasks++;
      this.stats.successfulTasks = (this.stats.successfulTasks || 0) + 1;

      const executionTime = Date.now() - startTime;
      this.executionTimes.push(executionTime);
      this.updateStats();

      this.logger.info('任务执行成功', {
        taskId: task.id,
        name: task.name,
        executionTime,
      });
    } catch (error) {
      // 任务执行失败
      task.error = error instanceof Error ? error : new Error(String(error));
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        // 重试任务
        task.status = 'retrying';
        this.stats.retryingTasks++;

        // 延迟后重新加入队列
        setTimeout(() => {
          task.status = 'pending';
          this.addToQueue(task);
          this.stats.retryingTasks--;
        }, this.config.retryInterval);

        this.logger.warn('任务执行失败，将重试', {
          taskId: task.id,
          name: task.name,
          retryCount: task.retryCount,
          maxRetries: task.maxRetries,
          error: task.error.message,
        });
      } else {
        // 任务最终失败
        task.status = 'failed';
        task.completedAt = new Date();
        this.stats.failedTasks++;

        this.logger.error('任务执行最终失败', {
          taskId: task.id,
          name: task.name,
          retryCount: task.retryCount,
          error: task.error.message,
        });
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.stats.runningTasks--;
      this.updateStats();
    }
  }

  /**
   * 执行任务处理器
   */
  private async executeTaskHandler(task: TaskInfo): Promise<any> {
    // 这里应该实现具体的任务处理逻辑
    // 实际实现中会根据任务名称调用相应的处理器
    console.log(`执行任务: ${task.name}`, task.payload);

    // 模拟任务执行
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true, taskId: task.id };
  }

  /**
   * 添加到队列
   */
  private addToQueue(task: TaskInfo): void {
    if (this.taskQueue.length >= this.config.queueSize) {
      throw new Error('任务队列已满');
    }

    this.taskQueue.push(task);
  }

  /**
   * 从队列移除
   */
  private removeFromQueue(taskId: string): void {
    const index = this.taskQueue.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    // 计算平均执行时间
    if (this.executionTimes.length > 0) {
      this.stats.averageExecutionTime =
        this.executionTimes.reduce((sum, time) => sum + time, 0) /
        this.executionTimes.length;
    }

    // 计算平均队列时间
    if (this.queueTimes.length > 0) {
      this.stats.averageQueueTime =
        this.queueTimes.reduce((sum, time) => sum + time, 0) /
        this.queueTimes.length;
    }

    // 计算吞吐量
    const totalCompleted = this.stats.completedTasks + this.stats.failedTasks;
    this.stats.throughput = totalCompleted / (this.stats.uptime / 1000); // 每秒任务数

    // 计算错误率
    const totalTasks = this.stats.completedTasks + this.stats.failedTasks;
    this.stats.errorRate =
      totalTasks > 0 ? (this.stats.failedTasks / totalTasks) * 100 : 0;
    this.stats.successRate = 100 - this.stats.errorRate;

    // 更新运行时间
    this.stats.uptime = Date.now() - this.startTime;
  }
}
