/**
 * UserStatus枚举和工具类单元测试
 *
 * @description 测试UserStatus枚举和UserStatusUtils工具类的功能
 * @since 1.0.0
 */

import { UserStatus, UserStatusUtils } from './user-status.vo';

describe('UserStatus枚举', () => {
  describe('枚举值', () => {
    it('应该定义所有用户状态类型', () => {
      // Assert
      expect(UserStatus.PENDING).toBe('PENDING');
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED');
      expect(UserStatus.DISABLED).toBe('DISABLED');
      expect(UserStatus.LOCKED).toBe('LOCKED');
      expect(UserStatus.EXPIRED).toBe('EXPIRED');
      expect(UserStatus.DELETED).toBe('DELETED');
      expect(UserStatus.REJECTED).toBe('REJECTED');
    });

    it('应该包含8种状态类型', () => {
      // Act
      const statuses = Object.values(UserStatus);

      // Assert
      expect(statuses).toHaveLength(8);
    });
  });
});

describe('UserStatusUtils工具类', () => {
  describe('canTransitionTo', () => {
    it('应该允许从PENDING转换到ACTIVE', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.PENDING,
        UserStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从PENDING转换到DISABLED', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.PENDING,
        UserStatus.DISABLED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从ACTIVE转换到SUSPENDED', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从ACTIVE转换到LOCKED', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.ACTIVE,
        UserStatus.LOCKED
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从SUSPENDED转换到ACTIVE', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.SUSPENDED,
        UserStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从DISABLED转换到ACTIVE', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.DISABLED,
        UserStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从LOCKED转换到ACTIVE', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.LOCKED,
        UserStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从EXPIRED转换到ACTIVE', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.EXPIRED,
        UserStatus.ACTIVE
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该允许从REJECTED转换到PENDING', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.REJECTED,
        UserStatus.PENDING
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该不允许从DELETED转换到任何状态', () => {
      // Act & Assert
      expect(
        UserStatusUtils.canTransitionTo(UserStatus.DELETED, UserStatus.ACTIVE)
      ).toBe(false);
      expect(
        UserStatusUtils.canTransitionTo(UserStatus.DELETED, UserStatus.PENDING)
      ).toBe(false);
      expect(
        UserStatusUtils.canTransitionTo(
          UserStatus.DELETED,
          UserStatus.DISABLED
        )
      ).toBe(false);
    });

    it('应该不允许从PENDING直接转换到SUSPENDED', () => {
      // Act
      const result = UserStatusUtils.canTransitionTo(
        UserStatus.PENDING,
        UserStatus.SUSPENDED
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getDescription', () => {
    it('应该返回PENDING的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.PENDING);

      // Assert
      expect(description).toBe('待激活');
    });

    it('应该返回ACTIVE的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.ACTIVE);

      // Assert
      expect(description).toBe('活跃');
    });

    it('应该返回SUSPENDED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.SUSPENDED);

      // Assert
      expect(description).toBe('暂停');
    });

    it('应该返回DISABLED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.DISABLED);

      // Assert
      expect(description).toBe('禁用');
    });

    it('应该返回LOCKED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.LOCKED);

      // Assert
      expect(description).toBe('锁定');
    });

    it('应该返回EXPIRED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.EXPIRED);

      // Assert
      expect(description).toBe('过期');
    });

    it('应该返回DELETED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.DELETED);

      // Assert
      expect(description).toBe('已删除');
    });

    it('应该返回REJECTED的中文描述', () => {
      // Act
      const description = UserStatusUtils.getDescription(UserStatus.REJECTED);

      // Assert
      expect(description).toBe('已拒绝');
    });
  });

  describe('isTerminal', () => {
    it('应该识别DELETED为终态', () => {
      // Act
      const result = UserStatusUtils.isTerminal(UserStatus.DELETED);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别PENDING不是终态', () => {
      // Act
      const result = UserStatusUtils.isTerminal(UserStatus.PENDING);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别ACTIVE不是终态', () => {
      // Act
      const result = UserStatusUtils.isTerminal(UserStatus.ACTIVE);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别SUSPENDED不是终态', () => {
      // Act
      const result = UserStatusUtils.isTerminal(UserStatus.SUSPENDED);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('应该返回PENDING状态的所有可转换状态', () => {
      // Act
      const transitions = UserStatusUtils.getAvailableTransitions(
        UserStatus.PENDING
      );

      // Assert
      expect(transitions).toContain(UserStatus.ACTIVE);
      expect(transitions).toContain(UserStatus.DISABLED);
      expect(transitions).toHaveLength(2);
    });

    it('应该返回ACTIVE状态的所有可转换状态', () => {
      // Act
      const transitions = UserStatusUtils.getAvailableTransitions(
        UserStatus.ACTIVE
      );

      // Assert
      expect(transitions).toContain(UserStatus.SUSPENDED);
      expect(transitions).toContain(UserStatus.DISABLED);
      expect(transitions).toContain(UserStatus.LOCKED);
      expect(transitions).toContain(UserStatus.EXPIRED);
      expect(transitions).toHaveLength(4);
    });

    it('应该返回DELETED状态的空转换列表', () => {
      // Act
      const transitions = UserStatusUtils.getAvailableTransitions(
        UserStatus.DELETED
      );

      // Assert
      expect(transitions).toHaveLength(0);
    });

    it('应该返回转换列表的副本', () => {
      // Act
      const transitions1 = UserStatusUtils.getAvailableTransitions(
        UserStatus.PENDING
      );
      const transitions2 = UserStatusUtils.getAvailableTransitions(
        UserStatus.PENDING
      );

      // Assert
      expect(transitions1).not.toBe(transitions2);
      expect(transitions1).toEqual(transitions2);
    });
  });

  describe('canLogin', () => {
    it('应该允许ACTIVE状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.ACTIVE);

      // Assert
      expect(result).toBe(true);
    });

    it('应该不允许PENDING状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.PENDING);

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许SUSPENDED状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.SUSPENDED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许DISABLED状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.DISABLED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许LOCKED状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.LOCKED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许EXPIRED状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.EXPIRED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该不允许DELETED状态的用户登录', () => {
      // Act
      const result = UserStatusUtils.canLogin(UserStatus.DELETED);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('应该识别ACTIVE状态为可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.ACTIVE);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别PENDING状态为可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.PENDING);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别SUSPENDED状态为可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.SUSPENDED);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别DISABLED状态为不可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.DISABLED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别DELETED状态为不可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.DELETED);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别LOCKED状态为可用', () => {
      // Act
      const result = UserStatusUtils.isAvailable(UserStatus.LOCKED);

      // Assert
      expect(result).toBe(true);
    });
  });
});

