/**
 * 用户实体单元测试
 */

import { EntityId, Username, Email, UserStatus } from '@hl8/hybrid-archi';
import { User } from './user.entity';

describe('User Entity', () => {
  let userId: EntityId;
  let username: Username;
  let email: Email;

  beforeEach(() => {
    userId = EntityId.generate();
    username = Username.create('johndoe');
    email = Email.create('john@example.com');
  });

  describe('create', () => {
    it('应该创建新的待激活用户', () => {
      const user = User.create(userId, username, email, null, {
        createdBy: 'system',
      });

      expect(user.getUsername()).toEqual(username);
      expect(user.getEmail()).toEqual(email);
      expect(user.getStatus()).toBe(UserStatus.PENDING);
      expect(user.isPending()).toBe(true);
      expect(user.isEmailVerified()).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('应该验证邮箱并激活用户', () => {
      const user = User.create(userId, username, email, null, {
        createdBy: 'system',
      });

      user.verifyEmail('admin-123');

      expect(user.isEmailVerified()).toBe(true);
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.isActive()).toBe(true);
    });
  });

  describe('disable and enable', () => {
    it('应该成功禁用和启用用户', () => {
      const user = User.create(userId, username, email, null, {
        createdBy: 'system',
      });
      user.verifyEmail();

      user.disable('Violation', 'admin-123');
      expect(user.isDisabled()).toBe(true);

      user.enable('admin-123');
      expect(user.isActive()).toBe(true);
    });
  });

  describe('lock and unlock', () => {
    it('应该成功锁定和解锁用户', () => {
      const user = User.create(userId, username, email, null, {
        createdBy: 'system',
      });
      user.verifyEmail();

      user.lock('Too many failed login attempts', 'system');
      expect(user.isLocked()).toBe(true);

      user.unlock('admin-123');
      expect(user.isActive()).toBe(true);
    });
  });

  describe('recordLogin', () => {
    it('应该记录登录时间', () => {
      const user = User.create(userId, username, email, null, {
        createdBy: 'system',
      });

      user.recordLogin();

      expect(user.getLastLoginAt()).not.toBeNull();
    });
  });
});

