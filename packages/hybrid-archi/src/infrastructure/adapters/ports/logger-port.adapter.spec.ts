/**
 * 日志端口适配器单元测试
 *
 * @description 测试日志端口适配器的基本功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from '@hl8/logger';
import { LoggerPortAdapter } from './logger-port.adapter';

describe('LoggerPortAdapter', () => {
  let adapter: LoggerPortAdapter;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockLoggerInstance = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerPortAdapter,
        {
          provide: PinoLogger,
          useValue: mockLoggerInstance,
        },
      ],
    }).compile();

    adapter = module.get<LoggerPortAdapter>(LoggerPortAdapter);
    mockLogger = module.get<PinoLogger>(PinoLogger) as jest.Mocked<PinoLogger>;
  });

  describe('debug', () => {
    it('应该调用底层logger的debug方法', () => {
      const message = 'Debug message';
      const context = { userId: '123' };

      adapter.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, context);
    });

    it('应该在没有context时正常工作', () => {
      const message = 'Debug message';

      adapter.debug(message);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('info', () => {
    it('应该调用底层logger的info方法', () => {
      const message = 'Info message';
      const context = { userId: '123' };

      adapter.info(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, context);
    });

    it('应该在没有context时正常工作', () => {
      const message = 'Info message';

      adapter.info(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('warn', () => {
    it('应该调用底层logger的warn方法', () => {
      const message = 'Warning message';
      const context = { userId: '123' };

      adapter.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, context);
    });

    it('应该在没有context时正常工作', () => {
      const message = 'Warning message';

      adapter.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('error', () => {
    it('应该调用底层logger的error方法', () => {
      const message = 'Error message';
      const error = new Error('Test error');
      const context = { userId: '123' };

      adapter.error(message, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, error, context);
    });

    it('应该在没有error时正常工作', () => {
      const message = 'Error message';
      const context = { userId: '123' };

      adapter.error(message, undefined, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        message,
        undefined,
        context
      );
    });

    it('应该在没有context时正常工作', () => {
      const message = 'Error message';
      const error = new Error('Test error');

      adapter.error(message, error);

      expect(mockLogger.error).toHaveBeenCalledWith(message, error, undefined);
    });
  });

  describe('child', () => {
    it('应该创建子logger并返回新的适配器实例', () => {
      const context = 'child-context';
      const metadata = { userId: '123' };
      const mockChildLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn(),
      };

      mockLogger.child.mockReturnValue(mockChildLogger as any);

      const childAdapter = adapter.child(context, metadata);

      expect(mockLogger.child).toHaveBeenCalledWith(metadata);
      expect(childAdapter).toBeInstanceOf(LoggerPortAdapter);
    });
  });
});
