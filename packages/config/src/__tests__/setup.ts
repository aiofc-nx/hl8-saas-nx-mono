/**
 * 测试设置文件
 *
 * @description 测试环境的全局设置
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

// 设置测试超时时间
jest.setTimeout(10000);

// 模拟 console 方法以避免测试输出干扰
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 清理测试环境
beforeEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();

  // 重置环境变量
  process.env = { ...process.env };
});

afterEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
});

// 全局测试工具
(global as any).testUtils = {
  // 等待指定时间
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // 创建临时目录
  createTempDir: (prefix: string = 'test') => {
    const os = require('os');
    const path = require('path');
    return path.join(
      os.tmpdir(),
      `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  },

  // 清理临时文件
  cleanupTempFiles: async (paths: string[]) => {
    const fs = require('fs').promises;
    const path = require('path');

    for (const filePath of paths) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
        } else {
          await fs.unlink(filePath);
        }
      } catch (error) {
        // 忽略文件不存在错误
      }
    }
  },
};

// 导出测试工具
export {};
