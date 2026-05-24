import { useState, useEffect, useCallback } from 'react';
import type { Student, PetStage } from '@/types/pet';
import { getStageByExperience } from '@/types/pet';

const STORAGE_KEY = 'pet-learning-system-data';

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setStudents(JSON.parse(data));
      }
    } catch {
      console.error('Failed to load data from localStorage');
    }
    setLoaded(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    }
  }, [students, loaded]);

  // 批量添加学生
  const addStudents = useCallback((names: string[], petTypeId: string) => {
    const newStudents: Student[] = names.map(name => ({
      id: generateId(),
      name,
      pet: {
        petTypeId,
        experience: 0,
        stage: 'egg' as PetStage,
      },
      createdAt: Date.now(),
    }));

    setStudents(prev => {
      // 去重：过滤已存在的学生名
      const existingNames = new Set(prev.map(s => s.name));
      const filtered = newStudents.filter(s => !existingNames.has(s.name));
      return [...prev, ...filtered];
    });

    return newStudents.length;
  }, []);

  // 为学生加分
  const addPoints = useCallback((studentId: string, points: number) => {
    setStudents(prev => prev.map(student => {
      if (student.id !== studentId) return student;
      const newExp = student.pet.experience + points;
      const newStage = getStageByExperience(newExp);
      return {
        ...student,
        pet: {
          ...student.pet,
          experience: newExp,
          stage: newStage,
        },
      };
    }));
  }, []);

  // 批量加分
  const batchAddPoints = useCallback((studentIds: string[], points: number) => {
    setStudents(prev => prev.map(student => {
      if (!studentIds.includes(student.id)) return student;
      const newExp = student.pet.experience + points;
      const newStage = getStageByExperience(newExp);
      return {
        ...student,
        pet: {
          ...student.pet,
          experience: newExp,
          stage: newStage,
        },
      };
    }));
  }, []);

  // 批量分配宠物
  const batchAssignPet = useCallback((studentIds: string[], petTypeId: string) => {
    setStudents(prev => prev.map(student => {
      if (!studentIds.includes(student.id)) return student;
      const currentExp = student.pet.experience;
      const currentStage = getStageByExperience(currentExp);
      return {
        ...student,
        pet: {
          ...student.pet,
          petTypeId,
          stage: currentStage,
        },
      };
    }));
  }, []);

  // 删除学生
  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  }, []);

  // 按名字查找学生
  const findStudentsByName = useCallback((names: string[]): Student[] => {
    const nameSet = new Set(names.map(n => n.trim()));
    return students.filter(s => nameSet.has(s.name));
  }, [students]);

  // 按名字查找学生ID
  const findStudentIdsByName = useCallback((names: string[]): string[] => {
    return findStudentsByName(names).map(s => s.id);
  }, [findStudentsByName]);

  // 修改宠物类型
  const changePetType = useCallback((studentId: string, petTypeId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id !== studentId) return student;
      return {
        ...student,
        pet: {
          ...student.pet,
          petTypeId,
        },
      };
    }));
  }, []);

  // 修改学生姓名
  const renameStudent = useCallback((studentId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return false;
    setStudents(prev => {
      // 检查姓名是否与其他学生重复
      const duplicate = prev.some(s => s.id !== studentId && s.name === trimmedName);
      if (duplicate) return prev;
      return prev.map(student =>
        student.id === studentId ? { ...student, name: trimmedName } : student
      );
    });
    return true;
  }, []);

  // 清空所有数据
  const clearAll = useCallback(() => {
    setStudents([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    students,
    loaded,
    addStudents,
    addPoints,
    batchAddPoints,
    batchAssignPet,
    deleteStudent,
    renameStudent,
    findStudentsByName,
    findStudentIdsByName,
    changePetType,
    clearAll,
  };
}
