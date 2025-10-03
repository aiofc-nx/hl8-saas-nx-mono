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
  // 使用 any 类型避免 jest 类型问题
  debug: (() => {}) as any,
  info: (() => {}) as any,
  warn: (() => {}) as any,
  error: (() => {}) as any,
  child: (() => {}) as any,
});

export const createMockCacheService = () => ({
  get: (() => {}) as any,
  set: (() => {}) as any,
  delete: (() => {}) as any,
  exists: (() => {}) as any,
  clear: (() => {}) as any,
});

export const createMockDatabaseService = () => ({
  query: (() => {}) as any,
  insert: (() => {}) as any,
  update: (() => {}) as any,
  delete: (() => {}) as any,
  find: (() => {}) as any,
  findOne: (() => {}) as any,
  count: (() => {}) as any,
  transaction: (() => {}) as any,
});

export const createMockEventService = () => ({
  publish: (() => {}) as any,
  publishAll: (() => {}) as any,
  subscribe: (() => {}) as any,
  unsubscribe: (() => {}) as any,
});

export const createMockTenantContextService = () => ({
  getContext: (() => {}) as any,
  setContext: (() => {}) as any,
  clearContext: (() => {}) as any,
});
