import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 租户品牌配置接口
 *
 * @description 定义租户的品牌相关配置
 * 包括Logo、颜色主题等品牌元素
 *
 * @since 1.0.0
 */
export interface TenantBrandingProps {
  /**
   * Logo URL
   * 
   * @description 租户的Logo图片地址
   * 可选字段，为空时使用默认Logo
   */
  logo?: string;

  /**
   * 品牌颜色
   * 
   * @description 租户的品牌颜色配置
   * 键为颜色名称，值为颜色值（如 #FF0000）
   */
  colors?: Record<string, string>;

  /**
   * 品牌名称
   * 
   * @description 租户的品牌名称
   * 用于界面显示和邮件签名等
   */
  brandName?: string;

  /**
   * 品牌描述
   * 
   * @description 租户的品牌描述
   * 用于帮助文档和说明文字
   */
  brandDescription?: string;
}

/**
 * 租户配置属性接口
 *
 * @description 定义租户的完整配置信息
 * 包括功能权限、主题、品牌、设置等
 *
 * @since 1.0.0
 */
export interface TenantConfigProps {
  /**
   * 功能权限列表
   * 
   * @description 租户可以使用的功能列表
   * 包含 'all_features' 表示拥有所有功能
   */
  features: string[];

  /**
   * 主题配置
   * 
   * @description 租户的界面主题
   * 可以是预定义主题或自定义主题
   */
  theme: string;

  /**
   * 品牌配置
   * 
   * @description 租户的品牌相关配置
   */
  branding: TenantBrandingProps;

  /**
   * 自定义设置
   * 
   * @description 租户的自定义配置项
   * 键值对形式，支持任意配置
   */
  settings: Record<string, any>;

  /**
   * 语言配置
   * 
   * @description 租户的默认语言
   * 格式如 'zh-CN', 'en-US' 等
   */
  locale: string;

  /**
   * 时区配置
   * 
   * @description 租户的默认时区
   * 格式如 'Asia/Shanghai', 'UTC' 等
   */
  timezone: string;
}

/**
 * 租户配置值对象
 *
 * @description 封装租户的配置信息
 * 提供配置验证、更新、功能检查等功能
 *
 * ## 业务规则
 *
 * ### 功能权限规则
 * - 功能列表不能为空
 * - 包含 'all_features' 表示拥有所有功能
 * - 功能名称必须符合命名规范
 *
 * ### 主题配置规则
 * - 主题名称不能为空
 * - 支持预定义主题和自定义主题
 * - 主题变更不影响数据完整性
 *
 * ### 品牌配置规则
 * - Logo URL 必须是有效的URL格式
 * - 颜色值必须是有效的颜色格式
 * - 品牌名称和描述用于界面显示
 *
 * @example
 * ```typescript
 * const config = TenantConfig.create({
 *   features: ['basic_user_management', 'basic_organization_management'],
 *   theme: 'default',
 *   branding: {
 *     logo: 'https://example.com/logo.png',
 *     colors: { primary: '#007bff', secondary: '#6c757d' },
 *     brandName: '示例公司'
 *   },
 *   settings: { maxFileSize: 10, enableNotifications: true },
 *   locale: 'zh-CN',
 *   timezone: 'Asia/Shanghai'
 * });
 * 
 * const hasFeature = config.hasFeature('basic_user_management'); // true
 * const newConfig = config.updateSettings({ maxFileSize: 20 });
 * ```
 *
 * @since 1.0.0
 */
export class TenantConfig extends BaseValueObject<TenantConfigProps> {
  /**
   * 私有构造函数
   * 
   * @description 使用工厂方法创建实例
   * 确保数据验证和不变性
   *
   * @param props - 租户配置属性
   */
  private constructor(props: TenantConfigProps) {
    super(props);
    this.validate();
  }

  /**
   * 创建租户配置实例
   *
   * @description 工厂方法，创建并验证租户配置实例
   *
   * @param props - 租户配置属性
   * @returns 租户配置实例
   * @throws {InvalidTenantConfigException} 当配置无效时抛出异常
   *
   * @example
   * ```typescript
   * const config = TenantConfig.create({
   *   features: ['basic_user_management'],
   *   theme: 'default',
   *   branding: { brandName: '示例公司' },
   *   settings: {},
   *   locale: 'zh-CN',
   *   timezone: 'Asia/Shanghai'
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static create(props: TenantConfigProps): TenantConfig {
    return new TenantConfig(props);
  }

  /**
   * 验证租户配置数据
   *
   * @description 验证配置数据是否符合业务规则
   *
   * @throws {InvalidTenantConfigException} 当配置无效时抛出异常
   *
   * @since 1.0.0
   */
  private validate(): void {
    // 验证功能列表
    if (!this.props.features || this.props.features.length === 0) {
      throw new InvalidTenantConfigException('租户配置必须包含功能列表');
    }

    // 验证主题
    if (!this.props.theme || this.props.theme.trim().length === 0) {
      throw new InvalidTenantConfigException('租户配置必须包含主题设置');
    }

    // 验证语言配置
    if (!this.props.locale || this.props.locale.trim().length === 0) {
      throw new InvalidTenantConfigException('租户配置必须包含语言设置');
    }

    // 验证时区配置
    if (!this.props.timezone || this.props.timezone.trim().length === 0) {
      throw new InvalidTenantConfigException('租户配置必须包含时区设置');
    }

    // 验证品牌配置
    if (this.props.branding?.logo) {
      this.validateUrl(this.props.branding.logo, 'Logo URL');
    }

    // 验证颜色配置
    if (this.props.branding?.colors) {
      this.validateColors(this.props.branding.colors);
    }
  }

