/**
 * 部门层级值对象单元测试
 *
 * @description 测试部门层级的验证逻辑和业务规则
 *
 * @since 1.0.0
 */

import { DepartmentLevel } from './department-level.vo';

describe('DepartmentLevel', () => {
  describe('创建', () => {
    it('应该成功创建有效的部门层级', () => {
      const level1 = DepartmentLevel.create(1);
      expect(level1.level).toBe(1);

      const level5 = DepartmentLevel.create(5);
      expect(level5.level).toBe(5);

      const level8 = DepartmentLevel.create(8);
      expect(level8.level).toBe(8);
    });

    it('应该从字符串创建层级', () => {
      const level1 = DepartmentLevel.fromString('LEVEL_1');
      expect(level1.level).toBe(1);

      const level5 = DepartmentLevel.fromString('LEVEL_5');
      expect(level5.level).toBe(5);
    });

    it('应该创建根层级', () => {
      const root = DepartmentLevel.root();
      expect(root.level).toBe(1);
    });
  });

  describe('验证', () => {
    it('应该拒绝无效的层级数值', () => {
      expect(() => DepartmentLevel.create(0)).toThrow();
      expect(() => DepartmentLevel.create(-1)).toThrow();
      expect(() => DepartmentLevel.create(20)).toThrow();
    });

    it('应该拒绝无效的层级字符串', () => {
      expect(() => DepartmentLevel.fromString('INVALID')).toThrow('无效的层级字符串');
      expect(() => DepartmentLevel.fromString('level_1')).toThrow();
      expect(() => DepartmentLevel.fromString('')).toThrow();
    });

    it('应该成功创建有效的层级', () => {
      const level = DepartmentLevel.create(1);
      expect(level).toBeDefined();
      expect(level.level).toBe(1);
    });
  });

  describe('层级操作', () => {
    it('应该判断是否为根层级', () => {
      const root = DepartmentLevel.create(1);
      const nonRoot = DepartmentLevel.create(2);

      expect(root.isRoot()).toBe(true);
      expect(nonRoot.isRoot()).toBe(false);
    });

    it('应该判断是否可以有子部门', () => {
      const level1 = DepartmentLevel.create(1);
      const level7 = DepartmentLevel.create(7);

      expect(level1.canHaveChildren()).toBe(true);
      // 是否能有子部门取决于配置的最大层级
    });

    it('应该获取下一层级', () => {
      const level1 = DepartmentLevel.create(1);
      const level2 = level1.getNextLevel();

      expect(level2.level).toBe(2);
    });

    it('应该获取上一层级', () => {
      const level2 = DepartmentLevel.create(2);
      const level1 = level2.getParentLevel();

      expect(level1.level).toBe(1);
    });

    it('应该在根层级时无法获取上一层级', () => {
      const root = DepartmentLevel.create(1);
      expect(() => root.getParentLevel()).toThrow();
    });

    it('应该在最大层级时无法获取下一层级', () => {
      const maxLevel = DepartmentLevel.create(8);
      expect(() => maxLevel.getNextLevel()).toThrow();
    });
  });

  describe('转换', () => {
    it('应该转换为字符串', () => {
      const level1 = DepartmentLevel.create(1);
      expect(level1.toString()).toBe('LEVEL_1');

      const level5 = DepartmentLevel.create(5);
      expect(level5.toString()).toBe('LEVEL_5');
    });

    it('应该转换为JSON', () => {
      const level = DepartmentLevel.create(3);
      const json = level.toJSON();

      expect(json).toHaveProperty('level');
      expect(json['level']).toBe(3);
    });
  });

  describe('相等性', () => {
    it('应该正确比较两个层级', () => {
      const level1a = DepartmentLevel.create(1);
      const level1b = DepartmentLevel.create(1);
      const level2 = DepartmentLevel.create(2);

      expect(level1a.equals(level1b)).toBe(true);
      expect(level1a.equals(level2)).toBe(false);
    });
  });
});

