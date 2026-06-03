// 宠物成长阶段
export type PetStage = 'egg' | 'baby' | 'teen' | 'adult';

// 宠物属性类型（用于蛋的阶段）
export type PokemonType = 'grass' | 'fire' | 'water' | 'bug' | 'flying' | 'normal' | 'electric' | 'ice' | 'fighting' | 'ghost' | 'rock' | 'dragon';

// 宠物类型
export interface PetType {
  id: string;
  name: string;
  color: string;
  emoji: string;
  pokemonType: PokemonType;
  isCustom?: boolean; // 是否为用户自定义宠物
  stages: {
    egg: string;   // 蛋阶段名称
    baby: string;  // 幼年体（基础形态）
    teen: string;  // 成长体（一阶进化）
    adult: string; // 完全体（二阶进化）
  };
  // 自定义宠物图片（base64 或 URL），仅 isCustom 为 true 时存在
  customImages?: {
    baby?: string;
    teen?: string;
    adult?: string;
  };
}

// 阶段升级历史记录
export interface StageUpgradeRecord {
  stage: PetStage;       // 升到哪个阶段
  upgradedAt: number;    // 升级时间戳（ms）
}

// 学生宠物信息
export interface StudentPet {
  petTypeId: string;
  experience: number;
  stage: PetStage;
  stageHistory?: StageUpgradeRecord[];  // 升级历史（含各阶段达到的时间）
}

// 学生信息
export interface Student {
  id: string;
  name: string;
  nickname?: string; // 昵称（不显示，仅用于加分时搜索）
  pet: StudentPet;
  createdAt: number;
}

// 获取宠物当前阶段的显示名称
export function getStageName(petType: PetType, stage: PetStage): string {
  return petType.stages[stage];
}

// 宠物类型定义 - 宝可梦进化链
export const PET_TYPES: PetType[] = [
  {
    id: 'bulbasaur',
    name: '妙蛙种子',
    color: '#4CAF50',
    emoji: '🌱',
    pokemonType: 'grass',
    stages: {
      egg: '草属性蛋',
      baby: '妙蛙种子',
      teen: '妙蛙草',
      adult: '妙蛙花',
    },
  },
  {
    id: 'charmander',
    name: '小火龙',
    color: '#FF5722',
    emoji: '🔥',
    pokemonType: 'fire',
    stages: {
      egg: '火属性蛋',
      baby: '小火龙',
      teen: '火恐龙',
      adult: '喷火龙',
    },
  },
  {
    id: 'squirtle',
    name: '杰尼龟',
    color: '#2196F3',
    emoji: '💧',
    pokemonType: 'water',
    stages: {
      egg: '水属性蛋',
      baby: '杰尼龟',
      teen: '卡咪龟',
      adult: '水箭龟',
    },
  },
  {
    id: 'caterpie',
    name: '绿毛虫',
    color: '#8BC34A',
    emoji: '🐛',
    pokemonType: 'bug',
    stages: {
      egg: '虫属性蛋',
      baby: '绿毛虫',
      teen: '铁甲蛹',
      adult: '巴大蝶',
    },
  },
  {
    id: 'pidgey',
    name: '波波',
    color: '#9C27B0',
    emoji: '🐦',
    pokemonType: 'flying',
    stages: {
      egg: '飞行属性蛋',
      baby: '波波',
      teen: '比比鸟',
      adult: '大比鸟',
    },
  },
  {
    id: 'chikorita',
    name: '菊草叶',
    color: '#66BB6A',
    emoji: '🌿',
    pokemonType: 'grass',
    stages: {
      egg: '草属性蛋',
      baby: '菊草叶',
      teen: '月桂叶',
      adult: '大竺葵',
    },
  },
  {
    id: 'cyndaquil',
    name: '火球鼠',
    color: '#FF7043',
    emoji: '🔥',
    pokemonType: 'fire',
    stages: {
      egg: '火属性蛋',
      baby: '火球鼠',
      teen: '火岩鼠',
      adult: '火暴兽',
    },
  },
  {
    id: 'torchic',
    name: '火稚鸡',
    color: '#FF9800',
    emoji: '🐔',
    pokemonType: 'fire',
    stages: {
      egg: '火属性蛋',
      baby: '火稚鸡',
      teen: '力壮鸡',
      adult: '火焰鸡',
    },
  },
  {
    id: 'mudkip',
    name: '水跃鱼',
    color: '#039BE5',
    emoji: '🐟',
    pokemonType: 'water',
    stages: {
      egg: '水属性蛋',
      baby: '水跃鱼',
      teen: '沼跃鱼',
      adult: '巨沼怪',
    },
  },
  {
    id: 'sprigatito',
    name: '新叶喵',
    color: '#FF9800',
    emoji: '🐱',
    pokemonType: 'grass',
    stages: {
      egg: '草属性蛋',
      baby: '新叶喵',
      teen: '魔幻假面喵',
      adult: '炽焰咆哮虎',
    },
  },
];

