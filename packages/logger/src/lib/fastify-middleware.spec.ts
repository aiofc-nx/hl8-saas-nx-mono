/**
 * PinoLoggerMiddleware 单元测试
 *
 * @description 测试 PinoLoggerMiddleware 类的功能
 * 包括请求/响应日志记录、上下文绑定、错误处理等功能
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PinoLoggerMiddleware, PinoLoggerMiddlewareOptions } from './fastify-middleware';
import { PinoLogger } from './pino-logger';

// Mock Fastify 相关模块
jest.mock('fastify', () => ({
  FastifyRequest: jest.fn(),
  FastifyReply: jest.fn(),
  FastifyInstance: jest.fn(),
}));

describe('PinoLoggerMiddleware', () => {
  let middleware: PinoLoggerMiddleware;
  let mockRequest: jest.Mocked<FastifyRequest>;
  let mockReply: jest.Mocked<FastifyReply>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // 创建模拟对象
    mockRequest = {
      method: 'GET',
      url: '/api/users',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-request-id': 'req-123',
      },
      ip: '192.168.1.1',
      hostname: 'localhost',
      protocol: 'http',
      query: { page: '1' },
      params: { id: '123' },
      body: { name: 'John' },
      log: jest.fn(),
    } as any;

    mockReply = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      log: jest.fn(),
      send: jest.fn(),
    } as any;


    // 模拟 console 输出
    consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用默认选项创建中间件', () => {
      middleware = new PinoLoggerMiddleware();
      expect(middleware).toBeDefined();
      expect(middleware['options']).toEqual({
        enableRequestLogging: true,
        enableResponseLogging: true,
        excludePaths: [],
        logLevel: 'info',
      });
    });

    it('应该使用自定义选项创建中间件', () => {
      const options: PinoLoggerMiddlewareOptions = {
        enableRequestLogging: false,
        enableResponseLogging: true,
        excludePaths: ['/health'],
        logLevel: 'debug',
      };

      middleware = new PinoLoggerMiddleware(options);
      expect(middleware['options']).toEqual(expect.objectContaining(options));
    });
  });

  describe('请求日志记录', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware({
        enableRequestLogging: true,
        enableResponseLogging: false,
      });
    });

    it('应该生成请求ID', () => {
      const requestId = middleware['generateRequestId'](mockRequest);
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('应该使用自定义请求ID生成器', () => {
      const customGenerator = jest.fn().mockReturnValue('custom-id');
      middleware = new PinoLoggerMiddleware({
        requestIdGenerator: customGenerator,
      });

      const requestId = middleware['generateRequestId'](mockRequest);
      expect(customGenerator).toHaveBeenCalledWith(mockRequest);
      expect(requestId).toBe('custom-id');
    });

    it('应该从请求头获取请求ID', () => {
      const requestId = middleware['generateRequestId'](mockRequest);
      expect(requestId).toBe('req-123');
    });

    it('应该创建请求上下文', () => {
      const context = middleware['createRequestContext'](mockRequest);
      expect(context).toEqual({
        requestId: 'req-123',
        userId: undefined,
        traceId: undefined,
        sessionId: undefined,
        metadata: {
          method: 'GET',
          url: '/api/users',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('响应日志记录', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware({
        enableRequestLogging: true,
        enableResponseLogging: true,
      });
    });

    it('应该处理请求开始', () => {
      const context = middleware['createRequestContext'](mockRequest);
      const logRequestStartSpy = jest.spyOn(middleware['logger'], 'logRequestStart');

      middleware['handleRequestStart'](mockRequest, mockReply, context);

      expect(logRequestStartSpy).toHaveBeenCalledWith(mockRequest, context);
    });

    it('应该处理请求完成', () => {
      const context = middleware['createRequestContext'](mockRequest);
      const logRequestCompleteSpy = jest.spyOn(middleware['logger'], 'logRequestComplete');
      (mockRequest as any).startTime = Date.now() - 100;

      middleware['handleRequestComplete'](mockRequest, mockReply, context);

      expect(logRequestCompleteSpy).toHaveBeenCalledWith(mockRequest, mockReply, context, expect.any(Number));
    });
  });

  describe('路径排除', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware({
        excludePaths: ['/health', '/metrics'],
      });
    });

    it('应该排除指定的路径', () => {
      expect(middleware['shouldExcludePath']('/health')).toBe(true);
      expect(middleware['shouldExcludePath']('/metrics')).toBe(true);
      expect(middleware['shouldExcludePath']('/api/users')).toBe(false);
    });

    it('应该支持通配符路径排除', () => {
      middleware = new PinoLoggerMiddleware({
        excludePaths: ['/api/health*', '/static/*'],
      });

      expect(middleware['shouldExcludePath']('/api/health')).toBe(true);
      expect(middleware['shouldExcludePath']('/api/health/check')).toBe(true);
      expect(middleware['shouldExcludePath']('/static/css/style.css')).toBe(true);
      expect(middleware['shouldExcludePath']('/api/users')).toBe(false);
    });
  });

  describe('上下文绑定', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware();
    });

    it('应该创建包含用户信息的请求上下文', () => {
      const requestWithUser = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-user-id': 'user-123',
          'x-trace-id': 'trace-456',
        },
      };

      const context = middleware['createRequestContext'](requestWithUser);

      expect(context).toEqual({
        requestId: 'req-123',
        userId: 'user-123',
        traceId: 'trace-456',
        sessionId: undefined,
        metadata: {
          method: 'GET',
          url: '/api/users',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('中间件集成', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware();
    });

    it('应该创建插件函数', () => {
      const plugin = middleware.plugin;
      expect(typeof plugin).toBe('function');
    });
  });

  describe('日志级别控制', () => {
    it('应该使用指定的日志级别', () => {
      middleware = new PinoLoggerMiddleware({
        logLevel: 'debug',
      });

      expect(middleware['logger']).toBeInstanceOf(PinoLogger);
    });

    it('应该使用默认日志级别', () => {
      middleware = new PinoLoggerMiddleware();

      expect(middleware['logger']).toBeInstanceOf(PinoLogger);
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      middleware = new PinoLoggerMiddleware();
    });

    it('应该处理请求错误', () => {
      const error = new Error('Request processing failed');
      const context = middleware['createRequestContext'](mockRequest);
      const logRequestErrorSpy = jest.spyOn(middleware['logger'], 'logRequestError');

      middleware['handleRequestError'](mockRequest, mockReply, error, context);

      expect(logRequestErrorSpy).toHaveBeenCalledWith(mockRequest, error, context);
    });
  });
});
