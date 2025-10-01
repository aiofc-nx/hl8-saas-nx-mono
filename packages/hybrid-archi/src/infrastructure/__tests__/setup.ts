/**
 * 基础设施层测试设置
 *
 * @description 测试环境设置和全局配置
 * @since 1.0.0
 */

import { Logger } from '@hl8/logger';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// 全局测试超时设置
jest.setTimeout(30000);

// 全局测试钩子
beforeAll(async () => {
  // 测试开始前的全局设置
  console.log('🚀 开始基础设施层测试');
});

afterAll(async () => {
  // 测试结束后的清理
  console.log('✅ 基础设施层测试完成');
});

beforeEach(() => {
  // 每个测试前的设置
  jest.clearAllMocks();
});

afterEach(() => {
  // 每个测试后的清理
  jest.restoreAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

// 导出测试工具函数
export const createMockLogger = (): jest.Mocked<Logger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn(),
});

export const createMockCacheService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  clear: jest.fn(),
});

export const createMockDatabaseService = () => ({
  query: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  transaction: jest.fn(),
});

export const createMockEventService = () => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
});

export const createMockTenantContextService = () => ({
  getContext: jest.fn(),
  setContext: jest.fn(),
  clearContext: jest.fn(),
});
