/**
 * 用户聚合根单元测试
 * 
 * @description 测试用户聚合根的业务逻辑和聚合根管理职责
 * 包括聚合一致性边界管理、实体操作协调、领域事件发布、业务规则验证
 * 
 * @since 1.0.0
 */

import { EntityId, UserStatus, UserRole } from '@hl8/hybrid-archi';
import { UserAggregate } from './user.aggregate';
import { User } from '../entities/user.entity';
import { UserProfile } from '../value-objects/user-profile.vo';
import { 
  UserRegisteredEvent,
  UserActivatedEvent,
  UserSuspendedEvent,
  UserDisabledEvent,
  UserLockedEvent,
  UserUnlockedEvent,
  UserAuthenticatedEvent,
  UserPasswordUpdatedEvent,
  UserAssignedToTenantEvent,
  UserRemovedFromTenantEvent,
  UserRoleAddedEvent,
  UserProfileUpdatedEvent
} from '../../events/user-events';
import { UserRoleRemovedEvent } from '../../events/authorization-events';
import { TenantContextException } from '../../exceptions/tenant-context.exception';

describe('UserAggregate', () => {
  let userAggregate: UserAggregate;
  let userId: EntityId;
  let user: User;
  let profile: UserProfile;
  let tenantId: EntityId;

  beforeEach(() => {
    userId = EntityId.generate();
    tenantId = EntityId.generate();
    profile = UserProfile.fromJSON({
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      phone: '+1234567890',
      timezone: 'UTC',
      language: 'en'
    });

    user = new User(
      userId,
      'test@example.com',
      'testuser',
      'hashed_password',
      profile,
      UserStatus.PENDING,
      [UserRole.REGULAR_USER]
    );

    userAggregate = new UserAggregate(userId, user);
  });

  describe('create', () => {
    it('should create user aggregate with default status and role', () => {
      // Arrange
      const newUserId = EntityId.generate();
      const email = 'newuser@example.com';
      const username = 'newuser';
      const password = 'SecurePassword123!';
      const newProfile = UserProfile.fromJSON({
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
        phone: '+0987654321',
        timezone: 'EST',
        language: 'zh'
      });

      // Act
      const newUserAggregate = UserAggregate.create(
        newUserId,
        email,
        username,
        password,
        newProfile
      );

      // Assert
      expect(newUserAggregate).toBeInstanceOf(UserAggregate);
      expect(newUserAggregate.getUserId()).toEqual(newUserId);
      
      const createdUser = newUserAggregate.getUser();
      expect(createdUser.email).toBe(email);
      expect(createdUser.username).toBe(username);
      expect(createdUser.status).toBe(UserStatus.PENDING);
      expect(createdUser.roles).toContain(UserRole.REGULAR_USER);
      expect(createdUser.profile).toEqual(newProfile);
      
      // 验证密码被哈希处理
      expect(createdUser.password).toBe('hashed_SecurePassword123!');
    });

    it('should publish UserRegisteredEvent when creating user', () => {
      // Arrange
      const newUserId = EntityId.generate();
      const email = 'eventuser@example.com';
      const username = 'eventuser';
      const password = 'EventPassword123!';
      const newProfile = UserProfile.fromJSON({
        firstName: 'Event',
        lastName: 'User',
        displayName: 'Event User',
        phone: '+1111111111',
        timezone: 'UTC',
        language: 'en'
      });

      // Act
      const newUserAggregate = UserAggregate.create(
        newUserId,
        email,
        username,
        password,
        newProfile
      );

      // Assert
      const domainEvents = newUserAggregate.getUncommittedEvents();
      expect(domainEvents).toHaveLength(1);
      
      const registeredEvent = domainEvents[0] as UserRegisteredEvent;
      expect(registeredEvent).toBeInstanceOf(UserRegisteredEvent);
      expect(registeredEvent.userEntityId).toEqual(newUserId);
      expect(registeredEvent.email).toBe(email);
      expect(registeredEvent.username).toBe(username);
      expect(registeredEvent.eventType).toBe('UserRegistered');
    });
  });

  describe('activate', () => {
    beforeEach(() => {
      // 先分配用户到租户，因为激活需要租户上下文
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should activate user and publish UserActivatedEvent', () => {
      // Arrange
      expect(userAggregate.getUser().status).toBe(UserStatus.PENDING);

      // Act
      userAggregate.activate();

      // Assert
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents.find(event => event.eventType === 'UserActivated') as UserActivatedEvent;
      expect(activatedEvent).toBeDefined();
      expect(activatedEvent).toBeInstanceOf(UserActivatedEvent);
      expect(activatedEvent.userEntityId).toEqual(userId);
      expect(activatedEvent.tenantId).toBe(tenantId.toString());
      expect(activatedEvent.eventType).toBe('UserActivated');
    });

    it('should throw TenantContextException when user is not assigned to tenant', () => {
      // Arrange
      const userWithoutTenant = new User(
        EntityId.generate(),
        'notenant@example.com',
        'notenant',
        'hashed_password',
        profile,
        UserStatus.PENDING,
        [UserRole.REGULAR_USER]
      );
      const userAggregateWithoutTenant = new UserAggregate(EntityId.generate(), userWithoutTenant);

      // Act & Assert
      expect(() => userAggregateWithoutTenant.activate())
        .toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.activate())
        .toThrow('缺少租户上下文');
    });

    it('should coordinate user entity activation through command pattern', () => {
      // Arrange
      const userSpy = jest.spyOn(user, 'activate');
      expect(userSpy).not.toHaveBeenCalled();

      // Act
      userAggregate.activate();

      // Assert
      expect(userSpy).toHaveBeenCalledTimes(1);
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('suspend', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should suspend user and publish UserSuspendedEvent', () => {
      // Arrange
      const reason = '违反使用条款';
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);

      // Act
      userAggregate.suspend(reason);

      // Assert
      expect(userAggregate.getUser().status).toBe(UserStatus.SUSPENDED);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const suspendedEvent = domainEvents.find(event => event.eventType === 'UserSuspended') as UserSuspendedEvent;
      expect(suspendedEvent).toBeDefined();
      expect(suspendedEvent).toBeInstanceOf(UserSuspendedEvent);
      expect(suspendedEvent.userEntityId).toEqual(userId);
      expect(suspendedEvent.reason).toBe(reason);
      expect(suspendedEvent.tenantId).toBe(tenantId.toString());
      expect(suspendedEvent.eventType).toBe('UserSuspended');
    });

    it('should coordinate user entity suspension through command pattern', () => {
      // Arrange
      const reason = '账户违规';
      const userSpy = jest.spyOn(user, 'suspend');

      // Act
      userAggregate.suspend(reason);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(reason);
      expect(userAggregate.getUser().status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('disable', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should disable user and publish UserDisabledEvent', () => {
      // Arrange
      const reason = '账户违规';
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);

      // Act
      userAggregate.disable(reason);

      // Assert
      expect(userAggregate.getUser().status).toBe(UserStatus.DISABLED);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const disabledEvent = domainEvents.find(event => event.eventType === 'UserDisabled') as UserDisabledEvent;
      expect(disabledEvent).toBeDefined();
      expect(disabledEvent).toBeInstanceOf(UserDisabledEvent);
      expect(disabledEvent.userEntityId).toEqual(userId);
      expect(disabledEvent.reason).toBe(reason);
      expect(disabledEvent.tenantId).toBe(tenantId.toString());
      expect(disabledEvent.eventType).toBe('UserDisabled');
    });

    it('should coordinate user entity disable through command pattern', () => {
      // Arrange
      const reason = '安全原因';
      const userSpy = jest.spyOn(user, 'disable');

      // Act
      userAggregate.disable(reason);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(reason);
      expect(userAggregate.getUser().status).toBe(UserStatus.DISABLED);
    });
  });

  describe('lock', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should lock user and publish UserLockedEvent', () => {
      // Arrange
      const reason = '密码错误次数过多';
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);

      // Act
      userAggregate.lock(reason);

      // Assert
      expect(userAggregate.getUser().status).toBe(UserStatus.LOCKED);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const lockedEvent = domainEvents.find(event => event.eventType === 'UserLocked') as UserLockedEvent;
      expect(lockedEvent).toBeDefined();
      expect(lockedEvent).toBeInstanceOf(UserLockedEvent);
      expect(lockedEvent.userEntityId).toEqual(userId);
      expect(lockedEvent.reason).toBe(reason);
      expect(lockedEvent.tenantId).toBe(tenantId.toString());
      expect(lockedEvent.eventType).toBe('UserLocked');
    });

    it('should coordinate user entity lock through command pattern', () => {
      // Arrange
      const reason = '异常登录行为';
      const userSpy = jest.spyOn(user, 'lock');

      // Act
      userAggregate.lock(reason);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(reason);
      expect(userAggregate.getUser().status).toBe(UserStatus.LOCKED);
    });
  });

  describe('unlock', () => {
    beforeEach(() => {
      // 先分配用户到租户并锁定
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.lock('测试锁定');
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should unlock user and publish UserUnlockedEvent', () => {
      // Arrange
      expect(userAggregate.getUser().status).toBe(UserStatus.LOCKED);

      // Act
      userAggregate.unlock();

      // Assert
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const unlockedEvent = domainEvents.find(event => event.eventType === 'UserUnlocked') as UserUnlockedEvent;
      expect(unlockedEvent).toBeDefined();
      expect(unlockedEvent).toBeInstanceOf(UserUnlockedEvent);
      expect(unlockedEvent.userEntityId).toEqual(userId);
      expect(unlockedEvent.tenantId).toBe(tenantId.toString());
      expect(unlockedEvent.eventType).toBe('UserUnlocked');
    });

    it('should coordinate user entity unlock through command pattern', () => {
      // Arrange
      const userSpy = jest.spyOn(user, 'unlock');

      // Act
      userAggregate.unlock();

      // Assert
      expect(userSpy).toHaveBeenCalledTimes(1);
      expect(userAggregate.getUser().status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('authenticate', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should authenticate user with correct password and publish UserAuthenticatedEvent', () => {
      // Arrange
      const correctPassword = 'hashed_password';

      // Act
      const result = userAggregate.authenticate(correctPassword);

      // Assert
      expect(result).toBe(true);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const authenticatedEvent = domainEvents.find(event => event.eventType === 'UserAuthenticated') as UserAuthenticatedEvent;
      expect(authenticatedEvent).toBeDefined();
      expect(authenticatedEvent).toBeInstanceOf(UserAuthenticatedEvent);
      expect(authenticatedEvent.userEntityId).toEqual(userId);
      expect(authenticatedEvent.tenantId).toBe(tenantId.toString());
      expect(authenticatedEvent.eventType).toBe('UserAuthenticated');
    });

    it('should not publish event when authentication fails', () => {
      // Arrange
      const incorrectPassword = 'wrong_password';

      // Act
      const result = userAggregate.authenticate(incorrectPassword);

      // Assert
      expect(result).toBe(false);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const authenticatedEvent = domainEvents.find(event => event.eventType === 'UserAuthenticated');
      expect(authenticatedEvent).toBeUndefined();
    });

    it('should coordinate user entity authentication through command pattern', () => {
      // Arrange
      const password = 'test_password';
      const userSpy = jest.spyOn(user, 'authenticate').mockReturnValue(true);

      // Act
      userAggregate.authenticate(password);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('updatePassword', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should update password and publish UserPasswordUpdatedEvent', () => {
      // Arrange
      const oldPassword = 'hashed_password';
      const newPassword = 'new_password';

      // Act
      userAggregate.updatePassword(oldPassword, newPassword);

      // Assert
      const domainEvents = userAggregate.getUncommittedEvents();
      const passwordUpdatedEvent = domainEvents.find(event => event.eventType === 'UserPasswordUpdated') as UserPasswordUpdatedEvent;
      expect(passwordUpdatedEvent).toBeDefined();
      expect(passwordUpdatedEvent).toBeInstanceOf(UserPasswordUpdatedEvent);
      expect(passwordUpdatedEvent.userEntityId).toEqual(userId);
      expect(passwordUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(passwordUpdatedEvent.eventType).toBe('UserPasswordUpdated');
    });

    it('should coordinate user entity password update through command pattern', () => {
      // Arrange
      const oldPassword = 'old_password';
      const newPassword = 'new_password';
      const userSpy = jest.spyOn(user, 'updatePassword');

      // Act
      userAggregate.updatePassword(oldPassword, newPassword);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(oldPassword, newPassword);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      // 先分配用户到租户并激活
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should reset password and publish UserPasswordUpdatedEvent', () => {
      // Arrange
      const newPassword = 'reset_password';

      // Act
      userAggregate.resetPassword(newPassword);

      // Assert
      const domainEvents = userAggregate.getUncommittedEvents();
      const passwordUpdatedEvent = domainEvents.find(event => event.eventType === 'UserPasswordUpdated') as UserPasswordUpdatedEvent;
      expect(passwordUpdatedEvent).toBeDefined();
      expect(passwordUpdatedEvent).toBeInstanceOf(UserPasswordUpdatedEvent);
      expect(passwordUpdatedEvent.userEntityId).toEqual(userId);
      expect(passwordUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(passwordUpdatedEvent.eventType).toBe('UserPasswordUpdated');
    });

    it('should coordinate user entity password reset through command pattern', () => {
      // Arrange
      const newPassword = 'reset_password';
      const userSpy = jest.spyOn(user, 'resetPassword');

      // Act
      userAggregate.resetPassword(newPassword);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(newPassword);
    });
  });

  describe('assignToTenant', () => {
    it('should assign user to tenant and publish UserAssignedToTenantEvent', () => {
      // Arrange
      const role = UserRole.TENANT_ADMIN;
      expect(userAggregate.getUser().tenantId).toBeUndefined();

      // Act
      userAggregate.assignToTenant(tenantId, role);

      // Assert
      expect(userAggregate.getUser().tenantId).toEqual(tenantId);
      expect(userAggregate.getUser().belongsToTenant(tenantId)).toBe(true);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const assignedEvent = domainEvents.find(event => event.eventType === 'UserAssignedToTenant') as UserAssignedToTenantEvent;
      expect(assignedEvent).toBeDefined();
      expect(assignedEvent).toBeInstanceOf(UserAssignedToTenantEvent);
      expect(assignedEvent.userEntityId).toEqual(userId);
      expect(assignedEvent.tenantId).toEqual(tenantId);
      expect(assignedEvent.role).toBe(role);
      expect(assignedEvent.eventType).toBe('UserAssignedToTenant');
    });

    it('should coordinate user entity tenant assignment through command pattern', () => {
      // Arrange
      const role = UserRole.REGULAR_USER;
      const userSpy = jest.spyOn(user, 'assignToTenant');

      // Act
      userAggregate.assignToTenant(tenantId, role);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(tenantId, role);
    });
  });

  describe('removeFromTenant', () => {
    beforeEach(() => {
      // 先分配用户到租户
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should remove user from tenant and publish UserRemovedFromTenantEvent', () => {
      // Arrange
      expect(userAggregate.getUser().belongsToTenant(tenantId)).toBe(true);

      // Act
      userAggregate.removeFromTenant(tenantId);

      // Assert
      expect(userAggregate.getUser().belongsToTenant(tenantId)).toBe(false);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const removedEvent = domainEvents.find(event => event.eventType === 'UserRemovedFromTenant') as UserRemovedFromTenantEvent;
      expect(removedEvent).toBeDefined();
      expect(removedEvent).toBeInstanceOf(UserRemovedFromTenantEvent);
      expect(removedEvent.userEntityId).toEqual(userId);
      expect(removedEvent.tenantId).toEqual(tenantId);
      expect(removedEvent.eventType).toBe('UserRemovedFromTenant');
    });

    it('should coordinate user entity tenant removal through command pattern', () => {
      // Arrange
      const userSpy = jest.spyOn(user, 'removeFromTenant');

      // Act
      userAggregate.removeFromTenant(tenantId);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('addRole', () => {
    beforeEach(() => {
      // 先分配用户到租户
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should add role to user and publish UserRoleAddedEvent', () => {
      // Arrange
      const newRole = UserRole.DEPARTMENT_ADMIN;
      expect(userAggregate.getUser().roles).not.toContain(newRole);

      // Act
      userAggregate.addRole(newRole);

      // Assert
      expect(userAggregate.getUser().roles).toContain(newRole);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const roleAddedEvent = domainEvents.find(event => event.eventType === 'UserRoleAdded') as UserRoleAddedEvent;
      expect(roleAddedEvent).toBeDefined();
      expect(roleAddedEvent).toBeInstanceOf(UserRoleAddedEvent);
      expect(roleAddedEvent.userEntityId).toEqual(userId);
      expect(roleAddedEvent.role).toBe(newRole);
      expect(roleAddedEvent.tenantId).toBe(tenantId.toString());
      expect(roleAddedEvent.eventType).toBe('UserRoleAdded');
    });

    it('should coordinate user entity role addition through command pattern', () => {
      // Arrange
      const newRole = UserRole.ORGANIZATION_ADMIN;
      const userSpy = jest.spyOn(user, 'addRole');

      // Act
      userAggregate.addRole(newRole);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(newRole);
    });
  });

  describe('removeRole', () => {
    beforeEach(() => {
      // 先分配用户到租户并添加角色
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should remove role from user and publish UserRoleRemovedEvent', () => {
      // Arrange
      const roleToRemove = UserRole.DEPARTMENT_ADMIN;
      expect(userAggregate.getUser().roles).toContain(roleToRemove);

      // Act
      userAggregate.removeRole(roleToRemove);

      // Assert
      expect(userAggregate.getUser().roles).not.toContain(roleToRemove);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const roleRemovedEvent = domainEvents.find(event => event.eventType === 'UserRoleRemoved') as UserRoleRemovedEvent;
      expect(roleRemovedEvent).toBeDefined();
      expect(roleRemovedEvent).toBeInstanceOf(UserRoleRemovedEvent);
      expect(roleRemovedEvent.userEntityId).toEqual(userId);
      expect(roleRemovedEvent.tenantId).toBe(tenantId.toString());
      expect(roleRemovedEvent.eventType).toBe('UserRoleRemoved');
    });

    it('should coordinate user entity role removal through command pattern', () => {
      // Arrange
      const roleToRemove = UserRole.DEPARTMENT_ADMIN;
      const userSpy = jest.spyOn(user, 'removeRole');

      // Act
      userAggregate.removeRole(roleToRemove);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(roleToRemove);
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      // 先分配用户到租户
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should update user profile and publish UserProfileUpdatedEvent', () => {
      // Arrange
      const newProfile = UserProfile.fromJSON({
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
        phone: '+0987654321',
        timezone: 'EST',
        language: 'zh'
      });

      // Act
      userAggregate.updateProfile(newProfile);

      // Assert
      expect(userAggregate.getUser().profile).toEqual(newProfile);
      
      const domainEvents = userAggregate.getUncommittedEvents();
      const profileUpdatedEvent = domainEvents.find(event => event.eventType === 'UserProfileUpdated') as UserProfileUpdatedEvent;
      expect(profileUpdatedEvent).toBeDefined();
      expect(profileUpdatedEvent).toBeInstanceOf(UserProfileUpdatedEvent);
      expect(profileUpdatedEvent.userEntityId).toEqual(userId);
      expect(profileUpdatedEvent.newProfile).toEqual(newProfile);
      expect(profileUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(profileUpdatedEvent.eventType).toBe('UserProfileUpdated');
    });

    it('should coordinate user entity profile update through command pattern', () => {
      // Arrange
      const newProfile = UserProfile.fromJSON({
        firstName: 'Command',
        lastName: 'Test',
        displayName: 'Command Test',
        phone: '+1111111111',
        timezone: 'UTC',
        language: 'en'
      });
      const userSpy = jest.spyOn(user, 'updateProfile');

      // Act
      userAggregate.updateProfile(newProfile);

      // Assert
      expect(userSpy).toHaveBeenCalledWith(newProfile);
    });
  });

  describe('getUser', () => {
    it('should return the user entity', () => {
      // Act
      const returnedUser = userAggregate.getUser();

      // Assert
      expect(returnedUser).toBe(user);
      expect(returnedUser).toBeInstanceOf(User);
      expect(returnedUser.email).toBe('test@example.com');
      expect(returnedUser.username).toBe('testuser');
    });

    it('should provide controlled access to user entity', () => {
      // Arrange & Act
      const userEntity = userAggregate.getUser();

      // Assert - 外部只能通过聚合根访问内部实体
      expect(userEntity).toBeDefined();
      expect(userEntity).toBeInstanceOf(User);
      
      // 验证聚合根管理内部实体访问
      expect(userEntity.getId()).toEqual(userId);
    });
  });

  describe('getUserId', () => {
    it('should return the user ID', () => {
      // Act
      const returnedUserId = userAggregate.getUserId();

      // Assert
      expect(returnedUserId).toEqual(userId);
      expect(returnedUserId).toBeInstanceOf(EntityId);
    });
  });

  describe('getCurrentTenantId', () => {
    it('should return current tenant ID when user is assigned to tenant', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // Act
      const currentTenantId = userAggregate.getCurrentTenantId();

      // Assert
      expect(currentTenantId).toBe(tenantId.toString());
    });

    it('should throw TenantContextException when user is not assigned to tenant', () => {
      // Act & Assert
      expect(() => userAggregate.getCurrentTenantId())
        .toThrow(TenantContextException);
      expect(() => userAggregate.getCurrentTenantId())
        .toThrow('用户未分配到任何租户');
    });
  });

  describe('validateTenantContext', () => {
    it('should not throw exception when user has tenant context', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // Act & Assert - 不应该抛出异常
      expect(() => userAggregate['validateTenantContext']()).not.toThrow();
    });

    it('should throw TenantContextException when user lacks tenant context', () => {
      // Act & Assert
      expect(() => userAggregate['validateTenantContext']())
        .toThrow(TenantContextException);
      expect(() => userAggregate['validateTenantContext']())
        .toThrow('缺少租户上下文');
    });
  });

  describe('aggregate root responsibilities', () => {
    it('should manage aggregate consistency boundary', () => {
      // Arrange
      const newUserAggregate = UserAggregate.create(
        EntityId.generate(),
        'consistency@example.com',
        'consistency',
        'password',
        profile
      );

      // Act & Assert - 聚合根确保聚合内数据一致性
      expect(newUserAggregate.getUser().status).toBe(UserStatus.PENDING);
      
      // 分配租户
      newUserAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      expect(newUserAggregate.getUser().belongsToTenant(tenantId)).toBe(true);
      
      // 激活用户
      newUserAggregate.activate();
      expect(newUserAggregate.getUser().status).toBe(UserStatus.ACTIVE);
      expect(newUserAggregate.getUser().belongsToTenant(tenantId)).toBe(true); // 租户关系保持一致
    });

    it('should coordinate internal entity operations through command pattern', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      const userSpy1 = jest.spyOn(user, 'activate');
      const userSpy2 = jest.spyOn(user, 'updateProfile');
      const userSpy3 = jest.spyOn(user, 'addRole');

      // Act - 聚合根发出指令给实体
      userAggregate.activate();
      userAggregate.updateProfile(profile);
      userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);

      // Assert - 验证指令模式的执行
      expect(userSpy1).toHaveBeenCalledTimes(1);
      expect(userSpy2).toHaveBeenCalledWith(profile);
      expect(userSpy3).toHaveBeenCalledWith(UserRole.DEPARTMENT_ADMIN);
    });

    it('should publish domain events for all operations', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // Act - 执行多个操作
      userAggregate.activate();
      userAggregate.updateProfile(profile);
      userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);

      // Assert - 验证所有操作都发布了相应的事件
      const domainEvents = userAggregate.getUncommittedEvents();
      
      const activatedEvent = domainEvents.find(event => event.eventType === 'UserActivated');
      const profileUpdatedEvent = domainEvents.find(event => event.eventType === 'UserProfileUpdated');
      const roleAddedEvent = domainEvents.find(event => event.eventType === 'UserRoleAdded');

      expect(activatedEvent).toBeDefined();
      expect(profileUpdatedEvent).toBeDefined();
      expect(roleAddedEvent).toBeDefined();
      expect(domainEvents).toHaveLength(3);
    });

    it('should validate tenant context for operations requiring it', () => {
      // Arrange
      const userWithoutTenant = new User(
        EntityId.generate(),
        'notenant@example.com',
        'notenant',
        'hashed_password',
        profile,
        UserStatus.PENDING,
        [UserRole.REGULAR_USER]
      );
      const userAggregateWithoutTenant = new UserAggregate(EntityId.generate(), userWithoutTenant);

      // Act & Assert - 聚合根通过租户上下文验证业务规则
      expect(() => userAggregateWithoutTenant.activate()).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.suspend('reason')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.disable('reason')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.lock('reason')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.unlock()).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.authenticate('password')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.updatePassword('old', 'new')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.resetPassword('new')).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.addRole(UserRole.ADMIN)).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.removeRole(UserRole.ADMIN)).toThrow(TenantContextException);
      expect(() => userAggregateWithoutTenant.updateProfile(profile)).toThrow(TenantContextException);
    });
  });

  describe('event management', () => {
    it('should track uncommitted events', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // Act - 执行多个操作
      userAggregate.activate();
      userAggregate.updateProfile(profile);

      // Assert
      const uncommittedEvents = userAggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(2);
      expect(uncommittedEvents.every(event => event.eventType)).toBeTruthy();
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
      userAggregate.activate();
      expect(userAggregate.getUncommittedEvents()).toHaveLength(1);

      // Act
      userAggregate.markEventsAsCommitted();

      // Assert
      expect(userAggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should accumulate events across multiple operations', () => {
      // Arrange
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // Act - 执行多个操作
      userAggregate.activate();
      userAggregate.updateProfile(profile);
      userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);

      // Assert
      const allEvents = userAggregate.getUncommittedEvents();
      expect(allEvents).toHaveLength(3);
      
      const eventTypes = allEvents.map(event => event.eventType);
      expect(eventTypes).toContain('UserActivated');
      expect(eventTypes).toContain('UserProfileUpdated');
      expect(eventTypes).toContain('UserRoleAdded');
    });
  });

  describe('password hashing', () => {
    it('should hash password during user creation', () => {
      // Arrange
      const plainPassword = 'PlainPassword123!';

      // Act
      const newUserAggregate = UserAggregate.create(
        EntityId.generate(),
        'hashtest@example.com',
        'hashtest',
        plainPassword,
        profile
      );

      // Assert
      const createdUser = newUserAggregate.getUser();
      expect(createdUser.password).toBe(`hashed_${plainPassword}`);
      expect(createdUser.password).not.toBe(plainPassword);
    });

    it('should use consistent hashing format', () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hashedPassword = UserAggregate['hashPassword'](password);

      // Assert
      expect(hashedPassword).toBe(`hashed_${password}`);
    });
  });
});
