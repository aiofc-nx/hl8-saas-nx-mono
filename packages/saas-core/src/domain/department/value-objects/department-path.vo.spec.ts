/**
 * 部门路径值对象单元测试
 *
 * @description 测试部门路径的验证逻辑和业务规则
 *
 * @since 1.0.0
 */

import { DepartmentPath } from './department-path.vo';

describe('DepartmentPath', () => {
  describe('创建', () => {
    it('应该成功创建有效的部门路径', () => {
      const path = DepartmentPath.create('/1');
      expect(path.value).toBe('/1');

      const childPath = DepartmentPath.create('/1/2');
      expect(childPath.value).toBe('/1/2');

      const deepPath = DepartmentPath.create('/1/2/3/4');
      expect(deepPath.value).toBe('/1/2/3/4');
    });

    it('应该创建根路径', () => {
      const root = DepartmentPath.root('root-id');
      expect(root.value).toContain('root-id');
    });
  });

  describe('验证', () => {
    it('应该成功创建有效的路径', () => {
      const path = DepartmentPath.create('/1/2');
      expect(path).toBeDefined();
      expect(path.value).toBe('/1/2');
    });
  });

  describe('路径操作', () => {
    it('应该判断是否为根路径', () => {
      const root = DepartmentPath.root('1');
      const childPath = DepartmentPath.create('/1/2');

      expect(root.isRoot()).toBe(true);
      expect(childPath.isRoot()).toBe(false);
    });

    it('应该获取路径深度', () => {
      const level1 = DepartmentPath.create('/1');
      const level3 = DepartmentPath.create('/1/2/3');

      expect(level1.getDepth()).toBe(1);
      expect(level3.getDepth()).toBe(3);
    });

    it('应该获取路径段', () => {
      const path = DepartmentPath.create('/1/2/3');
      const segments = path.getSegments();

      expect(segments).toBeDefined();
      expect(segments.length).toBe(3);
    });

    it('应该获取祖先路径', () => {
      const path = DepartmentPath.create('/1/2/3');
      const ancestors = path.getAncestors();

      expect(ancestors).toBeDefined();
      expect(ancestors.length).toBeGreaterThan(0);
    });

    it('应该获取当前ID', () => {
      const path = DepartmentPath.create('/1/2/3');
      const currentId = path.getCurrentId();

      expect(currentId).toBe('3');
    });

    it('应该获取父ID', () => {
      const path = DepartmentPath.create('/1/2/3');
      const parentId = path.getParentId();

      expect(parentId).toBe('2');
    });

    it('应该获取根ID', () => {
      const path = DepartmentPath.create('/1/2/3');
      const rootId = path.getRootId();

      expect(rootId).toBe('1');
    });

    it('应该判断是否有指定祖先', () => {
      const path = DepartmentPath.create('/1/2/3');
      
      expect(path.hasAncestor('1')).toBe(true);
      expect(path.hasAncestor('2')).toBe(true);
      expect(path.hasAncestor('999')).toBe(false);
    });

    it('应该判断是否为后代路径', () => {
      const parent = DepartmentPath.create('/1');
      const child = DepartmentPath.create('/1/2');

      expect(child.isDescendantOf(parent)).toBe(true);
      expect(parent.isDescendantOf(child)).toBe(false);
    });

    it('应该获取父路径', () => {
      const child = DepartmentPath.create('/1/2/3');
      const parent = child.getParentPath();

      expect(parent).toBeDefined();
      expect(parent?.value).toContain('2');
    });
  });

  describe('转换', () => {
    it('应该转换为字符串', () => {
      const path = DepartmentPath.create('/1/2');
      expect(path.toString()).toBe('/1/2');
    });

    it('应该转换为JSON', () => {
      const path = DepartmentPath.create('/1/2');
      const json = path.toJSON();

      expect(json).toHaveProperty('value');
      expect(json['value']).toBe('/1/2');
    });
  });

  describe('相等性', () => {
    it('应该正确比较两个路径', () => {
      const path1a = DepartmentPath.create('/1/2');
      const path1b = DepartmentPath.create('/1/2');
      const path2 = DepartmentPath.create('/1/3');

      expect(path1a.equals(path1b)).toBe(true);
      expect(path1a.equals(path2)).toBe(false);
    });
  });
});

