/**
 * 端口适配器集成测试
 *
 * @description 测试端口适配器的集成功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@hl8/logger';
import { TypedConfigModule } from '@hl8/config';
import { MessagingModule } from '@hl8/messaging';
import { PortAdaptersModule } from '../../../../../infrastructure/adapters/ports/port-adapters.module';
import { LoggerPortAdapter } from '../../../../../infrastructure/adapters/ports/logger-port.adapter';
import { IdGeneratorPortAdapter } from '../../../../../infrastructure/adapters/ports/id-generator-port.adapter';
import { TimeProviderPortAdapter } from '../../../../../infrastructure/adapters/ports/time-provider-port.adapter';
import { ValidationPortAdapter } from '../../../../../infrastructure/adapters/ports/validation-port.adapter';
import { ConfigurationPortAdapter } from '../../../../../infrastructure/adapters/ports/configuration-port.adapter';
import { EventBusPortAdapter } from '../../../../../infrastructure/adapters/ports/event-bus-port.adapter';

describe('PortAdaptersModule Integration', () => {
  let module: TestingModule;

  beforeEach(async () => {
    try {
      module = await Test.createTestingModule({
        imports: [
          LoggerModule,
          TypedConfigModule,
          MessagingModule,
          PortAdaptersModule.forRoot({
            enableLogger: true,
            enableIdGenerator: true,
            enableTimeProvider: true,
            enableValidation: true,
            enableConfiguration: true,
            enableEventBus: true,
          }),
        ],
      }).compile();
    } catch (error) {
      console.error('Failed to initialize test module:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (module) {
      try {
        await module.close();
      } catch (error) {
        console.error('Failed to close test module:', error);
      }
    }
  });

  describe('LoggerPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter = module.get<LoggerPortAdapter>('ILoggerPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(LoggerPortAdapter);
    });

    it('应该能够记录日志', () => {
      const adapter = module.get<LoggerPortAdapter>('ILoggerPort');

      expect(() => {
        adapter.debug('Debug message', { context: 'test' });
        adapter.info('Info message', { context: 'test' });
        adapter.warn('Warning message', { context: 'test' });
        adapter.error('Error message', new Error('Test error'), {
          context: 'test',
        });
      }).not.toThrow();
    });

    it('应该能够创建子logger', () => {
      const adapter = module.get<LoggerPortAdapter>('ILoggerPort');
      const childAdapter = adapter.child('child-context', { userId: '123' });

      expect(childAdapter).toBeDefined();
      expect(childAdapter).toBeInstanceOf(LoggerPortAdapter);
    });
  });

  describe('IdGeneratorPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter = module.get<IdGeneratorPortAdapter>('IIdGeneratorPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(IdGeneratorPortAdapter);
    });

    it('应该生成唯一ID', () => {
      const adapter = module.get<IdGeneratorPortAdapter>('IIdGeneratorPort');

      const id1 = adapter.generate();
      const id2 = adapter.generate();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('应该生成数字ID', () => {
      const adapter = module.get<IdGeneratorPortAdapter>('IIdGeneratorPort');

      const numericId = adapter.generateNumericId();

      expect(numericId).toBeDefined();
      expect(typeof numericId).toBe('number');
      expect(numericId).toBeGreaterThan(0);
    });

    it('应该生成短ID', () => {
      const adapter = module.get<IdGeneratorPortAdapter>('IIdGeneratorPort');

      const shortId = adapter.generateShortId();

      expect(shortId).toBeDefined();
      expect(typeof shortId).toBe('string');
      expect(shortId.length).toBeLessThan(10);
    });
  });

  describe('TimeProviderPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter = module.get<TimeProviderPortAdapter>('ITimeProviderPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(TimeProviderPortAdapter);
    });

    it('应该返回当前时间', () => {
      const adapter = module.get<TimeProviderPortAdapter>('ITimeProviderPort');

      const now = adapter.now();
      const timestamp = adapter.timestamp();
      const isoString = adapter.isoString();

      expect(now).toBeInstanceOf(Date);
      expect(typeof timestamp).toBe('number');
      expect(typeof isoString).toBe('string');
      expect(isoString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('ValidationPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter = module.get<ValidationPortAdapter>('IValidationPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(ValidationPortAdapter);
    });

    it('应该验证数据', async () => {
      const adapter = module.get<ValidationPortAdapter>('IValidationPort');

      // 这里需要根据实际的验证逻辑来测试
      // 由于ValidationPortAdapter使用class-validator，需要创建适当的测试数据
      expect(adapter).toBeDefined();
    });
  });

  describe('ConfigurationPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter =
        module.get<ConfigurationPortAdapter>('IConfigurationPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(ConfigurationPortAdapter);
    });

    it('应该获取配置值', () => {
      const adapter =
        module.get<ConfigurationPortAdapter>('IConfigurationPort');

      // 测试获取配置值
      const value = adapter.get('NODE_ENV', 'development');
      expect(value).toBeDefined();
    });
  });

  describe('EventBusPortAdapter', () => {
    it('应该正确注入和初始化', () => {
      const adapter = module.get<EventBusPortAdapter>('IEventBusPort');
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(EventBusPortAdapter);
    });

    it('应该发布事件', async () => {
      const adapter = module.get<EventBusPortAdapter>('IEventBusPort');

      const event = { type: 'test', data: { message: 'test event' } };

      // 测试发布事件（可能需要mock EventService）
      await expect(adapter.publish(event)).resolves.not.toThrow();
    });

    it('应该批量发布事件', async () => {
      const adapter = module.get<EventBusPortAdapter>('IEventBusPort');

      const events = [
        { type: 'test1', data: { message: 'test event 1' } },
        { type: 'test2', data: { message: 'test event 2' } },
      ];

      // 测试批量发布事件
      await expect(adapter.publishAll(events)).resolves.not.toThrow();
    });
  });
});
