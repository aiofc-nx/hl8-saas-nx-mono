/**
 * 用户实体单元测试
 * 
 * @description 测试用户实体的业务逻辑和状态管理
 * 
 * @since 1.0.0
 */

import { UserId, Email, Username, Password } from '@hl8/hybrid-archi';
import { TenantId } from '@hl8/hybrid-archi';
import { User } from './user.entity';
import { UserProfile } from '../value-objects/user-profile.vo';
import { USER_STATUS, USER_ROLES } from '../../../constants/business.constants';
import { 
  UserNotPendingException, 
  UserNotActiveException, 
  UserAlreadyActiveException 
} from './user.entity';

describe('User Entity', () => {
  let user: User;
  let userId: UserId;
  let email: Email;
  let username: Username;
  let password: Password;
  let profile: UserProfile;
  let tenantId: TenantId;

  beforeEach(() => {
    userId = UserId.generate();
    email = Email.create('test@example.com');
    username = Username.create('testuser');
    password = Password.create('SecurePassword123!');
    profile = UserProfile.fromJSON({
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      phone: '+1234567890',
      timezone: 'UTC',
      language: 'en'
    });
    tenantId = TenantId.generate();

    user = new User(
      userId,
      email,
      username,
      password,
      profile,
      USER_STATUS.PENDING,
      USER_ROLES.REGULAR_USER
    );
  });

  describe('register', () => {
    it('should register user with valid data', () => {
      // Arrange
      const newUser = new User(
        UserId.generate(),
        email,
        username,
        password,
        profile,
        USER_STATUS.PENDING,
        USER_ROLES.REGULAR_USER
      );

      // Act
      newUser.register(email, username, password, profile);

      // Assert
      expect(newUser.status).toBe(USER_STATUS.ACTIVE);
      expect(newUser.email).toEqual(email);
      expect(newUser.username).toEqual(username);
      expect(newUser.profile).toEqual(profile);
    });

    it('should throw error when trying to register already active user', () => {
      // Arrange
      user.activate(); // 先激活用户
      expect(user.status).toBe(USER_STATUS.ACTIVE);

      // Act & Assert
      expect(() => user.register(email, username, password, profile))
        .toThrow(UserAlreadyActiveException);
    });
  });

  describe('activate', () => {
    it('should activate user when status is PENDING', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);

      // Act
      user.activate();

      // Assert
      expect(user.status).toBe(USER_STATUS.ACTIVE);
    });

    it('should throw error when trying to activate non-pending user', () => {
      // Arrange
      user.activate(); // 先激活
      expect(user.status).toBe(USER_STATUS.ACTIVE);

      // Act & Assert
      expect(() => user.activate()).toThrow(UserNotPendingException);
      expect(() => user.activate()).toThrow('Cannot activate user with status: ACTIVE');
    });
  });

  describe('deactivate', () => {
    it('should deactivate user when status is ACTIVE', () => {
      // Arrange
      user.activate(); // 先激活
      expect(user.status).toBe(USER_STATUS.ACTIVE);

      // Act
      user.deactivate();

      // Assert
      expect(user.status).toBe(USER_STATUS.INACTIVE);
    });

    it('should throw error when trying to deactivate non-active user', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);

      // Act & Assert
      expect(() => user.deactivate()).toThrow(UserNotActiveException);
      expect(() => user.deactivate()).toThrow('Cannot deactivate user with status: PENDING');
    });
  });

  describe('suspend', () => {
    it('should suspend user when status is ACTIVE', () => {
      // Arrange
      user.activate(); // 先激活
      expect(user.status).toBe(USER_STATUS.ACTIVE);

      // Act
      user.suspend('Violation of terms');

      // Assert
      expect(user.status).toBe(USER_STATUS.SUSPENDED);
    });

    it('should throw error when trying to suspend non-active user', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);

      // Act & Assert
      expect(() => user.suspend('Test')).toThrow(UserNotActiveException);
      expect(() => user.suspend('Test')).toThrow('Cannot suspend user with status: PENDING');
    });
  });

  describe('authenticate', () => {
    it('should authenticate user with correct password', () => {
      // Arrange
      user.activate(); // 先激活用户
      const correctPassword = Password.create('SecurePassword123!');

      // Act
      const result = user.authenticate(correctPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should fail authentication with incorrect password', () => {
      // Arrange
      user.activate(); // 先激活用户
      const incorrectPassword = Password.create('WrongPassword123!');

      // Act
      const result = user.authenticate(incorrectPassword);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error when trying to authenticate inactive user', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);
      const testPassword = Password.create('TestPassword123!');

      // Act & Assert
      expect(() => user.authenticate(testPassword)).toThrow(UserNotActiveException);
      expect(() => user.authenticate(testPassword))
        .toThrow('Cannot authenticate user with status: PENDING');
    });
  });

  describe('updatePassword', () => {
    it('should update password for active user', () => {
      // Arrange
      user.activate(); // 先激活用户
      const newPassword = Password.create('NewSecurePassword123!');

      // Act
      user.updatePassword(newPassword);

      // Assert
      expect(user.password).toEqual(newPassword);
    });

    it('should throw error when trying to update password for inactive user', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);
      const newPassword = Password.create('NewPassword123!');

      // Act & Assert
      expect(() => user.updatePassword(newPassword)).toThrow(UserNotActiveException);
      expect(() => user.updatePassword(newPassword))
        .toThrow('Cannot update password for user with status: PENDING');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
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
      user.updateProfile(newProfile);

      // Assert
      expect(user.profile).toEqual(newProfile);
      expect(user.profile.fullName).toBe('Jane Smith');
    });
  });

  describe('assignToTenant', () => {
    it('should assign user to tenant', () => {
      // Arrange
      const newTenantId = TenantId.generate();

      // Act
      user.assignToTenant(newTenantId);

      // Assert
      expect(user.tenantId).toEqual(newTenantId);
      expect(user.belongsToTenant(newTenantId)).toBe(true);
    });

    it('should update tenant assignment', () => {
      // Arrange
      const firstTenantId = TenantId.generate();
      const secondTenantId = TenantId.generate();

      // Act
      user.assignToTenant(firstTenantId);
      user.assignToTenant(secondTenantId);

      // Assert
      expect(user.tenantId).toEqual(secondTenantId);
      expect(user.belongsToTenant(firstTenantId)).toBe(false);
      expect(user.belongsToTenant(secondTenantId)).toBe(true);
    });
  });

  describe('removeFromTenant', () => {
    it('should remove user from tenant', () => {
      // Arrange
      user.assignToTenant(tenantId);
      expect(user.belongsToTenant(tenantId)).toBe(true);

      // Act
      user.removeFromTenant();

      // Assert
      expect(user.tenantId).toBeUndefined();
      expect(user.belongsToTenant(tenantId)).toBe(false);
    });
  });

  describe('updateRole', () => {
    it('should update user role', () => {
      // Arrange
      expect(user.role).toBe(USER_ROLES.REGULAR_USER);

      // Act
      user.updateRole(USER_ROLES.TENANT_ADMIN);

      // Assert
      expect(user.role).toBe(USER_ROLES.TENANT_ADMIN);
      expect(user.hasRole(USER_ROLES.TENANT_ADMIN)).toBe(true);
      expect(user.hasRole(USER_ROLES.REGULAR_USER)).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for active user', () => {
      // Arrange
      user.activate();

      // Act & Assert
      expect(user.isActive()).toBe(true);
    });

    it('should return false for inactive user', () => {
      // Arrange
      expect(user.status).toBe(USER_STATUS.PENDING);

      // Act & Assert
      expect(user.isActive()).toBe(false);
    });
  });

  describe('belongsToTenant', () => {
    it('should return true when user belongs to tenant', () => {
      // Arrange
      user.assignToTenant(tenantId);

      // Act & Assert
      expect(user.belongsToTenant(tenantId)).toBe(true);
    });

    it('should return false when user does not belong to tenant', () => {
      // Arrange
      const otherTenantId = TenantId.generate();

      // Act & Assert
      expect(user.belongsToTenant(tenantId)).toBe(false);
      expect(user.belongsToTenant(otherTenantId)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has specified role', () => {
      // Arrange
      expect(user.role).toBe(USER_ROLES.REGULAR_USER);

      // Act & Assert
      expect(user.hasRole(USER_ROLES.REGULAR_USER)).toBe(true);
    });

    it('should return false when user does not have specified role', () => {
      // Arrange
      expect(user.role).toBe(USER_ROLES.REGULAR_USER);

      // Act & Assert
      expect(user.hasRole(USER_ROLES.TENANT_ADMIN)).toBe(false);
      expect(user.hasRole(USER_ROLES.PLATFORM_ADMIN)).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return correct values for all getters', () => {
      // Assert
      expect(user.email).toEqual(email);
      expect(user.username).toEqual(username);
      expect(user.password).toEqual(password);
      expect(user.profile).toEqual(profile);
      expect(user.status).toBe(USER_STATUS.PENDING);
      expect(user.role).toBe(USER_ROLES.REGULAR_USER);
      expect(user.tenantId).toBeUndefined();
    });
  });
});
