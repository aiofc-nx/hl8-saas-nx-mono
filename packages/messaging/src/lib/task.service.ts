import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
// 异常导入已移除，因为当前未使用
import { MessagingService } from './messaging.service';
import {
  ITaskService,
  TaskHandler,
  TaskOptions,
  TaskStatus,
  TaskHistory,
  ScheduledTask,
  ScheduleOptions,
  TaskMessage,
} from './types/messaging.types';

/**
 * 任务服务
 *
 * 集成@hl8/multi-tenancy的异步任务处理服务，提供统一的任务管理。
 *
 * @description 此服务提供完整的异步任务处理能力。
 * 支持任务队列、任务调度、任务状态跟踪等功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 任务管理规则
 * - 支持任务添加和删除
 * - 支持任务状态跟踪
 * - 支持任务历史记录
 * - 支持任务重试和失败处理
 *
 * ### 任务调度规则
 * - 支持任务调度和定时执行
 * - 支持任务优先级管理
 * - 支持任务依赖关系
 * - 支持任务并发控制
 *
 * ### 租户隔离规则
 * - 自动处理租户上下文
 * - 支持租户级别的任务隔离
 * - 支持租户级别的任务配置
 * - 支持租户级别的任务监控
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class EmailService {
 *   constructor(private readonly taskService: TaskService) {}
 * 
 *   async sendWelcomeEmail(userId: string, email: string): Promise<void> {
 *     // 添加发送邮件任务 - 自动处理租户上下文
 *     await this.taskService.addTask('send-welcome-email', {
 *       userId,
 *       email,
 *       template: 'welcome'
 *     });
 *   }
 * 
 *   // 任务处理器 - 自动处理租户上下文
 *   @TaskHandler('send-welcome-email')
 *   async handleSendWelcomeEmail(taskData: WelcomeEmailTaskData): Promise<void> {
 *     await this.emailService.sendEmail(taskData.email, 'welcome', taskData);
 *   }
 * }
 * ```
 */
