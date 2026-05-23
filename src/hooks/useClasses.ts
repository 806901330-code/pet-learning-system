import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pet-learning-system-classes';

// 班级数据类型
export interface ClassGroup {
  id: string;
  name: string;          // 班级名称，可自定义
  studentNames: string[]; // 班级内学生姓名列表
  color: string;         // 班级颜色标识
  createdAt: number;
}

// 预设班级颜色
export const CLASS_COLORS = [
  '#6366f1', // 紫蓝
  '#f59e0b', // 琥珀
  '#10b981', // 翠绿
  '#ef4444', // 红色
  '#3b82f6', // 蓝色
  '#ec4899', // 粉红
  '#8b5cf6', // 紫色
  '#14b8a6', // 青绿
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useClasses() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 从 localStorage 加载
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setClasses(JSON.parse(data));
      }
    } catch {
      console.error('Failed to load classes from localStorage');
    }
    setLoaded(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    }
  }, [classes, loaded]);

  // 创建班级
  const createClass = useCallback((name: string, studentNames: string[] = []) => {
    const usedColors = classes.map(c => c.color);
    const color = CLASS_COLORS.find(c => !usedColors.includes(c)) || CLASS_COLORS[classes.length % CLASS_COLORS.length];
    const newClass: ClassGroup = {
      id: generateId(),
      name: name.trim(),
      studentNames: [...new Set(studentNames.map(n => n.trim()).filter(Boolean))],
      color,
      createdAt: Date.now(),
    };
    setClasses(prev => [...prev, newClass]);
    return newClass;
  }, [classes]);

  // 更新班级名称
  const renameClass = useCallback((classId: string, newName: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, name: newName.trim() } : c
    ));
  }, []);

  // 更新班级颜色
  const updateClassColor = useCallback((classId: string, color: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, color } : c
    ));
  }, []);

  // 批量导入学生到班级（覆盖或追加）
  const importStudentsToClass = useCallback((classId: string, studentNames: string[], mode: 'replace' | 'append' = 'replace') => {
    const newNames = [...new Set(studentNames.map(n => n.trim()).filter(Boolean))];
    setClasses(prev => prev.map(c => {
      if (c.id !== classId) return c;
      const mergedNames = mode === 'append'
        ? [...new Set([...c.studentNames, ...newNames])]
        : newNames;
      return { ...c, studentNames: mergedNames };
    }));
  }, []);

  // 从班级中移除学生
  const removeStudentFromClass = useCallback((classId: string, studentName: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId
        ? { ...c, studentNames: c.studentNames.filter(n => n !== studentName) }
        : c
    ));
  }, []);

  // 删除班级
  const deleteClass = useCallback((classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  }, []);

  // 查找学生所在班级
  const getStudentClass = useCallback((studentName: string): ClassGroup | undefined => {
    return classes.find(c => c.studentNames.includes(studentName));
  }, [classes]);

  return {
    classes,
    loaded,
    createClass,
    renameClass,
    updateClassColor,
    importStudentsToClass,
    removeStudentFromClass,
    deleteClass,
    getStudentClass,
  };
}
