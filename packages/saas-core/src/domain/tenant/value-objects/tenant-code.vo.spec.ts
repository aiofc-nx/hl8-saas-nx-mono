/**
 * 租户代码值对象单元测试
 *
 * @description 测试租户代码的验证逻辑和业务规则
 *
 * @since 1.0.0
 */

import { TenantCode } from './tenant-code.vo';

describe('TenantCode', () => {
  describe('创建', () => {
    it('应该成功创建有效的租户代码', () => {
      const code1 = TenantCode.create('abc');
      expect(code1.value).toBe('abc');

      const code2 = TenantCode.create('company2024');
      expect(code2.value).toBe('company2024');

      const code3 = TenantCode.create('testcorp001');
      expect(code3.value).toBe('testcorp001');
    });

    it('应该成功创建大写字母的代码并转换为小写', () => {
      const code = TenantCode.create('abc123');
      expect(code.value).toBe('abc123');
    });
  });

  describe('验证', () => {
    it('应该拒绝过短的代码', () => {
      expect(() => TenantCode.create('ab')).toThrow('租户代码');
    });

    it('应该拒绝过长的代码', () => {
      const longCode = 'a'.repeat(21);
      expect(() => TenantCode.create(longCode)).toThrow('租户代码');
    });

    it('应该拒绝包含特殊字符的代码', () => {
      expect(() => TenantCode.create('test-code')).toThrow('租户代码');
      expect(() => TenantCode.create('test_code')).toThrow('租户代码');
      expect(() => TenantCode.create('test code')).toThrow('租户代码');
      expect(() => TenantCode.create('test@code')).toThrow('租户代码');
    });

    it('应该拒绝空代码', () => {
      expect(() => TenantCode.create('')).toThrow();
      expect(() => TenantCode.create('   ')).toThrow();
    });

    it('应该验证代码是否有效', () => {
      expect(TenantCode.isValid('abc123')).toBe(true);
      expect(TenantCode.isValid('company')).toBe(true);
      expect(TenantCode.isValid('test2024')).toBe(true);

      expect(TenantCode.isValid('ab')).toBe(false);
      expect(TenantCode.isValid('test-code')).toBe(false);
      expect(TenantCode.isValid('')).toBe(false);
    });
  });

  describe('业务规则', () => {
    it('应该成功创建无空白字符的代码', () => {
      const code = TenantCode.create('test123');
      expect(code.value).toBe('test123');
    });

    it('应该支持纯字母代码', () => {
      const code = TenantCode.create('testcode');
      expect(code.value).toBe('testcode');
    });

    it('应该支持字母数字混合代码', () => {
      const code = TenantCode.create('test2024');
      expect(code.value).toBe('test2024');
    });

    it('应该支持纯数字代码', () => {
      const code = TenantCode.create('123456');
      expect(code.value).toBe('123456');
    });
  });

  describe('转换', () => {
    it('应该转换为字符串', () => {
      const code = TenantCode.create('test123');
      expect(code.toString()).toBe('test123');
    });

    it('应该转换为JSON', () => {
      const code = TenantCode.create('tenant001');
      const json = code.toJSON();

      expect(json).toHaveProperty('value');
      expect(json['value']).toBe('tenant001');
    });
  });

  describe('相等性', () => {
    it('应该正确比较两个租户代码', () => {
      const code1a = TenantCode.create('test123');
      const code1b = TenantCode.create('test123');
      const code2 = TenantCode.create('other456');

      expect(code1a.equals(code1b)).toBe(true);
      expect(code1a.equals(code2)).toBe(false);
    });

    it('应该正确比较相同的租户代码', () => {
      const code1 = TenantCode.create('abc123');
      const code2 = TenantCode.create('abc123');

      expect(code1.equals(code2)).toBe(true);
    });
  });
});

