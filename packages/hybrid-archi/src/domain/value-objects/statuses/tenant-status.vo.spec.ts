/**
 * TenantStatus枚举和工具类单元测试
 *
 * @description 测试TenantStatus枚举和TenantStatusUtils工具类的功能
 * @since 1.0.0
 */

import { TenantStatus, TenantStatusUtils } from './tenant-status.vo';

describe('TenantStatus枚举', () => {
  describe('枚举值', () => {
    it('应该定义所有租户状态类型', () => {
      // Assert
      expect(TenantStatus.CREATING).toBe('CREATING');
      expect(TenantStatus.PENDING).toBe('PENDING');
      expect(TenantStatus.ACTIVE).toBe('ACTIVE');
      expect(TenantStatus.SUSPENDED).toBe('SUSPENDED');
      expect(TenantStatus.DISABLED).toBe('DISABLED');
      expect(TenantStatus.DELETED).toBe('DELETED');
    });

    it('应该包含6种状态类型', () => {
      // Act
      const statuses = Object.values(TenantStatus);

      // Assert
      expect(statuses).toHaveLength(6);
    });
  });
});

describe('TenantStatusUtils工具类', () => {
  describe('canTransitionTo', () => {
    it('应该允许从CREATING转换到PENDING', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.CREATING,
        TenantStatus.PENDING
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从CREATING转换到DISABLED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.CREATING,
        TenantStatus.DISABLED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从PENDING转换到ACTIVE', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.PENDING,
        TenantStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从PENDING转换到DISABLED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.PENDING,
        TenantStatus.DISABLED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从ACTIVE转换到SUSPENDED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.ACTIVE,
        TenantStatus.SUSPENDED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从ACTIVE转换到DISABLED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.ACTIVE,
        TenantStatus.DISABLED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从SUSPENDED转换到ACTIVE', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.SUSPENDED,
        TenantStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从SUSPENDED转换到DISABLED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.SUSPENDED,
        TenantStatus.DISABLED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从DISABLED转换到ACTIVE', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.DISABLED,
        TenantStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该不允许从DELETED转换到任何状态', () => {
      // Act & Assert
      expect(
        TenantStatusUtils.canTransitionTo(TenantStatus.DELETED, TenantStatus.ACTIVE)
      ).toBe(false);
      expect(
        TenantStatusUtils.canTransitionTo(TenantStatus.DELETED, TenantStatus.PENDING)
      ).toBe(false);
      expect(
        TenantStatusUtils.canTransitionTo(
          TenantStatus.DELETED,
          TenantStatus.DISABLED
        )
      ).toBe(false);
    });

    it('应该不允许从PENDING直接转换到SUSPENDED', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.PENDING,
        TenantStatus.SUSPENDED
      );

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许从CREATING直接转换到ACTIVE', () => {
      // Act
      const result = TenantStatusUtils.canTransitionTo(
        TenantStatus.CREATING,
        TenantStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getDescription', () => {
    it('应该返回CREATING的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.CREATING);

      // Assert
      expect(description).toBe('创建中');
    });

    it('应该返回PENDING的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.PENDING);

      // Assert
      expect(description).toBe('待激活');
    });

    it('应该返回ACTIVE的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.ACTIVE);

      // Assert
      expect(description).toBe('活跃');
    });

    it('应该返回SUSPENDED的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.SUSPENDED);

      // Assert
      expect(description).toBe('暂停');
    });

    it('应该返回DISABLED的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.DISABLED);

      // Assert
      expect(description).toBe('禁用');
    });

    it('应该返回DELETED的中文描述', () => {
      // Act
      const description = TenantStatusUtils.getDescription(TenantStatus.DELETED);

      // Assert
      expect(description).toBe('已删除');
    });
  });

  describe('isTerminal', () => {
    it('应该识别DELETED为终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.DELETED);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别CREATING不是终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.CREATING);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别PENDING不是终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.PENDING);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别ACTIVE不是终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.ACTIVE);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别SUSPENDED不是终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.SUSPENDED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别DISABLED不是终态', () => {
      // Act
      const result = TenantStatusUtils.isTerminal(TenantStatus.DISABLED);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('应该返回CREATING状态的所有可转换状态', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.CREATING
      );

      // Assert
      expect(transitions).toContain(TenantStatus.PENDING);
      expect(transitions).toContain(TenantStatus.DISABLED);
      expect(transitions).toHaveLength(2);
    });

    it('应该返回PENDING状态的所有可转换状态', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.PENDING
      );

      // Assert
      expect(transitions).toContain(TenantStatus.ACTIVE);
      expect(transitions).toContain(TenantStatus.DISABLED);
      expect(transitions).toHaveLength(2);
    });

    it('应该返回ACTIVE状态的所有可转换状态', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.ACTIVE
      );

      // Assert
      expect(transitions).toContain(TenantStatus.SUSPENDED);
      expect(transitions).toContain(TenantStatus.DISABLED);
      expect(transitions).toHaveLength(2);
    });

    it('应该返回SUSPENDED状态的所有可转换状态', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.SUSPENDED
      );

      // Assert
      expect(transitions).toContain(TenantStatus.ACTIVE);
      expect(transitions).toContain(TenantStatus.DISABLED);
      expect(transitions).toHaveLength(2);
    });

    it('应该返回DISABLED状态的所有可转换状态', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.DISABLED
      );

      // Assert
      expect(transitions).toContain(TenantStatus.ACTIVE);
      expect(transitions).toHaveLength(1);
    });

    it('应该返回DELETED状态的空转换列表', () => {
      // Act
      const transitions = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.DELETED
      );

      // Assert
      expect(transitions).toHaveLength(0);
    });

    it('应该返回转换列表的副本', () => {
      // Act
      const transitions1 = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.PENDING
      );
      const transitions2 = TenantStatusUtils.getAvailableTransitions(
        TenantStatus.PENDING
      );

      // Assert
      expect(transitions1).not.toBe(transitions2);
      expect(transitions1).toEqual(transitions2);
    });
  });
});

