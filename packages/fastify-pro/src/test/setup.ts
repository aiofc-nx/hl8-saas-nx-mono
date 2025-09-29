/**
 * Jest测试设置文件
 *
 * @description 全局测试设置和模拟
 *
 * @since 1.0.0
 */

// 设置测试超时
jest.setTimeout(10000);

// 模拟console方法以避免测试输出干扰
const originalConsole = { ...console };

beforeAll(() => {
  // 在测试期间静默console输出
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
});

afterAll(() => {
  // 恢复原始console方法
  Object.assign(console, originalConsole);
});

// 模拟process.env
process.env['NODE_ENV'] = 'test';

// 模拟Fastify相关模块
jest.mock('fastify', () => {
  return jest.fn(() => ({
    register: jest.fn().mockResolvedValue(undefined),
    addHook: jest.fn().mockResolvedValue(undefined),
    listen: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    server: {
      listening: true,
      address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
    },
  }));
});

// 模拟@fastify/cors
jest.mock('@fastify/cors', () => ({
  default: jest.fn().mockResolvedValue(undefined),
}));

// 模拟@nestjs/common
jest.mock('@nestjs/common', () => ({
  Module: jest.fn(),
  DynamicModule: jest.fn(),
  Provider: jest.fn(),
  Injectable: jest.fn(),
  Test: {
    createTestingModule: jest.fn().mockReturnValue({
      compile: jest.fn().mockResolvedValue({
        get: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

// 模拟@nestjs/platform-fastify
jest.mock('@nestjs/platform-fastify', () => ({
  FastifyAdapter: jest.fn().mockImplementation(() => ({
    listen: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// 模拟os模块
jest.mock('os', () => ({
  totalmem: jest.fn().mockReturnValue(8589934592), // 8GB
  freemem: jest.fn().mockReturnValue(4294967296), // 4GB
  cpus: jest.fn().mockReturnValue([
    { model: 'Intel Core i7', speed: 3000 },
    { model: 'Intel Core i7', speed: 3000 },
  ]),
}));

// 模拟process模块
Object.defineProperty(process, 'memoryUsage', {
  value: jest.fn().mockReturnValue({
    rss: 50331648, // 48MB
    heapTotal: 20971520, // 20MB
    heapUsed: 15728640, // 15MB
    external: 1048576, // 1MB
  }),
});

Object.defineProperty(process, 'uptime', {
  value: jest.fn().mockReturnValue(3600), // 1小时
});

// 全局测试工具函数
(global as any).createMockFastify = () => ({
  register: jest.fn().mockResolvedValue(undefined),
  addHook: jest.fn().mockResolvedValue(undefined),
  listen: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  server: {
    listening: true,
    address: () => ({ port: 3000, family: 'IPv4', address: '0.0.0.0' }),
  },
});

(global as any).createMockRequest = (overrides = {}) => ({
  headers: {},
  query: {},
  url: '/test',
  method: 'GET',
  ...overrides,
});

(global as any).createMockReply = (overrides = {}) => ({
  header: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  ...overrides,
});

(global as any).createMockDone = () => jest.fn();
