import { useState, useEffect, useRef, useCallback } from 'react';

// ── 类型定义 ──────────────────────────────────────────────────────
export interface Faction {
  id: string;
  name: string;            // 阵营名称，如"红队"、"蓝队"
  color: string;           // 阵营颜色
  mascotPetTypeId: string; // 代表宝可梦 ID（吉祥物）
  studentNames: string[];  // 阵营内学生姓名列表
}

// 每个班级对应的阵营配置
export type ClassFactionsMap = Record<string, Faction[]>;

const STORAGE_KEY = 'pet-learning-system-factions';

// 阵营预设颜色
export const FACTION_COLORS = [
  '#EF4444', // 红
  '#3B82F6', // 蓝
  '#10B981', // 绿
  '#F59E0B', // 黄
  '#8B5CF6', // 紫
  '#EC4899', // 粉
  '#06B6D4', // 青
  '#F97316', // 橙
];

// 阵营默认名称
export const FACTION_NAMES = [
  '烈焰队', '激流队', '青草队', '雷霆队',
  '岩石队', '暗影队', '冰霜队', '龙之队',
];

let factionIdCounter = 0;

function genId(): string {
  factionIdCounter++;
  return `faction-${Date.now()}-${factionIdCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadFromStorage(): ClassFactionsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ClassFactionsMap;
  } catch {
    return {};
  }
}

export function useFactions() {
  const [classFactions, setClassFactions] = useState<ClassFactionsMap>({});
  const [loaded, setLoaded] = useState(false);
  const latestRef = useRef<ClassFactionsMap>({});
  const mountedRef = useRef(true);

  // 初始加载
  useEffect(() => {
    const data = loadFromStorage();
    latestRef.current = data;
    setClassFactions(data);
    setLoaded(true);
    return () => { mountedRef.current = false; };
  }, []);

  // 持久化
  const persist = useCallback((data: ClassFactionsMap) => {
    latestRef.current = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save factions', e);
    }
  }, []);

  // 获取某班级的阵营列表
  const getFactions = useCallback((classId: string): Faction[] => {
    return classFactions[classId] || [];
  }, [classFactions]);

  // 自动分组：将班级学生均匀分到 N 个阵营
  const autoDivide = useCallback((classId: string, studentNames: string[], count: number, petTypeId: string) => {
    if (count < 2 || count > 8) return;
    // 打乱顺序（Fisher-Yates）
    const shuffled = [...studentNames];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // 轮流分配
    const groups: string[][] = Array.from({ length: count }, () => []);
    shuffled.forEach((name, idx) => {
      groups[idx % count].push(name);
    });

    const factions: Faction[] = groups.map((names, i) => ({
      id: genId(),
      name: FACTION_NAMES[i] || `队伍${i + 1}`,
      color: FACTION_COLORS[i] || FACTION_COLORS[i % FACTION_COLORS.length],
      mascotPetTypeId: petTypeId,
      studentNames: names,
    }));

    const newData = { ...latestRef.current, [classId]: factions };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 手动创建一个空阵营
  const addFaction = useCallback((classId: string, petTypeId: string) => {
    const existing = latestRef.current[classId] || [];
    const idx = existing.length;
    const faction: Faction = {
      id: genId(),
      name: FACTION_NAMES[idx] || `队伍${idx + 1}`,
      color: FACTION_COLORS[idx] || FACTION_COLORS[idx % FACTION_COLORS.length],
      mascotPetTypeId: petTypeId,
      studentNames: [],
    };
    const newData = { ...latestRef.current, [classId]: [...existing, faction] };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 删除阵营
  const removeFaction = useCallback((classId: string, factionId: string) => {
    const existing = latestRef.current[classId] || [];
    const newData = { ...latestRef.current, [classId]: existing.filter(f => f.id !== factionId) };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 重命名阵营
  const renameFaction = useCallback((classId: string, factionId: string, newName: string) => {
    const existing = latestRef.current[classId] || [];
    const newData = {
      ...latestRef.current,
      [classId]: existing.map(f => f.id === factionId ? { ...f, name: newName } : f),
    };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 更新阵营颜色
  const updateFactionColor = useCallback((classId: string, factionId: string, color: string) => {
    const existing = latestRef.current[classId] || [];
    const newData = {
      ...latestRef.current,
      [classId]: existing.map(f => f.id === factionId ? { ...f, color } : f),
    };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 设置阵营吉祥物
  const setMascot = useCallback((classId: string, factionId: string, petTypeId: string) => {
    const existing = latestRef.current[classId] || [];
    const newData = {
      ...latestRef.current,
      [classId]: existing.map(f => f.id === factionId ? { ...f, mascotPetTypeId: petTypeId } : f),
    };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 将学生移动到另一个阵营
  const moveStudent = useCallback((classId: string, studentName: string, fromFactionId: string, toFactionId: string) => {
    const existing = latestRef.current[classId] || [];
    const newData = {
      ...latestRef.current,
      [classId]: existing.map(f => {
        if (f.id === fromFactionId) {
          return { ...f, studentNames: f.studentNames.filter(n => n !== studentName) };
        }
        if (f.id === toFactionId) {
          return { ...f, studentNames: f.studentNames.includes(studentName) ? f.studentNames : [...f.studentNames, studentName] };
        }
        return f;
      }),
    };
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  // 清空某班级的所有阵营
  const clearFactions = useCallback((classId: string) => {
    const newData = { ...latestRef.current };
    delete newData[classId];
    persist(newData);
    setClassFactions(newData);
  }, [persist]);

  return {
    classFactions,
    loaded,
    getFactions,
    autoDivide,
    addFaction,
    removeFaction,
    renameFaction,
    updateFactionColor,
    setMascot,
    moveStudent,
    clearFactions,
  };
}