@Injectable()
export class TaskService implements ITaskService {
  private taskHandlers: Map<string, TaskHandler> = new Map();
  private taskStatus: Map<string, TaskStatus> = new Map();
  private taskHistory: Map<string, TaskHistory[]> = new Map();
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'task-service' });
  }

  /**
   * 添加任务到队列
   *
   * @description 添加异步任务到消息队列，自动处理租户上下文
   *
   * @param taskName 任务名称
   * @param data 任务数据
   * @param options 任务选项
   * @returns Promise<void>
   *
   * @throws {Error} 当任务添加失败时抛出错误
   */
  async addTask<T>(
    taskName: string,
    data: T,
    options?: TaskOptions
  ): Promise<void> {
    try {
      const taskId = this.generateTaskId();
      const tenantId = this.tenantContextService.getTenant();

      // 记录任务历史
      this.recordTaskHistory(
        taskId,
        taskName,
        TaskStatus.PENDING,
        data,
        tenantId || undefined
      );

      // 设置任务状态
      this.taskStatus.set(taskId, TaskStatus.PENDING);

      // 发送任务到消息队列
      await this.messagingService.sendToQueue('task-queue', {
        taskId,
        taskName,
        data,
        options,
        tenantId: tenantId || undefined,
      });

      this.logger.info('任务添加成功', {
        taskId,
        taskName,
        tenantId: tenantId || undefined,
      });
    } catch (error) {
      this.logger.error('任务添加失败', {
        taskName,
        tenantId: this.tenantContextService.getTenant() || undefined,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 处理任务
   *
   * @description 处理队列中的任务，自动调用相应的处理器
   *
   * @param taskName 任务名称
   * @param handler 任务处理器
   * @returns Promise<void>
   */
  async processTask<T>(
    taskName: string,
    handler: TaskHandler<T>
  ): Promise<void> {
    try {
      // 注册任务处理器
      this.taskHandlers.set(taskName, handler as TaskHandler);

      // 消费任务队列
      await this.messagingService.consume(
        'task-queue',
        async (message: unknown) => {
          try {
            const messageData = message as TaskMessage & { tenantId?: string };
            const {
              taskId,
              taskName: messageTaskName,
              data,
              tenantId,
            } = messageData;

            // 验证任务名称
            if (messageTaskName !== taskName) {
              return;
            }

            // 设置租户上下文
            if (tenantId) {
              // 设置租户上下文
              const originalTenant = this.tenantContextService.getTenant();
              this.tenantContextService.setContext({
                tenantId,
                timestamp: new Date(),
              });
              try {
                await this.executeTask(taskId, taskName, data as T, handler);
              } finally {
                this.tenantContextService.setContext({
                  tenantId: originalTenant || '',
                  timestamp: new Date(),
                });
              }
            } else {
              await this.executeTask(taskId, taskName, data as T, handler);
            }
          } catch (error) {
            this.logger.error('任务处理失败', {
              taskName,
              error: (error as Error).message,
            });
            throw error;
          }
        }
      );

      this.logger.info('任务处理器注册成功', { taskName });
    } catch (error) {
      this.logger.error('任务处理器注册失败', {
        taskName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 取消任务
   *
   * @description 取消指定任务，将任务状态设置为已取消
   *
   * @param taskId 任务ID
   * @returns Promise<void>
   *
   * @throws {Error} 当任务不存在时抛出错误
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const currentStatus = this.taskStatus.get(taskId);
      if (!currentStatus) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (currentStatus === TaskStatus.COMPLETED) {
        throw new Error(`Task ${taskId} is already completed`);
      }

      // 设置任务状态为已取消
      this.taskStatus.set(taskId, TaskStatus.CANCELLED);

      // 更新任务历史
      const history = this.taskHistory.get(taskId);
      if (history && history.length > 0) {
        const lastRecord = history[history.length - 1];
        this.recordTaskHistory(
          taskId,
          lastRecord.taskName,
          TaskStatus.CANCELLED,
          lastRecord.data,
          lastRecord.tenantId
        );
      }

      this.logger.info('任务取消成功', { taskId });
    } catch (error) {
      this.logger.error('任务取消失败', {
        taskId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取任务状态
   *
   * @description 获取指定任务的当前状态
   *
   * @param taskId 任务ID
   * @returns Promise<TaskStatus> 任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    return this.taskStatus.get(taskId) || TaskStatus.PENDING;
  }

  /**
   * 获取任务历史
   *
   * @description 获取指定任务的历史记录
   *
   * @param taskName 任务名称
   * @param limit 限制数量
   * @returns Promise<TaskHistory[]> 任务历史记录数组
   */
  async getTaskHistory(
    taskName: string,
    limit?: number
  ): Promise<TaskHistory[]> {
    const allHistory: TaskHistory[] = [];
    for (const history of this.taskHistory.values()) {
      allHistory.push(...history.filter((h) => h.taskName === taskName));
    }
    return limit ? allHistory.slice(0, limit) : allHistory;
  }

  /**
   * 重试任务
   *
   * @description 重新执行失败的任务
   *
   * @param taskId 任务ID
   * @returns Promise<void>
   *
   * @throws {Error} 当任务不存在时抛出错误
   */
  async retryTask(taskId: string): Promise<void> {
    try {
      const history = this.taskHistory.get(taskId);
      if (!history || history.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const lastRecord = history[history.length - 1];

      // 设置任务状态为重试中
      this.taskStatus.set(taskId, TaskStatus.RETRYING);
      this.recordTaskHistory(
        taskId,
        lastRecord.taskName,
        TaskStatus.RETRYING,
        lastRecord.data,
        lastRecord.tenantId
      );

      // 重新添加任务到队列
      await this.addTask(lastRecord.taskName, lastRecord.data, {
        priority: 1, // 重试任务使用较高优先级
      });

      this.logger.info('任务重试成功', {
        taskId,
        taskName: lastRecord.taskName,
      });
    } catch (error) {
      this.logger.error('任务重试失败', {
        taskId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 标记任务为失败
   *
   * @description 手动标记任务为失败状态
   *
   * @param taskId 任务ID
   * @param error 错误信息
   * @returns Promise<void>
   *
   * @throws {Error} 当标记任务失败时抛出错误
   */
  async failTask(taskId: string, error: Error): Promise<void> {
    try {
      this.taskStatus.set(taskId, TaskStatus.FAILED);

      // 更新任务历史
      const history = this.taskHistory.get(taskId);
      if (history && history.length > 0) {
        const lastRecord = history[history.length - 1];
        this.recordTaskHistory(
          taskId,
          lastRecord.taskName,
          TaskStatus.FAILED,
          lastRecord.data,
          lastRecord.tenantId,
          error
        );
      }

      this.logger.info('任务标记为失败', {
        taskId,
        error: error.message,
      });
    } catch (err) {
      this.logger.error('任务标记失败时出错', {
        taskId,
        error: (err as Error).message,
      });
      throw err;
    }
  }

  /**
   * 调度任务
   *
   * @description 按计划执行任务
   *
   * @param taskName 任务名称
   * @param data 任务数据
   * @param schedule 调度选项
   * @returns Promise<void>
   *
   * @throws {Error} 当任务调度失败时抛出错误
   */
  async scheduleTask<T>(
    taskName: string,
    data: T,
    schedule: ScheduleOptions
  ): Promise<void> {
    try {
      const taskId = this.generateTaskId();
      const tenantId = this.tenantContextService.getTenant();

      const scheduledTask: ScheduledTask = {
        taskId,
        taskName,
        schedule,
        data,
        nextRunAt: this.calculateNextRun(schedule),
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: tenantId || undefined,
      };

      // 存储调度任务
      this.scheduledTasks.set(taskId, scheduledTask);

      // 启动调度器
      this.startScheduler(taskId, scheduledTask);

      this.logger.info('任务调度成功', {
        taskId,
        taskName,
        tenantId: tenantId || undefined,
        nextRunAt: scheduledTask.nextRunAt,
      });
    } catch (error) {
      this.logger.error('任务调度失败', {
        taskName,
        tenantId: this.tenantContextService.getTenant() || undefined,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 取消调度任务
   *
   * @description 取消已调度的任务
   *
   * @param taskId 任务ID
   * @returns Promise<void>
   *
   * @throws {Error} 当任务不存在时抛出错误
   */
  async cancelScheduledTask(taskId: string): Promise<void> {
    try {
      const scheduledTask = this.scheduledTasks.get(taskId);
      if (scheduledTask) {
        // 标记任务为已取消
        scheduledTask.status = TaskStatus.CANCELLED;
        this.scheduledTasks.set(taskId, scheduledTask);

        this.logger.info('调度任务取消成功', { taskId });
      } else {
        throw new Error(`Scheduled task ${taskId} not found`);
      }
    } catch (error) {
      this.logger.error('调度任务取消失败', {
        taskId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取所有调度任务
   *
   * @description 获取所有已调度的任务列表
   *
   * @returns 调度任务数组
   */
  async getScheduledTasks(): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values());
  }

  /**
   * 执行任务
   *
   * @description 执行具体的任务逻辑
   *
   * @param taskId 任务ID
   * @param taskName 任务名称
   * @param data 任务数据
   * @param handler 任务处理器
   * @returns Promise<void>
   *
   * @private
   */
  private async executeTask<T>(
    taskId: string,
    taskName: string,
    data: T,
    handler: TaskHandler<T>
  ): Promise<void> {
    try {
      // 设置任务状态为运行中
      this.taskStatus.set(taskId, TaskStatus.RUNNING);

      // 执行任务处理器
      await handler(data);

      // 设置任务状态为已完成
      this.taskStatus.set(taskId, TaskStatus.COMPLETED);

      // 记录任务历史
      const tenantId = this.tenantContextService.getTenant();
      this.recordTaskHistory(
        taskId,
        taskName,
        TaskStatus.COMPLETED,
        data,
        tenantId || undefined
      );

      this.logger.info('任务执行成功', {
        taskId,
        taskName,
        tenantId: tenantId || undefined,
      });
    } catch (error) {
      // 设置任务状态为失败
      this.taskStatus.set(taskId, TaskStatus.FAILED);

      // 记录任务历史
      const tenantId = this.tenantContextService.getTenant();
      this.recordTaskHistory(
        taskId,
        taskName,
        TaskStatus.FAILED,
        data,
        tenantId || undefined,
        error as Error
      );

      this.logger.error('任务执行失败', {
        taskId,
        taskName,
        tenantId: tenantId || undefined,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * 记录任务历史
   *
   * @description 记录任务的执行历史
   *
   * @param taskId 任务ID
   * @param taskName 任务名称
   * @param status 任务状态
   * @param data 任务数据
   * @param tenantId 租户ID
   * @param error 错误信息（可选）
   * @returns void
   *
   * @private
   */
  private recordTaskHistory(
    taskId: string,
    taskName: string,
    status: TaskStatus,
    data: unknown,
    tenantId?: string,
    error?: Error
  ): void {
    const history = this.taskHistory.get(taskId) || [];

    const taskHistory: TaskHistory = {
      taskId,
      taskName,
      status,
      createdAt: new Date(),
      data,
      error: error?.message,
      tenantId,
    };

    history.push(taskHistory);
    this.taskHistory.set(taskId, history);
  }

  /**
   * 计算下次运行时间
   *
   * @description 根据调度选项计算下次运行时间
   *
   * @param schedule 调度选项
   * @returns 下次运行时间
   *
   * @private
   */
  private calculateNextRun(schedule: ScheduleOptions): Date {
    const now = new Date();

    // 立即执行
    if (schedule.immediate) {
      return now;
    }

    // Cron表达式调度
    if (schedule.cron) {
      // 这里应该使用cron库来计算下次执行时间
      // 为了简化，这里返回1分钟后
      return new Date(now.getTime() + 60000);
    }

    // 间隔调度
    if (schedule.interval) {
      return new Date(now.getTime() + schedule.interval);
    }

    // 延迟调度
    if (schedule.delay) {
      return new Date(now.getTime() + (schedule.delay as number));
    }

    // 默认返回1分钟后
    return new Date(now.getTime() + 60000);
  }

  /**
   * 启动调度器
   *
   * @description 启动任务调度器
   *
   * @param taskId 任务ID
   * @param scheduledTask 调度任务
   * @returns void
   *
   * @private
   */
  private startScheduler(taskId: string, scheduledTask: ScheduledTask): void {
    const now = new Date();
    const delay = scheduledTask.nextRunAt.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(async () => {
        try {
          const currentTask = this.scheduledTasks.get(taskId);
          if (currentTask && currentTask.status !== TaskStatus.CANCELLED) {
            // 执行任务
            await this.addTask(scheduledTask.taskName, scheduledTask.data);

            // 计算下次运行时间
            currentTask.nextRunAt = this.calculateNextRun(currentTask.schedule);
            currentTask.updatedAt = new Date();

            // 更新调度任务
            this.scheduledTasks.set(taskId, currentTask);

            // 继续调度
            this.startScheduler(taskId, currentTask);
          }
        } catch (error) {
          this.logger.error('调度任务执行失败', {
            taskId,
            error: (error as Error).message,
          });
        }
      }, delay);
    }
  }

  /**
   * 生成任务ID
   *
   * @description 生成唯一的任务ID
   *
   * @returns 任务ID
   *
   * @private
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
