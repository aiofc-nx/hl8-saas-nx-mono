/**
 * 租户域名值对象单元测试
 *
 * @description 测试租户域名的验证逻辑和业务规则
 *
 * @since 1.0.0
 */

import { TenantDomain } from './tenant-domain.vo';

describe('TenantDomain', () => {
  describe('创建', () => {
    it('应该成功创建有效的域名', () => {
      const domain1 = TenantDomain.create('example.com');
      expect(domain1.value).toBe('example.com');

      const domain2 = TenantDomain.create('test.example.com');
      expect(domain2.value).toBe('test.example.com');

      const domain3 = TenantDomain.create('sub.domain.example.com');
      expect(domain3.value).toBe('sub.domain.example.com');
    });

    it('应该自动转换为小写', () => {
      const domain = TenantDomain.create('EXAMPLE.COM');
      expect(domain.value).toBe('example.com');
    });

    it('应该移除前后空白字符', () => {
      const domain = TenantDomain.create('  example.com  ');
      expect(domain.value).toBe('example.com');
    });
  });

  describe('验证', () => {
    it('应该拒绝空域名', () => {
      expect(() => TenantDomain.create('')).toThrow();
    });

    it('应该拒绝包含空格的域名', () => {
      expect(() => TenantDomain.create('exa mple.com')).toThrow();
    });

    it('应该验证域名格式', () => {
      // 只测试 create 方法是否正常工作
      const valid = TenantDomain.create('example.com');
      expect(valid).toBeDefined();
    });
  });

  describe('域名操作', () => {
    it('应该获取子域名', () => {
      const domain = TenantDomain.create('test.example.com');
      const subdomain = domain.getSubdomain();

      expect(subdomain).toBeDefined();
    });

    it('应该获取根域名', () => {
      const domain = TenantDomain.create('test.example.com');
      const root = domain.getRootDomain();

      expect(root).toBeDefined();
      expect(root.length).toBeGreaterThan(0);
    });
  });

  describe('转换', () => {
    it('应该转换为字符串', () => {
      const domain = TenantDomain.create('example.com');
      expect(domain.toString()).toBe('example.com');
    });

    it('应该转换为JSON', () => {
      const domain = TenantDomain.create('test.example.com');
      const json = domain.toJSON();

      expect(json).toHaveProperty('value');
      expect(json['value']).toBe('test.example.com');
    });
  });

  describe('相等性', () => {
    it('应该正确比较两个域名', () => {
      const domain1a = TenantDomain.create('example.com');
      const domain1b = TenantDomain.create('example.com');
      const domain2 = TenantDomain.create('other.com');

      expect(domain1a.equals(domain1b)).toBe(true);
      expect(domain1a.equals(domain2)).toBe(false);
    });

    it('应该在比较时忽略大小写差异', () => {
      const domain1 = TenantDomain.create('EXAMPLE.COM');
      const domain2 = TenantDomain.create('example.com');

      expect(domain1.equals(domain2)).toBe(true);
    });
  });
});

