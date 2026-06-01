import { useState } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import { StudentCard } from '@/components/StudentCard';
import type { Student, PetType } from '@/types/pet';
import { PET_TYPES } from '@/types/pet';

interface StudentManagementProps {
  students: Student[];
  petTypes: PetType[];
  onAddStudents: (names: string[], petTypeId: string) => number;
  onAddPoints: (studentId: string, points: number) => void;
  onDeleteStudent: (studentId: string) => void;
  onRenameStudent: (studentId: string, newName: string) => boolean;
  onSetNickname?: (studentId: string, nickname: string) => void;
}

export function StudentManagement({
  students, petTypes, onAddStudents, onAddPoints,
  onDeleteStudent, onRenameStudent, onSetNickname,
}: StudentManagementProps) {
  const [showImport, setShowImport] = useState(false);
  const [selectedPet, setSelectedPet] = useState(PET_TYPES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const handleImport = (names: string[]) => {
    onAddStudents(names, selectedPet);
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q && !stageFilter) return true;
    let match = true;
    if (q) {
      match = s.name.toLowerCase().includes(q) || (s.nickname && s.nickname.toLowerCase().includes(q));
    }
    if (stageFilter) {
      match = match && s.pet.stage === stageFilter;
    }
    return match;
  });

  const stageCount = {
    egg: students.filter((s) => s.pet.stage === 'egg').length,
    baby: students.filter((s) => s.pet.stage === 'baby').length,
    teen: students.filter((s) => s.pet.stage === 'teen').length,
    adult: students.filter((s) => s.pet.stage === 'adult').length,
  };

  const stageStats = [
    { emoji: '🥚', label: '蛋', count: stageCount.egg, color: '#FF9800' },
    { emoji: '🐣', label: '幼年', count: stageCount.baby, color: '#3D7DCA' },
    { emoji: '⭐', label: '成长', count: stageCount.teen, color: '#9C27B0' },
    { emoji: '👑', label: '完全', count: stageCount.adult, color: '#EE1515' },
  ];

  return (
    <div className="space-y-6">
      {/* ── 顶部操作栏 · 游戏菜单风格 ── */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="game-btn game-btn-yellow text-xs px-3 py-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            导入训练家
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-primary/60 font-display uppercase tracking-wider whitespace-nowrap">
              初始精灵
            </span>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-40 h-10 text-sm font-bold border-2 border-primary/20 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id} className="font-semibold">
                    {pet.emoji} {pet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── 阶段筛选按钮 · 铺满中间空间 ── */}
        <div className="flex flex-1 justify-center gap-2">
          {stageStats.map((stat) => {
            const stageKey = stat.label === '蛋' ? 'egg' : stat.label === '幼年' ? 'baby' : stat.label === '成长' ? 'teen' : 'adult';
            const isActive = stageFilter === stageKey;
            const cardStyle = isActive
              ? {
                  background: `linear-gradient(135deg, ${stat.color}18, ${stat.color}08)`,
                  border: `2px solid ${stat.color}`,
                  boxShadow: `0 0 0 3px ${stat.color}30, 0 4px 16px ${stat.color}20`,
                }
              : {
                  background: `linear-gradient(135deg, ${stat.color}12, ${stat.color}06)`,
                  border: `2px solid ${stat.color}25`,
                };
            return (
              <div
                key={stat.label}
                onClick={() => setStageFilter(isActive ? null : stageKey)}
                className="relative overflow-hidden rounded-xl py-1.5 px-2 transition-all hover:scale-[1.02] cursor-pointer flex-1"
                style={cardStyle}
              >
                <div className="relative flex items-center justify-center gap-1">
                  <div className="text-lg shrink-0">{stat.emoji}</div>
                  <div>
                    <div className="text-xs font-extrabold font-display leading-none" style={{ color: stat.color }}>
                      {stat.count}
                    </div>
                    <div className="text-xs font-extrabold leading-none mt-0.5" style={{ color: `${stat.color}99` }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="搜索姓名或昵称..."
            className="game-input pl-10 pr-4 py-2 w-52"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 训练家列表 · 游戏卡片网格 ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-game text-primary tracking-tight">
              精灵训练家
            </h2>
            {stageFilter && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold font-display border-2"
                style={{
                  background: `${['#FF9800', '#3D7DCA', '#9C27B0', '#EE1515'][['egg','baby','teen','adult'].indexOf(stageFilter)]}12`,
                  color: ['#FF9800', '#3D7DCA', '#9C27B0', '#EE1515'][['egg','baby','teen','adult'].indexOf(stageFilter)],
                  borderColor: `${['#FF9800', '#3D7DCA', '#9C27B0', '#EE1515'][['egg','baby','teen','adult'].indexOf(stageFilter)]}30`,
                }}
              >
                {stageFilter === 'egg' ? '🥚蛋' : stageFilter === 'baby' ? '🐣幼年' : stageFilter === 'teen' ? '⭐成长' : '👑完全'} 筛选中
                <button
                  onClick={(e) => { e.stopPropagation(); setStageFilter(null); }}
                  className="ml-0.5 hover:opacity-60 transition-opacity leading-none"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-xl text-primary text-[10px] font-extrabold font-display border-2"
              style={{ backgroundColor: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-soft)' }}>
              {filteredStudents.length} 人
            </span>
          </div>
          <p className="text-[10px] font-semibold text-primary/40 hidden sm:block">
            点击卡片管理训练家
          </p>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="game-card text-center py-16">
            <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto mb-4 opacity-10">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-primary-dark)" strokeWidth="4"/>
              <path d="M4 50 Q50 73 96 50" fill="#EE1515" stroke="var(--color-primary-dark)" strokeWidth="4"/>
              <line x1="4" y1="50" x2="96" y2="50" stroke="var(--color-primary-dark)" strokeWidth="4"/>
              <circle cx="50" cy="50" r="10" fill="white" stroke="var(--color-primary-dark)" strokeWidth="4"/>
              <circle cx="50" cy="50" r="4" fill="var(--color-primary-dark)"/>
            </svg>
            <p className="text-sm font-extrabold text-primary/50 font-display">
              {students.length === 0
                ? '还没有训练家，点击上方按钮导入吧！'
                : '没有找到匹配的训练家'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredStudents.map((student, idx) => (
              <div key={student.id} style={{ animationDelay: `${idx * 60}ms` }}>
                <StudentCard
                  student={student} petTypes={petTypes}
                  onAddPoints={onAddPoints} onDelete={onDeleteStudent}
                  onRename={onRenameStudent} onSetNickname={onSetNickname}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BatchImportDialog
        open={showImport} onOpenChange={setShowImport}
        title="导入训练家名单"
        description="每行一个名字，或用逗号、顿号分隔。导入后默认分配选择的精灵。"
        placeholder={'张三\n李四\n王五\n赵六\n或：张三,李四,王五,赵六'}
        onConfirm={handleImport}
      />
    </div>
  );
}
