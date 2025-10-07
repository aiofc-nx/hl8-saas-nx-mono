/**
 * 租户配置值对象单元测试
 * 
 * @description 测试租户配置值对象的业务逻辑和验证规则
 * 包括配置创建、验证、更新、功能检查等功能
 * 
 * @since 1.0.0
 */

import { TenantConfig, TenantConfigProps } from './tenant-config.vo';

describe('TenantConfig', () => {
  let defaultConfig: TenantConfigProps;

  beforeEach(() => {
    defaultConfig = {
      features: ['user_management'],
      theme: 'default',
      branding: {
        brandName: 'Test Tenant',
        brandDescription: 'Test tenant configuration'
      },
      settings: {},
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai'
    };
  });

  describe('create', () => {
    it('should create tenant config with valid data', () => {
      // Act
      const config = TenantConfig.create(defaultConfig);

      // Assert
      expect(config).toBeInstanceOf(TenantConfig);
      expect(config.features).toEqual(['user_management']);
      expect(config.theme).toBe('default');
      expect(config.branding.brandName).toBe('Test Tenant');
      expect(config.branding.brandDescription).toBe('Test tenant configuration');
      expect(config.settings).toEqual({});
      expect(config.locale).toBe('zh-CN');
      expect(config.timezone).toBe('Asia/Shanghai');
    });

    it('should create tenant config with minimal data', () => {
      // Arrange
      const minimalConfig: TenantConfigProps = {
        features: ['basic'],
        theme: 'light',
        branding: {
          brandName: 'Minimal Tenant'
        },
        settings: {},
        locale: 'en',
        timezone: 'UTC'
      };

      // Act
      const config = TenantConfig.create(minimalConfig);

      // Assert
      expect(config).toBeInstanceOf(TenantConfig);
      expect(config.features).toEqual(['basic']);
      expect(config.theme).toBe('light');
      expect(config.branding.brandName).toBe('Minimal Tenant');
      expect(config.locale).toBe('en');
      expect(config.timezone).toBe('UTC');
    });

    it('should create tenant config with complex settings', () => {
      // Arrange
      const complexConfig: TenantConfigProps = {
        features: ['user_management', 'organization', 'department'],
        theme: 'dark',
        branding: {
          brandName: 'Complex Tenant',
          brandDescription: 'Complex tenant with advanced features',
          logo: 'https://example.com/logo.png',
          colors: {
            primary: '#FF0000',
            secondary: '#00FF00',
            accent: '#0000FF'
          }
        },
        settings: {
          system: {
            multiLanguage: true,
            defaultLanguage: 'zh-CN',
            apiAccess: true,
            apiRateLimit: 1000
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: false
            },
            sessionTimeout: 30,
            twoFactorAuth: false
          },
          notifications: {
            email: {
              enabled: true,
              smtpServer: 'smtp.example.com',
              smtpPort: 587,
              smtpUser: 'noreply@example.com'
            },
            sms: {
              enabled: false
            }
          }
        },
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai'
      };

      // Act
      const config = TenantConfig.create(complexConfig);

      // Assert
      expect(config).toBeInstanceOf(TenantConfig);
      expect(config.features).toEqual(['user_management', 'organization', 'department']);
      expect(config.theme).toBe('dark');
      expect(config.branding.logo).toBe('https://example.com/logo.png');
      expect(config.branding.colors?.primary).toBe('#FF0000');
      expect(config.settings.system?.multiLanguage).toBe(true);
      expect(config.settings.security?.passwordPolicy?.minLength).toBe(8);
      expect(config.settings.notifications?.email?.enabled).toBe(true);
    });
  });

  describe('feature management', () => {
    let config: TenantConfig;

    beforeEach(() => {
      config = TenantConfig.create(defaultConfig);
    });

    it('should check if feature is enabled', () => {
      // Act & Assert
      expect(config.hasFeature('user_management')).toBe(true);
      expect(config.hasFeature('organization')).toBe(false);
      expect(config.hasFeature('nonexistent')).toBe(false);
    });

    it('should check if all features are enabled', () => {
      // Arrange
      const allFeaturesConfig = TenantConfig.create({
        ...defaultConfig,
        features: ['all_features']
      });

      // Act & Assert
      expect(allFeaturesConfig.hasFeature('user_management')).toBe(true);
      expect(allFeaturesConfig.hasFeature('organization')).toBe(true);
      expect(allFeaturesConfig.hasFeature('department')).toBe(true);
      expect(allFeaturesConfig.hasFeature('any_feature')).toBe(true);
    });

    it('should enable feature', () => {
      // Act
      config.enableFeature('organization');

      // Assert
      expect(config.hasFeature('organization')).toBe(true);
      expect(config.features).toContain('organization');
    });

    it('should disable feature', () => {
      // Arrange
      config.enableFeature('organization');

      // Act
      config.disableFeature('organization');

      // Assert
      expect(config.hasFeature('organization')).toBe(false);
      expect(config.features).not.toContain('organization');
    });

    it('should not enable already enabled feature twice', () => {
      // Arrange
      const initialFeatures = config.features.length;

      // Act
      config.enableFeature('user_management');

      // Assert
      expect(config.features.length).toBe(initialFeatures);
      expect(config.features.filter(f => f === 'user_management').length).toBe(1);
    });
  });

  describe('validation', () => {
    it('should validate valid features', () => {
      // Arrange
      const validFeatures = ['user_management', 'organization', 'department'];

      // Act
      const isValid = TenantConfig.validateFeatures(validFeatures);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid features', () => {
      // Arrange
      const invalidFeatures = ['invalid_feature', 'another_invalid'];

      // Act & Assert
      expect(() => TenantConfig.validateFeatures(invalidFeatures))
        .toThrow('无效的功能: invalid_feature, another_invalid');
    });

    it('should validate mixed valid and invalid features', () => {
      // Arrange
      const mixedFeatures = ['user_management', 'invalid_feature'];

      // Act & Assert
      expect(() => TenantConfig.validateFeatures(mixedFeatures))
        .toThrow('无效的功能: invalid_feature');
    });

    it('should validate theme', () => {
      // Arrange
      const validThemes = ['default', 'light', 'dark', 'custom'];

      // Act & Assert
      validThemes.forEach(theme => {
        expect(TenantConfig.validateTheme(theme)).toBe(true);
      });
    });

    it('should reject invalid theme', () => {
      // Act & Assert
      expect(() => TenantConfig.validateTheme('invalid_theme'))
        .toThrow('无效的主题: invalid_theme');
    });

    it('should validate locale', () => {
      // Arrange
      const validLocales = ['zh-CN', 'en-US', 'ja-JP', 'fr-FR'];

      // Act & Assert
      validLocales.forEach(locale => {
        expect(TenantConfig.validateLocale(locale)).toBe(true);
      });
    });

    it('should reject invalid locale', () => {
      // Act & Assert
      expect(() => TenantConfig.validateLocale('invalid-locale'))
        .toThrow('无效的语言环境: invalid-locale');
    });

    it('should validate timezone', () => {
      // Arrange
      const validTimezones = ['UTC', 'Asia/Shanghai', 'America/New_York', 'Europe/London'];

      // Act & Assert
      validTimezones.forEach(timezone => {
        expect(TenantConfig.validateTimezone(timezone)).toBe(true);
      });
    });

    it('should reject invalid timezone', () => {
      // Act & Assert
      expect(() => TenantConfig.validateTimezone('Invalid/Timezone'))
        .toThrow('无效的时区: Invalid/Timezone');
    });
  });

  describe('update operations', () => {
    let config: TenantConfig;

    beforeEach(() => {
      config = TenantConfig.create(defaultConfig);
    });

    it('should update theme', () => {
      // Act
      config.updateTheme('dark');

      // Assert
      expect(config.theme).toBe('dark');
    });

    it('should update locale', () => {
      // Act
      config.updateLocale('en-US');

      // Assert
      expect(config.locale).toBe('en-US');
    });

    it('should update timezone', () => {
      // Act
      config.updateTimezone('America/New_York');

      // Assert
      expect(config.timezone).toBe('America/New_York');
    });

    it('should update branding', () => {
      // Arrange
      const newBranding = {
        brandName: 'Updated Tenant',
        brandDescription: 'Updated description',
        logo: 'https://example.com/new-logo.png',
        colors: {
          primary: '#00FF00',
          secondary: '#FF00FF'
        }
      };

      // Act
      config.updateBranding(newBranding);

      // Assert
      expect(config.branding.brandName).toBe('Updated Tenant');
      expect(config.branding.brandDescription).toBe('Updated description');
      expect(config.branding.logo).toBe('https://example.com/new-logo.png');
      expect(config.branding.colors?.primary).toBe('#00FF00');
    });

    it('should update settings', () => {
      // Arrange
      const newSettings = {
        system: {
          multiLanguage: true,
          defaultLanguage: 'en-US'
        },
        security: {
          sessionTimeout: 60,
          twoFactorAuth: true
        }
      };

      // Act
      config.updateSettings(newSettings);

      // Assert
      expect(config.settings.system?.multiLanguage).toBe(true);
      expect(config.settings.system?.defaultLanguage).toBe('en-US');
      expect(config.settings.security?.sessionTimeout).toBe(60);
      expect(config.settings.security?.twoFactorAuth).toBe(true);
    });
  });

  describe('utility methods', () => {
    let config: TenantConfig;

    beforeEach(() => {
      config = TenantConfig.create(defaultConfig);
    });

    it('should clone config', () => {
      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig).toBeInstanceOf(TenantConfig);
      expect(clonedConfig.features).toEqual(config.features);
      expect(clonedConfig.theme).toBe(config.theme);
      expect(clonedConfig.branding.brandName).toBe(config.branding.brandName);
    });

    it('should merge with another config', () => {
      // Arrange
      const otherConfig = TenantConfig.create({
        features: ['organization'],
        theme: 'dark',
        branding: {
          brandName: 'Other Tenant'
        },
        settings: {
          system: {
            apiAccess: true
          }
        },
        locale: 'en-US',
        timezone: 'UTC'
      });

      // Act
      const mergedConfig = config.merge(otherConfig);

      // Assert
      expect(mergedConfig.features).toEqual(['user_management', 'organization']);
      expect(mergedConfig.theme).toBe('dark');
      expect(mergedConfig.branding.brandName).toBe('Other Tenant');
      expect(mergedConfig.locale).toBe('en-US');
      expect(mergedConfig.timezone).toBe('UTC');
      expect(mergedConfig.settings.system?.apiAccess).toBe(true);
    });

    it('should convert to JSON', () => {
      // Act
      const json = config.toJSON();

      // Assert
      expect(json).toEqual({
        features: ['user_management'],
        theme: 'default',
        branding: {
          brandName: 'Test Tenant',
          brandDescription: 'Test tenant configuration'
        },
        settings: {},
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai'
      });
    });

    it('should create from JSON', () => {
      // Arrange
      const jsonData = {
        features: ['user_management', 'organization'],
        theme: 'light',
        branding: {
          brandName: 'JSON Tenant'
        },
        settings: {},
        locale: 'en-US',
        timezone: 'UTC'
      };

      // Act
      const configFromJson = TenantConfig.fromJSON(jsonData);

      // Assert
      expect(configFromJson).toBeInstanceOf(TenantConfig);
      expect(configFromJson.features).toEqual(['user_management', 'organization']);
      expect(configFromJson.theme).toBe('light');
      expect(configFromJson.branding.brandName).toBe('JSON Tenant');
      expect(configFromJson.locale).toBe('en-US');
      expect(configFromJson.timezone).toBe('UTC');
    });
  });

  describe('immutability', () => {
    it('should maintain immutability when updating', () => {
      // Arrange
      const originalConfig = TenantConfig.create(defaultConfig);
      const originalFeatures = [...originalConfig.features];

      // Act
      originalConfig.enableFeature('organization');

      // Assert
      expect(originalConfig.features).not.toBe(originalFeatures);
      expect(originalConfig.features).toEqual(['user_management', 'organization']);
    });

    it('should maintain immutability when merging', () => {
      // Arrange
      const originalConfig = TenantConfig.create(defaultConfig);
      const otherConfig = TenantConfig.create({
        ...defaultConfig,
        theme: 'dark'
      });

      // Act
      const mergedConfig = originalConfig.merge(otherConfig);

      // Assert
      expect(mergedConfig).not.toBe(originalConfig);
      expect(mergedConfig).not.toBe(otherConfig);
      expect(originalConfig.theme).toBe('default');
      expect(mergedConfig.theme).toBe('dark');
    });
  });

  describe('equality', () => {
    it('should be equal to config with same values', () => {
      // Arrange
      const config1 = TenantConfig.create(defaultConfig);
      const config2 = TenantConfig.create(defaultConfig);

      // Act & Assert
      expect(config1.equals(config2)).toBe(true);
    });

    it('should not be equal to config with different values', () => {
      // Arrange
      const config1 = TenantConfig.create(defaultConfig);
      const config2 = TenantConfig.create({
        ...defaultConfig,
        theme: 'dark'
      });

      // Act & Assert
      expect(config1.equals(config2)).toBe(false);
    });

    it('should not be equal to different object type', () => {
      // Arrange
      const config = TenantConfig.create(defaultConfig);
      const otherObject = { theme: 'default' };

      // Act & Assert
      expect(config.equals(otherObject as unknown)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when creating with invalid features', () => {
      // Arrange
      const invalidConfig = {
        ...defaultConfig,
        features: ['invalid_feature']
      };

      // Act & Assert
      expect(() => TenantConfig.create(invalidConfig))
        .toThrow('无效的功能: invalid_feature');
    });

    it('should throw error when creating with invalid theme', () => {
      // Arrange
      const invalidConfig = {
        ...defaultConfig,
        theme: 'invalid_theme'
      };

      // Act & Assert
      expect(() => TenantConfig.create(invalidConfig))
        .toThrow('无效的主题: invalid_theme');
    });

    it('should throw error when updating with invalid theme', () => {
      // Arrange
      const config = TenantConfig.create(defaultConfig);

      // Act & Assert
      expect(() => config.updateTheme('invalid_theme'))
        .toThrow('无效的主题: invalid_theme');
    });

    it('should throw error when updating with invalid locale', () => {
      // Arrange
      const config = TenantConfig.create(defaultConfig);

      // Act & Assert
      expect(() => config.updateLocale('invalid-locale'))
        .toThrow('无效的语言环境: invalid-locale');
    });

    it('should throw error when updating with invalid timezone', () => {
      // Arrange
      const config = TenantConfig.create(defaultConfig);

      // Act & Assert
      expect(() => config.updateTimezone('Invalid/Timezone'))
        .toThrow('无效的时区: Invalid/Timezone');
    });
  });
});
