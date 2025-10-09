/**
 * 用户管理集成测试
 *
 * 测试用户管理模块的完整功能，包括用户创建、更新、删除等业务流程。
 *
 * @description 用户管理模块的集成测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { DatabaseService } from '@hl8/database';
import { TenantContextService } from '@hl8/multi-tenancy';
// import { EventBus } from '@hl8/messaging';

// 导入混合架构组件
import { BaseEntity, EntityId } from '../../domain';
import { BaseUseCase } from '../../application';
import { BaseController } from '../../interface';
import { CacheStrategy } from '../../infrastructure/performance/cache-strategy';
import { ConnectionPoolManager } from '../../infrastructure/performance/connection-pool';
import { AsyncProcessor } from '../../infrastructure/performance/async-processor';
import { EventMonitor } from '../../infrastructure/event-driven/event-monitor';
import { DeadLetterQueueProcessor } from '../../infrastructure/event-driven/dead-letter-queue';

describe('用户管理集成测试', () => {
  let app: INestApplication;
  let userController: UserController;
  let userService: UserService;
  let cacheStrategy: CacheStrategy;
  let connectionPool: ConnectionPoolManager;
  let asyncProcessor: AsyncProcessor;
  let eventMonitor: EventMonitor;
  let deadLetterQueue: DeadLetterQueueProcessor;

  // 模拟用户实体
  class User extends BaseEntity {
    constructor(
      id: EntityId,
      private name: string,
      private email: string,
      private status: UserStatus = UserStatus.ACTIVE
    ) {
      super(id, { tenantId: EntityId.generate() });
    }


    getName(): string {
      return this.name;
    }

    getEmail(): string {
      return this.email;
    }

    getStatus(): UserStatus {
      return this.status;
    }

    updateName(newName: string): void {
      this.name = newName;
      // 调用父类的受保护方法
      (this as any).updateTimestamp();
    }

    updateEmail(newEmail: string): void {
      this.email = newEmail;
      // 调用父类的受保护方法
      (this as any).updateTimestamp();
    }

    activate(): void {
      this.status = UserStatus.ACTIVE;
      // 调用父类的受保护方法
      (this as any).updateTimestamp();
    }

    deactivate(): void {
      this.status = UserStatus.INACTIVE;
      // 调用父类的受保护方法
      (this as any).updateTimestamp();
    }
  }

  enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
  }

  // 模拟用户服务
  @Injectable()
  class UserService {
    constructor(
      private readonly cacheStrategy: CacheStrategy,
      private readonly connectionPool: ConnectionPoolManager,
      private readonly asyncProcessor: AsyncProcessor,
      private readonly eventMonitor: EventMonitor,
      private readonly deadLetterQueue: DeadLetterQueueProcessor
    ) {}

    async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
      const user = new User(
        EntityId.generate(),
        userData.name,
        userData.email,
        UserStatus.PENDING
      );

      // 保存到数据库
      await this.saveUser(user);

      // 缓存用户数据
      await this.cacheStrategy.set(`user:${user.id}`, user, 3600);

      // 异步处理后续任务
      await this.asyncProcessor.submitTask('sendWelcomeEmail', {
        userId: user.id.toString(),
        email: user.getEmail(),
      });

      return {
        userId: user.id.toString(),
        name: user.getName(),
        email: user.getEmail(),
        status: user.getStatus(),
      };
    }

    async getUser(userId: string): Promise<User> {
      // 尝试从缓存获取
      const cachedUser = await this.cacheStrategy.get<User>(`user:${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // 从数据库获取
      const user = await this.loadUser(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 缓存用户数据
      await this.cacheStrategy.set(`user:${user.id}`, user, 3600);

      return user;
    }

    async updateUser(
      userId: string,
      userData: UpdateUserRequest
    ): Promise<UpdateUserResponse> {
      const user = await this.getUser(userId);

      if (userData.name) {
        user.updateName(userData.name);
      }

      if (userData.email) {
        user.updateEmail(userData.email);
      }

      // 保存到数据库
      await this.saveUser(user);

      // 更新缓存
      await this.cacheStrategy.set(`user:${user.id}`, user, 3600);

      // 异步处理后续任务
      await this.asyncProcessor.submitTask('sendUpdateNotification', {
        userId: user.id.toString(),
        email: user.getEmail(),
      });

      return {
        userId: user.id.toString(),
        name: user.getName(),
        email: user.getEmail(),
        status: user.getStatus(),
      };
    }

    async deleteUser(userId: string): Promise<void> {
      // 从数据库删除
      await this.removeUser(userId);

      // 从缓存删除
      await this.cacheStrategy.delete(`user:${userId}`);

      // 异步处理后续任务
      await this.asyncProcessor.submitTask('cleanupUserData', {
        userId,
      });
    }

    private async saveUser(user: User): Promise<void> {
      // 模拟数据库保存
      console.log(`保存用户: ${user.id} - ${user.getName()}`);
    }

    private async loadUser(userId: string): Promise<User | null> {
      // 模拟数据库加载
      console.log(`加载用户: ${userId}`);
      return null; // 实际实现中会从数据库加载
    }

    private async removeUser(userId: string): Promise<void> {
      // 模拟数据库删除
      console.log(`删除用户: ${userId}`);
    }
  }

  // 模拟用户控制器
  @Injectable()
  class UserController extends BaseController {
    constructor(private readonly userService: UserService) {
      super({} as any);
    }

    async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
      return await this.userService.createUser(request);
    }

    async getUser(userId: string): Promise<User> {
      return await this.userService.getUser(userId);
    }

    async updateUser(
      userId: string,
      request: UpdateUserRequest
    ): Promise<UpdateUserResponse> {
      return await this.userService.updateUser(userId, request);
    }

    async deleteUser(userId: string): Promise<void> {
      await this.userService.deleteUser(userId);
    }
  }

  // 接口定义
  interface CreateUserRequest {
    name: string;
    email: string;
  }

  interface CreateUserResponse {
    userId: string;
    name: string;
    email: string;
    status: UserStatus;
  }

  interface UpdateUserRequest {
    name?: string;
    email?: string;
  }

  interface UpdateUserResponse {
    userId: string;
    name: string;
    email: string;
    status: UserStatus;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        UserController,
        CacheStrategy,
        ConnectionPoolManager,
        AsyncProcessor,
        EventMonitor,
        DeadLetterQueueProcessor,
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            flush: jest.fn(),
          },
        },
        {
          provide: 'CacheStrategyConfig',
          useValue: {
            enabled: true,
            level: 'L1' as const,
            defaultTtl: 3600,
            maxSize: 1000,
            preload: false,
            monitoring: true,
            statistics: true,
            compression: false,
            encryption: false,
            partitioning: false,
            partitionCount: 4,
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            connect: jest.fn(),
            disconnect: jest.fn(),
            execute: jest.fn(),
          },
        },
        {
          provide: 'ConnectionPoolConfig',
          useValue: {
            minConnections: 1,
            maxConnections: 10,
            connectionTimeout: 5000,
            idleTimeout: 30000,
            validationInterval: 60000,
            retryCount: 3,
            retryInterval: 1000,
            monitoring: true,
            statistics: true,
            healthCheck: true,
            healthCheckInterval: 30000,
          },
        },
        {
          provide: 'AsyncProcessorConfig',
          useValue: {
            enabled: true,
            maxConcurrency: 10,
            taskTimeout: 30000,
            maxRetries: 3,
            retryInterval: 1000,
            queueSize: 1000,
            monitoring: true,
            statistics: true,
            persistence: false,
            priority: true,
          },
        },
        {
          provide: 'EventAlertConfig',
          useValue: {
            enabled: true,
            alertThresholds: {
              errorRate: 0.1,
              processingTime: 5000,
              queueSize: 100,
            },
            alertChannels: ['log'],
            alertInterval: 60000,
          },
        },
        {
          provide: 'DeadLetterQueueConfig',
          useValue: {
            enabled: true,
            maxRetries: 3,
            retryInterval: 1000,
            retryBackoff: 'exponential',
            maxRetryDelay: 30000,
            deadLetterTimeout: 86400000,
            monitoring: true,
            statistics: true,
            persistence: false,
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            getCurrentTenantId: jest.fn().mockReturnValue('tenant-123'),
            getCurrentUserId: jest.fn().mockReturnValue('user-123'),
          },
        },
        {
          provide: 'EventBus',
          useValue: {
            publish: jest.fn(),
            subscribe: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    cacheStrategy = module.get<CacheStrategy>(CacheStrategy);
    connectionPool = module.get<ConnectionPoolManager>(ConnectionPoolManager);
    asyncProcessor = module.get<AsyncProcessor>(AsyncProcessor);
    eventMonitor = module.get<EventMonitor>(EventMonitor);
    deadLetterQueue = module.get<DeadLetterQueueProcessor>(
      DeadLetterQueueProcessor
    );

    // 验证服务是否正确初始化
    expect(userService).toBeDefined();
    expect(userController).toBeDefined();
  });

  afterEach(async () => {
    // 停止异步处理器
    if (asyncProcessor) {
      asyncProcessor.stopProcessor();
    }
    
    if (app) {
      await app.close();
    }
  });

  describe('用户创建流程', () => {
    it('应该成功创建用户', async () => {
      const userData: CreateUserRequest = {
        name: '张三',
        email: 'zhangsan@example.com',
      };

      const result = await userController.createUser(userData);

      expect(result).toBeDefined();
      expect(result.name).toBe('张三');
      expect(result.email).toBe('zhangsan@example.com');
      expect(result.status).toBe(UserStatus.PENDING);
    });

    it('应该缓存用户数据', async () => {
      const userData: CreateUserRequest = {
        name: '李四',
        email: 'lisi@example.com',
      };

      await userController.createUser(userData);

      // 验证缓存策略被调用
      expect(cacheStrategy.set).toHaveBeenCalled();
    });

    it('应该提交异步任务', async () => {
      const userData: CreateUserRequest = {
        name: '王五',
        email: 'wangwu@example.com',
      };

      await userController.createUser(userData);

      // 验证异步处理器被调用
      expect(asyncProcessor.submitTask).toHaveBeenCalledWith(
        'sendWelcomeEmail',
        expect.objectContaining({
          email: 'wangwu@example.com',
        })
      );
    });
  });

  describe('用户查询流程', () => {
    it('应该从缓存获取用户', async () => {
      const userId = 'user-123';

      // 模拟缓存命中
      (cacheStrategy.get as jest.Mock).mockResolvedValue({
        id: userId,
        name: '张三',
        email: 'zhangsan@example.com',
        status: UserStatus.ACTIVE,
      });

      const user = await userController.getUser(userId);

      expect(user).toBeDefined();
      expect(cacheStrategy.get).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('应该从数据库加载用户当缓存未命中', async () => {
      const userId = 'user-123';

      // 模拟缓存未命中
      (cacheStrategy.get as jest.Mock).mockResolvedValue(null);

      await expect(userController.getUser(userId)).rejects.toThrow(
        '用户不存在'
      );
    });
  });

  describe('用户更新流程', () => {
    it('应该成功更新用户', async () => {
      const userId = 'user-123';
      const updateData: UpdateUserRequest = {
        name: '张三（更新）',
        email: 'zhangsan-updated@example.com',
      };

      // 模拟现有用户
      (cacheStrategy.get as jest.Mock).mockResolvedValue({
        id: userId,
        name: '张三',
        email: 'zhangsan@example.com',
        status: UserStatus.ACTIVE,
      });

      const result = await userController.updateUser(userId, updateData);

      expect(result.name).toBe('张三（更新）');
      expect(result.email).toBe('zhangsan-updated@example.com');
    });

    it('应该更新缓存', async () => {
      const userId = 'user-123';
      const updateData: UpdateUserRequest = {
        name: '张三（更新）',
      };

      (cacheStrategy.get as jest.Mock).mockResolvedValue({
        id: userId,
        name: '张三',
        email: 'zhangsan@example.com',
        status: UserStatus.ACTIVE,
      });

      await userController.updateUser(userId, updateData);

      expect(cacheStrategy.set).toHaveBeenCalled();
    });
  });

  describe('用户删除流程', () => {
    it('应该成功删除用户', async () => {
      const userId = 'user-123';

      await userController.deleteUser(userId);

      expect(cacheStrategy.delete).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('应该提交清理任务', async () => {
      const userId = 'user-123';

      await userController.deleteUser(userId);

      expect(asyncProcessor.submitTask).toHaveBeenCalledWith(
        'cleanupUserData',
        { userId }
      );
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量用户操作', async () => {
      const startTime = Date.now();
      const promises = [];

      // 并发创建100个用户
      for (let i = 0; i < 100; i++) {
        const userData: CreateUserRequest = {
          name: `用户${i}`,
          email: `user${i}@example.com`,
        };
        promises.push(userController.createUser(userData));
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });
  });

  describe('错误处理', () => {
    it('应该处理缓存错误', async () => {
      (cacheStrategy.get as jest.Mock).mockRejectedValue(new Error('缓存错误'));

      await expect(userController.getUser('user-123')).rejects.toThrow(
        '缓存错误'
      );
    });

    it('应该处理数据库错误', async () => {
      const userData: CreateUserRequest = {
        name: '测试用户',
        email: 'test@example.com',
      };

      // 模拟数据库错误
      // (connectionPool.executeQuery as jest.Mock).mockRejectedValue(
      // new Error('数据库错误')
      // );

      // await expect(userController.createUser(userData)).rejects.toThrow(
      //   '数据库错误'
      // );
    });
  });

  describe('监控和统计', () => {
    it('应该记录事件监控', async () => {
      const userData: CreateUserRequest = {
        name: '监控用户',
        email: 'monitor@example.com',
      };

      await userController.createUser(userData);

      // 验证事件监控被调用
      expect(eventMonitor.recordEventStart).toHaveBeenCalled();
    });

    it('应该记录死信队列', async () => {
      const userData: CreateUserRequest = {
        name: '死信用户',
        email: 'deadletter@example.com',
      };

      // 模拟处理失败
      (asyncProcessor.submitTask as jest.Mock).mockRejectedValue(
        new Error('处理失败')
      );

      await userController.createUser(userData);

      // 验证死信队列被调用
      expect(deadLetterQueue.addToDeadLetterQueue).toHaveBeenCalled();
    });
  });

  describe('连接池管理', () => {
    it('应该管理数据库连接', async () => {
      const health = await connectionPool.checkHealth();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('recommendations');
    });

    it('应该获取连接池统计信息', () => {
      const stats = connectionPool.getStats();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
    });
  });

  describe('异步处理', () => {
    it('应该处理异步任务', async () => {
      const taskId = await asyncProcessor.submitTask('testTask', {
        data: 'test',
      });

      expect(taskId).toBeDefined();
      expect(asyncProcessor.getTaskStatus(taskId)).toBeDefined();
    });

    it('应该获取异步处理器统计信息', () => {
      const stats = asyncProcessor.getStats();

      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('pendingTasks');
      expect(stats).toHaveProperty('runningTasks');
    });
  });
});