// 成长阶段配置
export const STAGE_CONFIG: Record<PetStage, { name: string; minExp: number; label: string }> = {
  egg: { name: '蛋', minExp: 0, label: '🥚 蛋' },
  baby: { name: '幼年体', minExp: 100, label: '🐣 幼年体' },
  teen: { name: '成长体', minExp: 300, label: '⭐ 成长体' },
  adult: { name: '完全体', minExp: 600, label: '👑 完全体' },
};

// 根据经验值获取成长阶段
export function getStageByExperience(experience: number): PetStage {
  if (experience >= 600) return 'adult';
  if (experience >= 300) return 'teen';
  if (experience >= 100) return 'baby';
  return 'egg';
}

// 根据经验值获取下一阶段所需经验
export function getNextStageExp(experience: number): number | null {
  if (experience < 100) return 100;
  if (experience < 300) return 300;
  if (experience < 600) return 600;
  return null; // 已满级
}

// ── 静态导入蛋图，让 Vite 走模块管道处理 ──
import eggGrass from '../assets/pokemon/egg_grass.png';
import eggFire from '../assets/pokemon/egg_fire.png';
import eggWater from '../assets/pokemon/egg_water.png';
import eggBug from '../assets/pokemon/egg_bug.png';
import eggFlying from '../assets/pokemon/egg_flying.png';
import eggNormal from '../assets/pokemon/egg_normal.png';
import eggElectric from '../assets/pokemon/egg_electric.png';
import eggIce from '../assets/pokemon/egg_ice.png';
import eggFighting from '../assets/pokemon/egg_fighting.png';
import eggGhost from '../assets/pokemon/egg_ghost.png';
import eggRock from '../assets/pokemon/egg_rock.png';
import eggDragon from '../assets/pokemon/egg_dragon.png';
import eggDefault from '../assets/pokemon/egg_default.png';

const EGG_IMAGE_MAP: Record<string, string> = {
  grass: eggGrass,
  fire: eggFire,
  water: eggWater,
  bug: eggBug,
  flying: eggFlying,
  normal: eggNormal,
  electric: eggElectric,
  ice: eggIce,
  fighting: eggFighting,
  ghost: eggGhost,
  rock: eggRock,
  dragon: eggDragon,
  default: eggDefault,
};

// 获取宠物图片路径
export function getPetImagePath(petId: string, stage: PetStage, pokemonType: PokemonType, petType?: PetType): string {
  if (stage === 'egg') {
    return EGG_IMAGE_MAP[pokemonType] || EGG_IMAGE_MAP.default;
  }
  // 如果是自定义宠物且有对应阶段的图片
  if (petType?.isCustom && petType.customImages?.[stage as 'baby' | 'teen' | 'adult']) {
    return petType.customImages[stage as 'baby' | 'teen' | 'adult']!;
  }
  return `./pokemon/${petId}_${stage}.png`;
}
