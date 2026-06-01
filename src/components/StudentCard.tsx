import { useState } from 'react';
import type { Student, PetType } from '@/types/pet';
import { getStageByExperience } from '@/types/pet';
import { Pet } from './Pet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StudentCardProps {
  student: Student;
  petTypes: PetType[];
  onAddPoints: (studentId: string, points: number) => void;
  onDelete: (studentId: string) => void;
  onRename?: (studentId: string, newName: string) => boolean;
  onSetNickname?: (studentId: string, nickname: string) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const stageLabels: Record<string, string> = {
  egg: '🥚蛋',
  baby: '🐣幼年',
  teen: '⭐成长',
  adult: '👑完全',
};
const stageKeys = ['egg', 'baby', 'teen', 'adult'] as const;

/* ── 内联精灵球 SVG 组件 ── */
function PokeballBg({ color, opacity = 0.06 }: { color: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ opacity }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3"/>
      <path d="M4 50 Q50 72 96 50" fill="#EE1515" fillOpacity="0.15" stroke={color} strokeWidth="3"/>
      <line x1="4" y1="50" x2="96" y2="50" stroke={color} strokeWidth="3"/>
      <circle cx="50" cy="50" r="12" fill="white" stroke={color} strokeWidth="3"/>
      <circle cx="50" cy="50" r="5" fill={color}/>
    </svg>
  );
}

function PokeballIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="11" fill="white" stroke="var(--color-primary-dark)" strokeWidth="1.5"/>
      <path d="M1 12 Q12 19 23 12" fill="#EE1515" fillOpacity="0.12" stroke="var(--color-primary-dark)" strokeWidth="1.5"/>
      <line x1="1" y1="12" x2="23" y2="12" stroke="var(--color-primary-dark)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" fill="white" stroke="var(--color-primary-dark)" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.2" fill="var(--color-primary-dark)"/>
    </svg>
  );
}

