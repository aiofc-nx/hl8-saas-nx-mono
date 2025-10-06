/**
 * 基础设施层测试设置
 *
 * @description 测试环境设置和全局配置
 * @since 1.0.0
 */

import { PinoLogger } from '@hl8/logger';

// 设置测试环境变量
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';

// 全局测试超时设置
// jest.setTimeout(30000); // 注释掉，因为 jest 类型未定义

// 全局测试钩子
// beforeAll(async () => { // 注释掉，因为 jest 类型未定义
// 测试开始前的全局设置
console.log('🚀 开始基础设施层测试');
// });

// afterAll(async () => { // 注释掉，因为 jest 类型未定义
// 测试结束后的清理
console.log('✅ 基础设施层测试完成');
// });

// beforeEach(() => { // 注释掉，因为 jest 类型未定义
// 每个测试前的设置
// jest.clearAllMocks();
// });

// afterEach(() => { // 注释掉，因为 jest 类型未定义
// 每个测试后的清理
// jest.restoreAllMocks();
// });

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

// 导出测试工具函数
export const createMockLogger = (): any => ({
  debug: (() => undefined),
  info: (() => undefined),
  warn: (() => undefined),
  error: (() => undefined),
  child: (() => createMockLogger()),
});

export const createMockCacheService = () => ({
  get: (key: string) => Promise.resolve(undefined),
  set: (key: string, value: unknown, ttl?: number) => Promise.resolve(undefined),
  delete: (key: string) => Promise.resolve(undefined),
  exists: (key: string) => Promise.resolve(false),
  clear: () => Promise.resolve(undefined),
});

export const createMockDatabaseService = () => ({
  query: (sql: string, params?: unknown[]) => Promise.resolve([]),
  insert: (table: string, data: Record<string, unknown>) => Promise.resolve({ insertId: 1 }),
  update: (table: string, data: Record<string, unknown>, where: Record<string, unknown>) => Promise.resolve({ affectedRows: 1 }),
  delete: (table: string, where: Record<string, unknown>) => Promise.resolve({ affectedRows: 1 }),
  find: (table: string, where?: Record<string, unknown>) => Promise.resolve([]),
  findOne: (table: string, where: Record<string, unknown>) => Promise.resolve(null),
  count: (table: string, where?: Record<string, unknown>) => Promise.resolve(0),
  transaction: (callback: (trx: unknown) => Promise<unknown>) => Promise.resolve(undefined),
});

export const createMockEventService = () => ({
  publish: (event: unknown) => Promise.resolve(undefined),
  publishAll: (events: unknown[]) => Promise.resolve(undefined),
  subscribe: (eventType: string, handler: (event: unknown) => Promise<void>) => Promise.resolve(undefined),
  unsubscribe: (eventType: string, handler: (event: unknown) => Promise<void>) => Promise.resolve(undefined),
});

export const createMockTenantContextService = () => ({
  getContext: () => ({ tenantId: 'test-tenant', userId: 'test-user' }),
  setContext: (context: { tenantId: string; userId: string }) => undefined,
  clearContext: () => undefined,
});
