import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { MessagingService } from './messaging.service';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('EventService', () => {
  let service: EventService;
  let messagingService: jest.Mocked<MessagingService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    // 创建模拟的消息服务
    const mockMessagingService = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
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
        EventService,
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

    service = module.get<EventService>(EventService);
    messagingService = module.get(MessagingService);
    tenantContextService = module.get(TenantContextService);
    mockLogger = module.get(PinoLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emit', () => {
    it('should emit event with tenant context', async () => {
      const eventName = 'user.created';
      const data = { userId: 'user-123' };

      await service.emit(eventName, data);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(messagingService.publish).toHaveBeenCalledWith(
        `tenant.${tenantContextService.getTenant()}.event.${eventName}`,
        data
      );
      expect(mockLogger.info).toHaveBeenCalledWith('事件发布成功', {
        eventName,
        tenantId: 'tenant-123',
        hasData: true,
      });
    });

    it('should emit global event without tenant context', async () => {
      tenantContextService.getTenant.mockReturnValue(null);

      const eventName = 'system.initialized';
      const data = { timestamp: new Date() };

      await service.emit(eventName, data);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(messagingService.publish).toHaveBeenCalledWith(
        `event.${eventName}`,
        data,
        undefined
      );
    });

    it('should handle emit errors', async () => {
      messagingService.publish.mockRejectedValue(new Error('Publish failed'));

      const eventName = 'user.created';
      const data = { userId: 'user-123' };

      await expect(service.emit(eventName, data)).rejects.toThrow(
        'Publish failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('on', () => {
    it('should subscribe to event', async () => {
      const eventName = 'user.created';
      const handler = jest.fn();

      await service.on(eventName, handler);

      expect(messagingService.subscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('事件订阅成功', {
        eventName,
        handlerCount: 1,
      });
    });

    it('should handle event processing errors', async () => {
      const eventName = 'user.created';
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));

      await service.on(eventName, handler);

      // 模拟消息到达
      const subscribeCall = messagingService.subscribe.mock.calls[0];
      const messageHandler = subscribeCall[1];

      await messageHandler({ userId: 'user-123' });

      expect(handler).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(mockLogger.error).toHaveBeenCalledWith('事件处理失败', {
        eventName,
        error: 'Handler failed',
      });
    });
  });

  describe('off', () => {
    it('should unsubscribe from event with specific handler', async () => {
      const eventName = 'user.created';
      const handler = jest.fn();

      // 先订阅
      await service.on(eventName, handler);

      // 再取消订阅
      await service.off(eventName, handler);

      expect(messagingService.unsubscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        handler
      );
    });

    it('should unsubscribe from event without specific handler', async () => {
      const eventName = 'user.created';

      await service.off(eventName);

      expect(messagingService.unsubscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        undefined
      );
    });
  });

  describe('once', () => {
    it('should subscribe to event once', async () => {
      const eventName = 'system.initialized';
      const handler = jest.fn();

      await service.once(eventName, handler);

      expect(messagingService.subscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('一次性事件订阅成功', {
        eventName,
      });
    });

    it('should auto-unsubscribe after handling once', async () => {
      const eventName = 'system.initialized';
      const handler = jest.fn();

      await service.once(eventName, handler);

      // 模拟消息到达
      const subscribeCall = messagingService.subscribe.mock.calls[0];
      const messageHandler = subscribeCall[1];

      await messageHandler({ timestamp: new Date() });

      expect(handler).toHaveBeenCalled();
      expect(messagingService.unsubscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        expect.any(Function)
      );
    });
  });

  describe('getEventNames', () => {
    it('should return empty array initially', () => {
      const eventNames = service.getEventNames();

      expect(eventNames).toEqual([]);
    });

    it('should return event names after subscription', async () => {
      const eventName = 'user.created';
      const handler = jest.fn();

      await service.on(eventName, handler);

      const eventNames = service.getEventNames();

      expect(eventNames).toContain(eventName);
    });
  });

  describe('getEventListeners', () => {
    it('should return empty array for non-existent event', () => {
      const listeners = service.getEventListeners('non-existent');

      expect(listeners).toEqual([]);
    });

    it('should return listeners for existing event', async () => {
      const eventName = 'user.created';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await service.on(eventName, handler1);
      await service.on(eventName, handler2);

      const listeners = service.getEventListeners(eventName);

      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', async () => {
      const eventName = 'user.created';
      const handler = jest.fn();

      await service.on(eventName, handler);
      await service.removeAllListeners(eventName);

      expect(messagingService.unsubscribe).toHaveBeenCalledWith(
        `event.${eventName}`,
        undefined
      );
    });

    it('should remove all listeners for all events', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await service.on('event1', handler1);
      await service.on('event2', handler2);
      await service.removeAllListeners();

      expect(messagingService.unsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitTenantEvent', () => {
    it('should emit event for specific tenant', async () => {
      const tenantId = 'tenant-456';
      const eventName = 'user.created';
      const data = { userId: 'user-123' };

      await service.emitTenantEvent(tenantId, eventName, data);

      expect(messagingService.publish).toHaveBeenCalledWith(
        `tenant.${tenantId}.event.${eventName}`,
        data
      );
      expect(mockLogger.info).toHaveBeenCalledWith('租户事件发布成功', {
        tenantId,
        eventName,
        hasData: true,
      });
    });

    it('should handle tenant event emit errors', async () => {
      messagingService.publish.mockRejectedValue(new Error('Publish failed'));

      const tenantId = 'tenant-456';
      const eventName = 'user.created';
      const data = { userId: 'user-123' };

      await expect(
        service.emitTenantEvent(tenantId, eventName, data)
      ).rejects.toThrow('Publish failed');
      expect(mockLogger.error).toHaveBeenCalledWith('租户事件发布失败', {
        tenantId,
        eventName,
        error: 'Publish failed',
      });
    });
  });

  describe('onTenantEvent', () => {
    it('should subscribe to tenant event', async () => {
      const tenantId = 'tenant-456';
      const eventName = 'user.created';
      const handler = jest.fn();

      await service.onTenantEvent(tenantId, eventName, handler);

      expect(messagingService.subscribe).toHaveBeenCalledWith(
        `tenant.${tenantId}.event.${eventName}`,
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('租户事件订阅成功', {
        tenantId,
        eventName,
      });
    });

    it('should handle tenant event processing errors', async () => {
      const tenantId = 'tenant-456';
      const eventName = 'user.created';
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));

      await service.onTenantEvent(tenantId, eventName, handler);

      // 模拟消息到达
      const subscribeCall = messagingService.subscribe.mock.calls[0];
      const messageHandler = subscribeCall[1];

      await messageHandler({ userId: 'user-123' });

      expect(handler).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(mockLogger.error).toHaveBeenCalledWith('租户事件处理失败', {
        tenantId,
        eventName,
        error: 'Handler failed',
      });
    });
  });

  describe('offTenantEvent', () => {
    it('should unsubscribe from tenant event', async () => {
      const tenantId = 'tenant-456';
      const eventName = 'user.created';
      const handler = jest.fn();

      await service.offTenantEvent(tenantId, eventName, handler);

      expect(messagingService.unsubscribe).toHaveBeenCalledWith(
        `tenant.${tenantId}.event.${eventName}`,
        handler
      );
      expect(mockLogger.info).toHaveBeenCalledWith('租户事件取消订阅成功', {
        tenantId,
        eventName,
      });
    });
  });
});