  /**
   * 验证URL格式
   *
   * @description 验证URL是否符合标准格式
   *
   * @param url - URL字符串
   * @param fieldName - 字段名称
   * @throws {InvalidTenantConfigException} 当URL格式无效时抛出异常
   *
   * @since 1.0.0
   */
  private validateUrl(url: string, fieldName: string): void {
    try {
      new URL(url);
    } catch {
      throw new InvalidTenantConfigException(`${fieldName} 必须是有效的URL格式`);
    }
  }

  /**
   * 验证颜色配置
   *
   * @description 验证颜色值是否符合标准格式
   *
   * @param colors - 颜色配置
   * @throws {InvalidTenantConfigException} 当颜色格式无效时抛出异常
   *
   * @since 1.0.0
   */
  private validateColors(colors: Record<string, string>): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    for (const [name, value] of Object.entries(colors)) {
      if (!colorRegex.test(value)) {
        throw new InvalidTenantConfigException(`颜色 ${name} 的值 ${value} 不是有效的颜色格式`);
      }
    }
  }

  /**
   * 检查是否拥有指定功能
   *
   * @description 检查租户是否拥有指定的功能权限
   * 包含 'all_features' 表示拥有所有功能
   *
   * @param feature - 功能名称
   * @returns 是否拥有该功能
   *
   * @example
   * ```typescript
   * const hasFeature = config.hasFeature('basic_user_management'); // true
   * const hasAllFeatures = config.hasFeature('any_feature'); // true (如果包含 'all_features')
   * ```
   *
   * @since 1.0.0
   */
  public hasFeature(feature: string): boolean {
    return this.props.features.includes(feature) || 
           this.props.features.includes('all_features');
  }

  /**
   * 获取所有功能列表
   *
   * @description 返回租户的功能权限列表副本
   *
   * @returns 功能列表副本
   *
   * @since 1.0.0
   */
  public getFeatures(): string[] {
    return [...this.props.features];
  }

  /**
   * 更新配置
   *
   * @description 创建新的租户配置实例，更新指定配置
   * 遵循值对象不变性原则
   *
   * @param updates - 要更新的配置
   * @returns 新的租户配置实例
   *
   * @example
   * ```typescript
   * const newConfig = config.updateConfig({
   *   theme: 'dark',
   *   settings: { maxFileSize: 20 }
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updateConfig(updates: Partial<TenantConfigProps>): TenantConfig {
    return TenantConfig.create({ ...this.props, ...updates });
  }

  /**
   * 更新功能列表
   *
   * @description 创建新的配置实例，更新功能列表
   *
   * @param features - 新的功能列表
   * @returns 新的租户配置实例
   *
   * @example
   * ```typescript
   * const newConfig = config.updateFeatures(['basic_user_management', 'advanced_analytics']);
   * ```
   *
   * @since 1.0.0
   */
  public updateFeatures(features: string[]): TenantConfig {
    return this.updateConfig({ features });
  }

  /**
   * 更新设置
   *
   * @description 创建新的配置实例，更新自定义设置
   *
   * @param settings - 新的设置
   * @returns 新的租户配置实例
   *
   * @example
   * ```typescript
   * const newConfig = config.updateSettings({ 
   *   maxFileSize: 20, 
   *   enableNotifications: false 
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updateSettings(settings: Record<string, any>): TenantConfig {
    return this.updateConfig({ settings: { ...this.props.settings, ...settings } });
  }

  /**
   * 更新品牌配置
   *
   * @description 创建新的配置实例，更新品牌配置
   *
   * @param branding - 新的品牌配置
   * @returns 新的租户配置实例
   *
   * @example
   * ```typescript
   * const newConfig = config.updateBranding({
   *   logo: 'https://example.com/new-logo.png',
   *   brandName: '新公司名称'
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updateBranding(branding: Partial<TenantBrandingProps>): TenantConfig {
    return this.updateConfig({ 
      branding: { ...this.props.branding, ...branding } 
    });
  }

  /**
   * 获取设置值
   *
   * @description 获取指定设置的当前值
   *
   * @param key - 设置键
   * @param defaultValue - 默认值
   * @returns 设置值或默认值
   *
   * @example
   * ```typescript
   * const maxFileSize = config.getSetting('maxFileSize', 10); // 10
   * const enableNotifications = config.getSetting('enableNotifications', true); // true
   * ```
   *
   * @since 1.0.0
   */
  public getSetting<T>(key: string, defaultValue: T): T {
    return this.props.settings[key] ?? defaultValue;
  }

  /**
   * 获取所有配置信息
   *
   * @description 返回所有配置的副本
   *
   * @returns 配置属性副本
   *
   * @since 1.0.0
   */
  public getAllConfig(): TenantConfigProps {
    return { ...this.props };
  }

  // Getter 方法
  public get features(): string[] { return this.props.features; }
  public get theme(): string { return this.props.theme; }
  public get branding(): TenantBrandingProps { return this.props.branding; }
  public get settings(): Record<string, any> { return this.props.settings; }
  public get locale(): string { return this.props.locale; }
  public get timezone(): string { return this.props.timezone; }
}

/**
 * 无效租户配置异常
 *
 * @description 当租户配置无效时抛出的异常
 *
 * @since 1.0.0
 */
export class InvalidTenantConfigException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTenantConfigException';
  }
}
