import { MemoryAdapter } from './memory.adapter';
import { MessagingAdapterType } from '../types/messaging.types';

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear data', async () => {
      await adapter.connect();
      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('publish', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should publish message to topic', async () => {
      const topic = 'user.created';
      const message = { userId: 'user-123' };
      const handler = jest.fn();

      await adapter.subscribe(topic, handler);
      await adapter.publish(topic, message);

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      const topic = 'user.created';
      const message = { userId: 'user-123' };

      await expect(adapter.publish(topic, message)).rejects.toThrow(
        'Adapter memory is not connected'
      );
    });

    it('should handle multiple subscribers', async () => {
      const topic = 'user.created';
      const message = { userId: 'user-123' };
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await adapter.subscribe(topic, handler1);
      await adapter.subscribe(topic, handler2);
      await adapter.publish(topic, message);

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });
  });

  describe('subscribe', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should subscribe to topic', async () => {
      const topic = 'user.created';
      const handler = jest.fn();

      await adapter.subscribe(topic, handler);

      // 验证订阅成功
      await adapter.publish(topic, { userId: 'user-123' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      const topic = 'user.created';
      const handler = jest.fn();

      await expect(adapter.subscribe(topic, handler)).rejects.toThrow(
        'Adapter memory is not connected'
      );
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should unsubscribe from topic', async () => {
      const topic = 'user.created';
      const handler = jest.fn();

      await adapter.subscribe(topic, handler);
      await adapter.unsubscribe(topic, handler);

      await adapter.publish(topic, { userId: 'user-123' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe all handlers from topic', async () => {
      const topic = 'user.created';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await adapter.subscribe(topic, handler1);
      await adapter.subscribe(topic, handler2);
      await adapter.unsubscribe(topic);

      await adapter.publish(topic, { userId: 'user-123' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('sendToQueue', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should send message to queue', async () => {
      const queue = 'email.queue';
      const message = { to: 'user@example.com' };
      const handler = jest.fn();

      await adapter.consume(queue, handler);
      await adapter.sendToQueue(queue, message);

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle delayed messages', async () => {
      const queue = 'email.queue';
      const message = { to: 'user@example.com' };
      const handler = jest.fn();

      await adapter.consume(queue, handler);
      await adapter.sendToQueue(queue, message, { delay: 100 });

      // 立即检查，应该还没有处理
      expect(handler).not.toHaveBeenCalled();

      // 等待延迟时间
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      const queue = 'email.queue';
      const message = { to: 'user@example.com' };

      await expect(adapter.sendToQueue(queue, message)).rejects.toThrow(
        'Adapter memory is not connected'
      );
    });
  });

  describe('consume', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should consume from queue', async () => {
      const queue = 'email.queue';
      const message = { to: 'user@example.com' };
      const handler = jest.fn();

      await adapter.consume(queue, handler);
      await adapter.sendToQueue(queue, message);

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle multiple consumers', async () => {
      const queue = 'email.queue';
      const message = { to: 'user@example.com' };
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await adapter.consume(queue, handler1);
      await adapter.consume(queue, handler2);
      await adapter.sendToQueue(queue, message);

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });
  });

  describe('createQueue', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should create queue', async () => {
      const queue = 'test.queue';

      await adapter.createQueue(queue);

      // 验证队列创建成功
      const queueInfo = await adapter.getQueueInfo(queue);
      expect(queueInfo.name).toBe(queue);
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      const queue = 'test.queue';

      await expect(adapter.createQueue(queue)).rejects.toThrow(
        'Adapter memory is not connected'
      );
    });
  });

  describe('deleteQueue', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should delete queue', async () => {
      const queue = 'test.queue';

      await adapter.createQueue(queue);
      await adapter.deleteQueue(queue);

      // 验证队列删除成功
      await adapter.sendToQueue(queue, { test: 'data' });
      await new Promise(resolve => setTimeout(resolve, 10));

      // 队列应该为空
      const queueInfo = await adapter.getQueueInfo(queue);
      expect(queueInfo.messageCount).toBe(0);
    });
  });

  describe('purgeQueue', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should purge queue', async () => {
      const queue = 'test.queue';
      const message = { test: 'data' };

      await adapter.createQueue(queue);
      await adapter.sendToQueue(queue, message);
      await adapter.purgeQueue(queue);

      const queueInfo = await adapter.getQueueInfo(queue);
      expect(queueInfo.messageCount).toBe(0);
    });
  });

  describe('getQueueInfo', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should return queue info', async () => {
      const queue = 'test.queue';

      await adapter.createQueue(queue);

      const queueInfo = await adapter.getQueueInfo(queue);

      expect(queueInfo).toEqual({
        name: queue,
        messageCount: 0,
        consumerCount: 0,
        durable: true,
        exclusive: false,
        autoDelete: false,
      });
    });

    it('should update message count', async () => {
      const queue = 'test.queue';
      const message = { test: 'data' };

      await adapter.createQueue(queue);
      await adapter.sendToQueue(queue, message);

      const queueInfo = await adapter.getQueueInfo(queue);
      expect(queueInfo.messageCount).toBeGreaterThan(0);
    });

    it('should update consumer count', async () => {
      const queue = 'test.queue';
      const handler = jest.fn();

      await adapter.createQueue(queue);
      await adapter.consume(queue, handler);

      const queueInfo = await adapter.getQueueInfo(queue);
      expect(queueInfo.consumerCount).toBe(1);
    });
  });

  describe('adapter info', () => {
    it('should return correct adapter type', () => {
      expect(adapter.getAdapterType()).toBe(MessagingAdapterType.MEMORY);
    });

    it('should return adapter info', () => {
      const info = adapter.getAdapterInfo();

      expect(info).toEqual({
        type: MessagingAdapterType.MEMORY,
        name: 'Memory',
        version: '1.0.0',
        description: '基于内存的消息队列适配器，适用于开发和测试环境',
        config: expect.any(Object),
        status: 'unhealthy',
      });
    });

    it('should return healthy status when connected', async () => {
      await adapter.connect();

      const info = adapter.getAdapterInfo();
      expect(info.status).toBe('healthy');
    });
  });

  describe('connection info', () => {
    it('should return connection info when disconnected', () => {
      const info = adapter.getConnectionInfo();

      expect(info).toEqual({
        connected: false,
      });
    });

    it('should return connection info when connected', async () => {
      await adapter.connect();

      const info = adapter.getConnectionInfo();

      expect(info).toEqual({
        connected: true,
        connectedAt: expect.any(Date),
      });
    });
  });
});