export function StudentCard({
  student, petTypes, onAddPoints, onDelete,
  onRename, onSetNickname, isSelected, onToggleSelect,
}: StudentCardProps) {
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [points, setPoints] = useState(10);
  const [showDelete, setShowDelete] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [showNickname, setShowNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const petType = petTypes.find((p) => p.id === student.pet.petTypeId) || petTypes[0];
  const currentStage = getStageByExperience(student.pet.experience);
  const stageIdx = stageKeys.indexOf(currentStage);

  /* 经验条进度 */
  const stageThresholds = [100, 300, 600];
  let expProgress = 1;
  if (stageIdx < stageThresholds.length) {
    const prev = stageIdx > 0 ? stageThresholds[stageIdx - 1] : 0;
    const next = stageThresholds[stageIdx];
    expProgress = Math.min(1, Math.max(0, (student.pet.experience - prev) / (next - prev)));
  }

  const handleAddPoints = () => {
    if (points > 0) { onAddPoints(student.id, points); setShowAddPoints(false); setPoints(10); }
  };

  const handleRename = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setRenameError('姓名不能为空'); return; }
    if (trimmed === student.name) { setShowRename(false); return; }
    const success = onRename?.(student.id, trimmed);
    if (success === false) { setRenameError('该姓名已存在，请换一个'); return; }
    setShowRename(false); setRenameError('');
  };

  const handleSetNickname = () => {
    onSetNickname?.(student.id, nicknameInput.trim());
    setShowNickname(false);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          紧凑 TCG 卡片 · 4列布局 · 大精灵展示
          ═══════════════════════════════════════════════════════ */}
      <div
        onClick={onToggleSelect}
        className={`tcg-card tcg-card--compact cursor-pointer animate-card-in ${
          isSelected ? 'tcg-card--selected' : ''
        }`}
      >
        {/* ── 顶部类型色条 ── */}
        <div className="tcg-card__type-bar tcg-card__type-bar--thin" style={{ background: petType.color }} />

        <div className="p-1">
          {/* ── 标题行：名字 + HP + 属性标签 ── */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold text-primary text-sm truncate max-w-[120px] font-display leading-tight">
              {student.name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="tcg-card__hp tcg-card__hp--sm">{student.pet.experience}</span>
              <span
                className="type-tag type-tag--sm"
                style={{
                  background: `${petType.color}18`,
                  color: petType.color,
                }}
              >
                {petType.pokemonType}
              </span>
            </div>
          </div>

          {/* ── 宠物形象 · 铺满框体 ── */}
          <div className="relative mb-1">
            <div
              className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: `radial-gradient(ellipse at 50% 55%, ${petType.color}18 0%, ${petType.color}08 50%, transparent 85%)`,
                border: `2px solid ${petType.color}25`,
              }}
            >
              {/* 背景精灵球水印 — 填满整个容器 */}
              <PokeballBg color={petType.color} opacity={0.08} />

              <div className="relative z-10">
                <Pet
                  petType={petType} stage={currentStage}
                  experience={student.pet.experience} size="xl" showExp={false}
                />
              </div>
            </div>
          </div>

          {/* ── 经验条（紧凑 HP 条）── */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-primary/50 uppercase tracking-wider font-display">
                EXP
              </span>
              <span className="text-[10px] font-extrabold text-primary tabular-nums">
                {expProgress >= 1 && currentStage === 'adult'
                  ? 'MAX'
                  : `${student.pet.experience} / ${stageThresholds[stageIdx] || stageThresholds[2]}`}
              </span>
            </div>
            <div className="hp-bar hp-bar--sm">
              <div
                className={`hp-bar-fill ${
                  expProgress > 0.66 ? 'hp-bar-fill-high'
                  : expProgress > 0.33 ? 'hp-bar-fill-mid'
                  : 'hp-bar-fill-low'
                } ${expProgress < 1 ? 'animate-exp-bar-pulse' : ''}`}
                style={{ width: `${Math.max(4, expProgress * 100)}%` }}
              />
            </div>
          </div>

          {/* ── 阶段标签 ── */}
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold font-display"
              style={{
                background: `${petType.color}15`,
                color: petType.color,
                border: `1px solid ${petType.color}30`,
              }}
            >
              {stageLabels[currentStage] || '🥚蛋'}
            </span>
            {student.nickname && (
              <span className="text-[10px] font-semibold text-primary/45 bg-primary/5 px-2 py-0.5 rounded-lg truncate max-w-[90px]">
                "{student.nickname}"
              </span>
            )}
          </div>

          {/* ── 操作按钮 · 2×2 游戏按钮 ── */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* 加分按钮 · 精灵球装饰 */}
            <button
              className="game-btn game-btn-yellow text-xs !py-1.5 !px-1 !gap-1 !rounded-lg"
              onClick={(e) => { e.stopPropagation(); setShowAddPoints(true); }}
            >
              <PokeballIcon className="w-4 h-4 shrink-0" />
              加分
            </button>
            <button
              className="game-btn game-btn-blue text-xs !py-1.5 !px-1 !gap-1 !rounded-lg"
              onClick={(e) => { e.stopPropagation(); setNewName(student.name); setRenameError(''); setShowRename(true); }}
            >
              ✏ 改名
            </button>
            <button
              className="game-btn game-btn-outline text-xs !py-1.5 !px-1 !gap-1 !rounded-lg"
              onClick={(e) => { e.stopPropagation(); setNicknameInput(student.nickname || ''); setShowNickname(true); }}
            >
              🏷 昵称
            </button>
            <button
              className="game-btn game-btn-red text-xs !py-1.5 !px-1 !gap-1 !rounded-lg"
              onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
            >
              🗑 删除
            </button>
          </div>
        </div>

        {/* ── 右下角装饰精灵球印 ── */}
        <svg viewBox="0 0 80 80" className="absolute -bottom-2 -right-2 w-16 h-16 opacity-[0.03] pointer-events-none">
          <circle cx="40" cy="40" r="38" fill="none" stroke="var(--color-primary-dark)" strokeWidth="3"/>
          <path d="M2 40 Q40 60 78 40" fill="#EE1515" fillOpacity="0.3" stroke="var(--color-primary-dark)" strokeWidth="3"/>
          <line x1="2" y1="40" x2="78" y2="40" stroke="var(--color-primary-dark)" strokeWidth="3"/>
          <circle cx="40" cy="40" r="9" fill="white" stroke="var(--color-primary-dark)" strokeWidth="3"/>
          <circle cx="40" cy="40" r="3.5" fill="var(--color-primary-dark)"/>
        </svg>
      </div>

      {/* ── 加分对话框 ── */}
      <AlertDialog open={showAddPoints} onOpenChange={setShowAddPoints}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-xs text-primary">
              ⚡ {student.name} · 增加经验
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              当前经验值：<span className="font-extrabold text-[#EE1515]">{student.pet.experience}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  className={`game-btn text-xs px-4 py-2 ${
                    points === n ? 'game-btn-yellow' : 'game-btn-outline'
                  }`}
                  onClick={() => setPoints(n)}
                >
                  +{n}
                </button>
              ))}
            </div>
            <Input
              type="number" value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={1} placeholder="自定义分数..."
              className="game-input"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm">取消</AlertDialogCancel>
            <AlertDialogAction className="game-btn game-btn-yellow text-sm" onClick={handleAddPoints}>
              ⚡ 确认加分
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── 删除确认 ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-xs text-primary">⚠ 确认删除</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              确定要删除训练家 <span className="font-extrabold">"{student.name}"</span> 吗？
              此操作不可撤销，{petType.emoji} {petType.name} 的所有成长记录都将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm">取消</AlertDialogCancel>
            <AlertDialogAction
              className="game-btn game-btn-red text-sm"
              onClick={() => { onDelete(student.id); setShowDelete(false); }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── 改名 ── */}
      <AlertDialog open={showRename} onOpenChange={(open) => { setShowRename(open); setRenameError(''); }}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-xs text-primary">✏ 修改训练家姓名</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              当前姓名：<span className="font-extrabold">{student.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-sm font-extrabold text-primary font-display">新姓名</label>
            <Input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setRenameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              placeholder="请输入新姓名..."
              autoFocus
              className="game-input"
            />
            {renameError && <p className="text-sm font-bold text-[#EE1515]">{renameError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm">取消</AlertDialogCancel>
            <AlertDialogAction className="game-btn game-btn-yellow text-sm" onClick={handleRename}>
              确认改名
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── 昵称 ── */}
      <AlertDialog open={showNickname} onOpenChange={setShowNickname}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-xs text-primary">🏷 设置昵称</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              昵称仅用于加分时快速查找，不会在页面上显示。<br />
              当前训练家：<span className="font-extrabold">{student.name}</span>
              {student.nickname && <span className="text-primary/50">｜当前：{student.nickname}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-sm font-extrabold text-primary font-display">昵称</label>
            <Input
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSetNickname(); }}
              placeholder="例如：小张、班长..."
              autoFocus
              className="game-input"
            />
            <p className="text-xs font-semibold text-primary/40">留空则清除昵称。</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm">取消</AlertDialogCancel>
            <AlertDialogAction className="game-btn game-btn-yellow text-sm" onClick={handleSetNickname}>
              {nicknameInput.trim() ? '确认设置' : '清除昵称'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
