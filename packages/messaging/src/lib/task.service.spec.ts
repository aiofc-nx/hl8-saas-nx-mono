import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { MessagingService } from './messaging.service';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import { TaskStatus } from './types/messaging.types';

describe('TaskService', () => {
  let service: TaskService;
  let messagingService: jest.Mocked<MessagingService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    // 创建模拟的消息服务
    const mockMessagingService = {
      sendToQueue: jest.fn(),
      consume: jest.fn(),
    };

    // 创建模拟的租户上下文服务
    const mockTenantContextService = {
      getTenant: jest.fn().mockReturnValue('tenant-123'),
      setTenant: jest.fn(),
      getUser: jest.fn(),
      setUser: jest.fn(),
      setRequestId: jest.fn(),
      getRequestId: jest.fn(),
      setContext: jest.fn(),
      getContext: jest.fn(),
      deleteContext: jest.fn(),
      hasContext: jest.fn(),
      getAllContext: jest.fn(),
      clear: jest.fn(),
      runWithContext: jest.fn(),
      runWithTenant: jest.fn(),
      runWithUser: jest.fn(),
      hasUserContext: jest.fn(),
      hasRequestContext: jest.fn(),
      getContextSummary: jest.fn(),
      validateContext: jest.fn(),
    };

    // 创建模拟的租户隔离服务
    const mockTenantIsolationService = {
      getTenantKey: jest.fn(),
      getTenantKeys: jest.fn(),
      getCurrentTenant: jest.fn(),
      clearTenantCache: jest.fn(),
      getTenantStats: jest.fn(),
      listTenantKeys: jest.fn(),
      getTenantNamespace: jest.fn(),
      isolateData: jest.fn(),
      extractTenantData: jest.fn(),
      validateTenantAccess: jest.fn(),
    };

    // 创建模拟的日志服务
    mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      isLevelEnabled: jest.fn(),
      child: jest.fn(),
      bindings: jest.fn(),
      flush: jest.fn(),
      level: 'info',
      silent: jest.fn(),
    } as unknown as jest.Mocked<PinoLogger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: TenantIsolationService,
          useValue: mockTenantIsolationService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    messagingService = module.get(MessagingService);
    tenantContextService = module.get(TenantContextService);
    mockLogger = module.get(PinoLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTask', () => {
    it('should add task with tenant context', async () => {
      const taskName = 'send-email';
      const data = { to: 'user@example.com', subject: 'Test' };

      await service.addTask(taskName, data);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(messagingService.sendToQueue).toHaveBeenCalledWith(
        `task.${taskName}`,
        expect.objectContaining({
          taskName,
          data,
          tenantId: 'tenant-123',
          status: TaskStatus.PENDING,
        }),
        undefined
      );
      expect(mockLogger.info).toHaveBeenCalledWith('任务添加成功', {
        taskId: expect.any(String),
        taskName,
        tenantId: 'tenant-123',
        hasData: true,
      });
    });

    it('should add task without tenant context', async () => {
      tenantContextService.getTenant.mockReturnValue(null);

      const taskName = 'send-email';
      const data = { to: 'user@example.com', subject: 'Test' };

      await service.addTask(taskName, data);

      expect(messagingService.sendToQueue).toHaveBeenCalledWith(
        `task.${taskName}`,
        expect.objectContaining({
          taskName,
          data,
          tenantId: null,
          status: TaskStatus.PENDING,
        }),
        undefined
      );
    });

    it('should handle addTask errors', async () => {
      messagingService.sendToQueue.mockRejectedValue(new Error('Send failed'));

      const taskName = 'send-email';
      const data = { to: 'user@example.com', subject: 'Test' };

      await expect(service.addTask(taskName, data)).rejects.toThrow(
        'Send failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('processTask', () => {
    it('should process task successfully', async () => {
      const taskName = 'send-email';
      const handler = jest.fn();

      await service.processTask(taskName, handler);

      expect(messagingService.consume).toHaveBeenCalledWith(
        `task.${taskName}`,
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('任务处理器注册成功', {
        taskName,
        handlerCount: 1,
      });
    });

    it('should handle task processing success', async () => {
      const taskName = 'send-email';
      const handler = jest.fn().mockResolvedValue(undefined);
      const taskData = {
        taskId: 'task-123',
        data: { to: 'user@example.com' },
        tenantId: 'tenant-123',
      };

      await service.processTask(taskName, handler);

      // 模拟消息到达
      const consumeCall = messagingService.consume.mock.calls[0];
      const messageHandler = consumeCall[1];

      await messageHandler(taskData);

      expect(handler).toHaveBeenCalledWith(taskData.data);
      expect(mockLogger.info).toHaveBeenCalledWith('任务处理成功', {
        taskId: 'task-123',
        taskName,
        tenantId: 'tenant-123',
      });
    });

    it('should handle task processing failure', async () => {
      const taskName = 'send-email';
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      const taskData = {
        taskId: 'task-123',
        data: { to: 'user@example.com' },
        tenantId: 'tenant-123',
      };

      await service.processTask(taskName, handler);

      // 模拟消息到达
      const consumeCall = messagingService.consume.mock.calls[0];
      const messageHandler = consumeCall[1];

      await messageHandler(taskData);

      expect(handler).toHaveBeenCalledWith(taskData.data);
      expect(mockLogger.error).toHaveBeenCalledWith('任务处理失败', {
        taskId: 'task-123',
        taskName,
        tenantId: 'tenant-123',
        error: 'Handler failed',
      });
    });
  });

  describe('cancelTask', () => {
    it('should cancel task', async () => {
      const taskId = 'task-123';

      await service.cancelTask(taskId);

      expect(mockLogger.info).toHaveBeenCalledWith('任务取消成功', {
        taskId,
      });
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status', async () => {
      const taskId = 'task-123';

      const status = await service.getTaskStatus(taskId);

      expect(status).toBe(TaskStatus.PENDING);
    });
  });

  describe('getTaskHistory', () => {
    it('should return empty array initially', async () => {
      const history = await service.getTaskHistory('test-task');

      expect(history).toEqual([]);
    });

    it('should return task history after adding task', async () => {
      const taskName = 'test-task';
      const data = { test: 'data' };

      await service.addTask(taskName, data);

      const history = await service.getTaskHistory(taskName);

      expect(history).toHaveLength(1);
      expect(history[0].taskName).toBe(taskName);
      expect(history[0].data).toEqual(data);
    });
  });

  describe('retryTask', () => {
    it('should retry task', async () => {
      const taskId = 'task-123';

      // 先添加一个任务
      await service.addTask('test-task', { test: 'data' });

      // 获取任务历史
      const history = await service.getTaskHistory('test-task');
      const taskRecord = history[0];

      // 模拟任务历史
      (service as unknown as { taskHistory: Map<string, unknown[]> }).taskHistory.set(taskId, [taskRecord]);

      await service.retryTask(taskId);

      expect(messagingService.sendToQueue).toHaveBeenCalledWith(
        'task.test-task',
        expect.objectContaining({
          taskName: 'test-task',
          data: { test: 'data' },
        }),
        expect.objectContaining({
          priority: 1,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith('任务重试成功', {
        taskId,
        taskName: 'test-task',
      });
    });

    it('should throw error for non-existent task', async () => {
      const taskId = 'non-existent';

      await expect(service.retryTask(taskId)).rejects.toThrow(
        'Task non-existent not found'
      );
    });
  });

  describe('failTask', () => {
    it('should fail task', async () => {
      const taskId = 'task-123';
      const error = new Error('Task failed');

      await service.failTask(taskId, error);

      expect(mockLogger.info).toHaveBeenCalledWith('任务标记为失败', {
        taskId,
        error: 'Task failed',
      });
    });
  });

  describe('scheduleTask', () => {
    it('should schedule task', async () => {
      const taskName = 'scheduled-task';
      const data = { test: 'data' };
      const schedule = {
        cron: '0 2 * * *',
      };

      await service.scheduleTask(taskName, data, schedule);

      expect(mockLogger.info).toHaveBeenCalledWith('任务调度成功', {
        taskId: expect.any(String),
        taskName,
        tenantId: 'tenant-123',
        nextRunAt: expect.any(Date),
      });
    });

    it('should handle immediate execution', async () => {
      const taskName = 'immediate-task';
      const data = { test: 'data' };
      const schedule = {
        immediate: true,
      };

      await service.scheduleTask(taskName, data, schedule);

      // 等待调度器执行
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messagingService.sendToQueue).toHaveBeenCalledWith(
        'task.immediate-task',
        expect.objectContaining({
          taskName,
          data,
        }),
        undefined
      );
    });
  });

  describe('cancelScheduledTask', () => {
    it('should cancel scheduled task', async () => {
      const taskId = 'task-123';

      await service.cancelScheduledTask(taskId);

      expect(mockLogger.info).toHaveBeenCalledWith('调度任务取消成功', {
        taskId,
      });
    });
  });

  describe('getScheduledTasks', () => {
    it('should return empty array initially', async () => {
      const tasks = await service.getScheduledTasks();

      expect(tasks).toEqual([]);
    });

    it('should return scheduled tasks', async () => {
      const taskName = 'scheduled-task';
      const data = { test: 'data' };
      const schedule = {
        cron: '0 2 * * *',
      };

      await service.scheduleTask(taskName, data, schedule);

      const tasks = await service.getScheduledTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskName).toBe(taskName);
      expect(tasks[0].data).toEqual(data);
    });
  });
});
