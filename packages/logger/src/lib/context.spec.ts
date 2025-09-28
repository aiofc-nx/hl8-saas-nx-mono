/**
 * Context 单元测试
 *
 * @description 测试请求上下文管理功能
 * 包括上下文存储、获取、更新等功能
 */

import { RequestContext, RequestMetadata } from './types';
import {
  getCurrentRequestContext,
  clearCurrentRequestContext,
  updateCurrentRequestMetadata,
  getCurrentRequestMetadata,
  setCurrentRequestMetadata,
  clearCurrentRequestMetadata,
  withRequestContext
} from './context';

describe('Request Context Management', () => {
  beforeEach(() => {
    // 清理所有上下文
    clearCurrentRequestContext();
    clearCurrentRequestMetadata();
  });

  afterEach(() => {
    // 清理所有上下文
    clearCurrentRequestContext();
    clearCurrentRequestMetadata();
  });

  describe('基本上下文操作', () => {
    it('应该设置和获取请求上下文', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456',
        metadata: { service: 'test' }
      };

      await withRequestContext(context, async () => {
        const retrievedContext = getCurrentRequestContext();
        expect(retrievedContext).toEqual(context);
      });
    });

    it('应该清除请求上下文', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      await withRequestContext(context, async () => {
        expect(getCurrentRequestContext()).toEqual(context);
        // 在上下文中清除上下文
        clearCurrentRequestContext();
        // 清除后应该返回空上下文而不是 null
        const clearedContext = getCurrentRequestContext();
        expect(clearedContext).toEqual({
          requestId: '',
          userId: '',
          traceId: '',
          metadata: {}
        });
      });
    });

    it('应该在没有上下文时返回 null', () => {
      expect(getCurrentRequestContext()).toBeNull();
    });
  });

  describe('元数据操作', () => {
    it('应该设置和获取请求元数据', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };
      const metadata: RequestMetadata = {
        operation: 'user-login',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };

      await withRequestContext(context, async () => {
        setCurrentRequestMetadata(metadata);
        const retrievedMetadata = getCurrentRequestMetadata();
        expect(retrievedMetadata).toEqual(metadata);
      });
    });

    it('应该更新请求元数据', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };
      const initialMetadata: RequestMetadata = {
        operation: 'user-login',
        ip: '192.168.1.1'
      };

      await withRequestContext(context, async () => {
        setCurrentRequestMetadata(initialMetadata);

        const additionalMetadata: RequestMetadata = {
          userAgent: 'Mozilla/5.0...',
          sessionId: 'session-123'
        };

        updateCurrentRequestMetadata(additionalMetadata);
        const finalMetadata = getCurrentRequestMetadata();

        expect(finalMetadata).toEqual({
          ...initialMetadata,
          ...additionalMetadata
        });
      });
    });

    it('应该清除请求元数据', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };
      const metadata: RequestMetadata = {
        operation: 'user-login',
        ip: '192.168.1.1'
      };

      await withRequestContext(context, async () => {
        setCurrentRequestMetadata(metadata);
        expect(getCurrentRequestMetadata()).toEqual(metadata);

        clearCurrentRequestMetadata();
        // 清除后应该返回空对象而不是 null
        expect(getCurrentRequestMetadata()).toEqual({});
      });
    });

    it('应该在没有元数据时返回 null', () => {
      expect(getCurrentRequestMetadata()).toBeNull();
    });
  });

  describe('上下文包装器', () => {
    it('应该使用 withRequestContext 包装函数', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      const result = await withRequestContext(context, async () => {
        const currentContext = getCurrentRequestContext();
        expect(currentContext).toEqual(context);
        return 'success';
      });

      expect(result).toBe('success');
      expect(getCurrentRequestContext()).toBeNull();
    });

    it('应该处理 withRequestContext 中的错误', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      await expect(
        withRequestContext(context, async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');

      expect(getCurrentRequestContext()).toBeNull();
    });

    it('应该支持嵌套上下文', async () => {
      const outerContext: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      const innerContext: RequestContext = {
        requestId: 'req-456',
        userId: 'user-789'
      };

      await withRequestContext(outerContext, async () => {
        expect(getCurrentRequestContext()).toEqual(outerContext);

        await withRequestContext(innerContext, async () => {
          expect(getCurrentRequestContext()).toEqual(innerContext);
        });

        expect(getCurrentRequestContext()).toEqual(outerContext);
      });

      expect(getCurrentRequestContext()).toBeNull();
    });
  });

  describe('上下文合并', () => {
    it('应该合并上下文和元数据', async () => {
      const context: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456',
        metadata: { service: 'test' }
      };

      const metadata: RequestMetadata = {
        operation: 'user-login',
        ip: '192.168.1.1'
      };

      await withRequestContext(context, async () => {
        setCurrentRequestMetadata(metadata);

        const currentContext = getCurrentRequestContext();
        const currentMetadata = getCurrentRequestMetadata();

        expect(currentContext).toEqual(context);
        expect(currentMetadata).toEqual(metadata);
      });
    });
  });

  describe('异步上下文隔离', () => {
    it('应该在不同异步操作间隔离上下文', async () => {
      const context1: RequestContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };

      const context2: RequestContext = {
        requestId: 'req-456',
        userId: 'user-789'
      };

      const promises = [
        withRequestContext(context1, async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return getCurrentRequestContext();
        }),
        withRequestContext(context2, async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return getCurrentRequestContext();
        })
      ];

      const results = await Promise.all(promises);
      expect(results[0]).toEqual(context1);
      expect(results[1]).toEqual(context2);
    });
  });
});
