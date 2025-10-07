import 'reflect-metadata';
import { EventHandler, getEventHandlers } from './event-handler.decorator';

interface TestClassType {
  handleUserCreated(event: unknown): void;
  handleUserUpdated(event: unknown): void;
  handleOrderPlaced(event: unknown): void;
  handleUserCreated1(event: unknown): void;
  handleUserCreated2(event: unknown): void;
  handleBaseEvent(event: unknown): void;
  handleExtendedEvent(event: unknown): void;
}

describe('EventHandler', () => {
  let TestClass: new () => TestClassType;

  beforeEach(() => {
    // 创建一个测试类
    class TestService {
      @EventHandler('user.created')
      handleUserCreated(event: unknown): void {
        console.log('User created:', event);
      }

      @EventHandler('user.updated')
      handleUserUpdated(event: unknown): void {
        console.log('User updated:', event);
      }

      @EventHandler('order.placed')
      handleOrderPlaced(event: unknown): void {
        console.log('Order placed:', event);
      }

      // 普通方法，没有装饰器
      normalMethod(): void {
        console.log('Normal method');
      }
    }

    TestClass = TestService as unknown as new () => TestClassType;
  });

  it('should register event handlers', () => {
    const handlers = getEventHandlers(TestClass);

    expect(handlers).toHaveLength(3);

    const eventNames = handlers.map((h) => h.eventName);
    expect(eventNames).toContain('user.created');
    expect(eventNames).toContain('user.updated');
    expect(eventNames).toContain('order.placed');
  });

  it('should register correct method names', () => {
    const handlers = getEventHandlers(TestClass);

    const methodNames = handlers.map((h) => h.methodName);
    expect(methodNames).toContain('handleUserCreated');
    expect(methodNames).toContain('handleUserUpdated');
    expect(methodNames).toContain('handleOrderPlaced');
  });

  it('should register correct handlers', () => {
    const handlers = getEventHandlers(TestClass);

    const userCreatedHandler = handlers.find(
      (h) => h.eventName === 'user.created'
    );
    expect(userCreatedHandler).toBeDefined();
    expect(userCreatedHandler?.methodName).toBe('handleUserCreated');
    expect(typeof userCreatedHandler?.handler).toBe('function');
  });

  it('should handle multiple handlers for same event', () => {
    class MultiHandlerService {
      @EventHandler('user.created')
      handleUserCreated1(event: unknown): void {
        console.log('Handler 1:', event);
      }

      @EventHandler('user.created')
      handleUserCreated2(event: unknown): void {
        console.log('Handler 2:', event);
      }
    }

    const handlers = getEventHandlers(MultiHandlerService);

    const userCreatedHandlers = handlers.filter(
      (h) => h.eventName === 'user.created'
    );
    expect(userCreatedHandlers).toHaveLength(2);
    expect(userCreatedHandlers[0].methodName).toBe('handleUserCreated1');
    expect(userCreatedHandlers[1].methodName).toBe('handleUserCreated2');
  });

  it('should return empty array for class without handlers', () => {
    class NoHandlersService {
      normalMethod(): void {
        console.log('Normal method');
      }
    }

    const handlers = getEventHandlers(NoHandlersService);

    expect(handlers).toEqual([]);
  });

  it('should preserve method descriptor', () => {
    const handlers = getEventHandlers(TestClass);
    const userCreatedHandler = handlers.find(
      (h) => h.eventName === 'user.created'
    );

    expect(userCreatedHandler?.handler).toBeDefined();
    expect(typeof userCreatedHandler?.handler).toBe('function');
  });

  it('should handle inheritance', () => {
    class BaseService {
      @EventHandler('base.event')
      handleBaseEvent(event: unknown): void {
        console.log('Base event:', event);
      }
    }

    class ExtendedService extends BaseService {
      @EventHandler('extended.event')
      handleExtendedEvent(event: unknown): void {
        console.log('Extended event:', event);
      }
    }

    const baseHandlers = getEventHandlers(BaseService);
    const extendedHandlers = getEventHandlers(ExtendedService);

    expect(baseHandlers).toHaveLength(1);
    expect(baseHandlers[0].eventName).toBe('base.event');

    expect(extendedHandlers).toHaveLength(1);
    expect(extendedHandlers[0].eventName).toBe('extended.event');
  });

  it('should handle static methods', () => {
    class StaticService {
      @EventHandler('static.event')
      static handleStaticEvent(event: unknown): void {
        console.log('Static event:', event);
      }

      @EventHandler('instance.event')
      handleInstanceEvent(event: unknown): void {
        console.log('Instance event:', event);
      }
    }

    const handlers = getEventHandlers(StaticService);

    expect(handlers).toHaveLength(2);

    const staticHandler = handlers.find((h) => h.eventName === 'static.event');
    const instanceHandler = handlers.find(
      (h) => h.eventName === 'instance.event'
    );

    expect(staticHandler).toBeDefined();
    expect(instanceHandler).toBeDefined();
    expect(staticHandler?.methodName).toBe('handleStaticEvent');
    expect(instanceHandler?.methodName).toBe('handleInstanceEvent');
  });
});
