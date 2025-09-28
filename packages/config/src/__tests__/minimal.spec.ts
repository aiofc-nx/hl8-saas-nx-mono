/**
 * 最小测试
 *
 * @description 测试配置模块的最小功能
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

describe('配置模块最小测试', () => {
  it('应该能够导入模块', () => {
    expect(() => {
      require('../lib/typed-config.module');
    }).not.toThrow();
  });

  it('应该能够导入加载器', () => {
    expect(() => {
      require('../lib/loader');
    }).not.toThrow();
  });

  it('应该能够导入缓存', () => {
    expect(() => {
      require('../lib/cache');
    }).not.toThrow();
  });

  it('应该能够导入错误处理', () => {
    expect(() => {
      require('../lib/errors');
    }).not.toThrow();
  });
});
