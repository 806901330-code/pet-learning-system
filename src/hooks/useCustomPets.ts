import { useState, useEffect, useCallback } from 'react';
import type { PetType, PokemonType } from '@/types/pet';

const CUSTOM_PETS_KEY = 'pet-learning-system-custom-pets';

const EGG_COLORS: Record<PokemonType, string> = {
  grass: '#4CAF50',
  fire: '#FF5722',
  water: '#2196F3',
  bug: '#8BC34A',
  flying: '#9C27B0',
  normal: '#FF9800',
  electric: '#FFC107',
  ice: '#4FC3F7',
  fighting: '#E53935',
  ghost: '#8E24AA',
  rock: '#8D6E63',
  dragon: '#5E35B1',
};

const EGG_LABELS: Record<PokemonType, string> = {
  grass: '🟢 草属性蛋',
  fire: '🔴 火属性蛋',
  water: '🔵 水属性蛋',
  bug: '🟢 虫属性蛋',
  flying: '🟣 飞行属性蛋',
  normal: '🟠 普通属性蛋',
  electric: '⚡ 电属性蛋',
  ice: '❄️ 冰属性蛋',
  fighting: '👊 格斗属性蛋',
  ghost: '👻 幽灵属性蛋',
  rock: '🪨 岩石属性蛋',
  dragon: '🐉 龙属性蛋',
};

function generateId(): string {
  return 'custom_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export { EGG_COLORS, EGG_LABELS };

export function useCustomPets() {
  const [customPets, setCustomPets] = useState<PetType[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 从 localStorage 加载
  useEffect(() => {
    try {
      const data = localStorage.getItem(CUSTOM_PETS_KEY);
      if (data) {
        setCustomPets(JSON.parse(data));
      }
    } catch {
      console.error('Failed to load custom pets');
    }
    setLoaded(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CUSTOM_PETS_KEY, JSON.stringify(customPets));
    }
  }, [customPets, loaded]);

  // 创建自定义宠物
  const createCustomPet = useCallback((
    name: string,
    eggType: PokemonType,
    babyImage: string | null,
    teenImage: string | null,
    adultImage: string | null,
    babyName?: string,
    teenName?: string,
    adultName?: string,
    color?: string,
  ) => {
    const id = generateId();
    const petColor = color || EGG_COLORS[eggType];

    const newPet: PetType = {
      id,
      name,
      color: petColor,
      emoji: '✨',
      pokemonType: eggType,
      isCustom: true,
      stages: {
        egg: EGG_LABELS[eggType].split(' ')[1],
        baby: babyName || name,
        teen: teenName || `${name}·成长体`,
        adult: adultName || `${name}·完全体`,
      },
      customImages: {
        baby: babyImage || undefined,
        teen: teenImage || undefined,
        adult: adultImage || undefined,
      },
    };

    setCustomPets(prev => [...prev, newPet]);
    return newPet;
  }, []);

  // 删除自定义宠物
  const deleteCustomPet = useCallback((petId: string) => {
    setCustomPets(prev => prev.filter(p => p.id !== petId));
  }, []);

  return {
    customPets,
    loaded,
    createCustomPet,
    deleteCustomPet,
  };
}
