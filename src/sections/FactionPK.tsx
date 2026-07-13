import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { Swords, Shuffle, Plus, Trash2, Pencil, Users, ChevronDown } from 'lucide-react';
import type { ClassGroup } from '@/hooks/useClasses';
import type { Student, PetType } from '@/types/pet';
import { getPetImagePath } from '@/types/pet';
import { useFactions, FACTION_COLORS } from '@/hooks/useFactions';

interface FactionPKProps {
  classes: ClassGroup[];
  students: Student[];
  petTypes: PetType[];
}

export function FactionPK({ classes, students, petTypes }: FactionPKProps) {
  const {
    getFactions, autoDivide, addFaction, removeFaction,
    renameFaction, updateFactionColor, setMascot, moveStudent, clearFactions,
  } = useFactions();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [factionCount, setFactionCount] = useState(2);
  const [editingFactionId, setEditingFactionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [mascotPickerFor, setMascotPickerFor] = useState<string | null>(null);
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.name, s));
    return map;
  }, [students]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const factions = selectedClassId ? getFactions(selectedClassId) : [];

  // 计算每个阵营的数据
  const factionData = useMemo(() => {
    if (!factions.length) return [];
    return factions.map(f => {
      const validStudents = f.studentNames
        .map(name => studentMap.get(name))
        .filter((s): s is Student => !!s);
      const totalScore = validStudents.reduce((sum, s) => sum + s.pet.experience, 0);
      const avgScore = validStudents.length > 0 ? Math.round(totalScore / validStudents.length) : 0;
      const petType = petTypes.find(p => p.id === f.mascotPetTypeId);
      return {
        ...f,
        validStudents,
        invalidNames: f.studentNames.filter(n => !studentMap.has(n)),
        totalScore,
        avgScore,
        petType,
      };
    });
  }, [factions, studentMap, petTypes]);

  // 图表数据
  const chartData = useMemo(() => {
    return factionData.map(f => ({
      name: f.name,
      avgScore: f.avgScore,
      color: f.color,
      count: f.validStudents.length,
      emoji: f.petType?.emoji || '?',
    }));
  }, [factionData]);

  // ── 自动分组 ──────────────────────────────────────────────
  const handleAutoDivide = () => {
    if (!selectedClass) return;
    const validNames = selectedClass.studentNames.filter(n => studentMap.has(n));
    if (validNames.length < 2) {
      toast.error('班级中有效学生不足 2 人，无法分组');
      return;
    }
    const defaultPetId = petTypes[0]?.id || 'bulbasaur';
    autoDivide(selectedClass.id, validNames, factionCount, defaultPetId);
    toast.success(`已将 ${validNames.length} 名学生随机分为 ${factionCount} 个阵营`);
  };

  // ── 手动添加阵营 ──────────────────────────────────────────
  const handleAddFaction = () => {
    if (!selectedClassId) return;
    const defaultPetId = petTypes[0]?.id || 'bulbasaur';
    addFaction(selectedClassId, defaultPetId);
    toast.success('已添加新阵营');
  };

  // ── 重命名 ────────────────────────────────────────────────
  const handleRename = (factionId: string) => {
    const name = editingName.trim();
    if (!name) { toast.error('阵营名称不能为空'); return; }
    renameFaction(selectedClassId, factionId, name);
    setEditingFactionId(null);
  };

  // ── 移动学生 ──────────────────────────────────────────────
  const handleMoveStudent = (studentName: string, fromId: string, toId: string) => {
    moveStudent(selectedClassId, studentName, fromId, toId);
    setMoveMenuFor(null);
  };

  // ── 获取吉祥物图片 ────────────────────────────────────────
  const getMascotImage = (petTypeId: string): string => {
    const pt = petTypes.find(p => p.id === petTypeId);
    if (!pt) return '';
    return getPetImagePath(pt.id, 'teen', pt.pokemonType, pt);
  };

  // ── 无选中班级时的提示 ────────────────────────────────────
  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <div className="text-5xl mb-4">⚔️</div>
          <div className="font-medium mb-1">阵营 PK</div>
          <div className="text-sm">请先创建班级，再将学员划分为不同阵营进行对比</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ 控制栏 ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            阵营 PK
          </CardTitle>
          <CardDescription>
            选择班级，自动分组或手动调整阵营，通过柱状图对比各阵营平均积分
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* 班级选择 */}
            <select
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium min-w-[160px] cursor-pointer"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">— 选择班级 —</option>
              {classes.map(c => {
                const valid = c.studentNames.filter(n => studentMap.has(n)).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name}（{valid}人）
                  </option>
                );
              })}
            </select>

            {/* 阵营数量 */}
            {selectedClassId && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">阵营数：</span>
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      className={`w-8 h-8 rounded-lg text-sm font-bold border transition-all ${
                        factionCount === n
                          ? 'bg-primary text-primary-foreground border-primary scale-105'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setFactionCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <Button onClick={handleAutoDivide} size="sm" className="gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  自动分组
                </Button>

                <Button onClick={handleAddFaction} size="sm" variant="outline" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  添加阵营
                </Button>

                {factions.length > 0 && (
                  <Button
                    onClick={() => {
                      clearFactions(selectedClassId);
                      toast.success('已清空阵营');
                    }}
                    size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    清空
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 未选班级提示 ═══ */}
      {!selectedClassId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">👈</div>
            <div className="text-sm">请选择一个班级开始阵营 PK</div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 柱状图对比 ═══ */}
      {selectedClassId && factions.length >= 2 && (() => {
        const showSymmetrical = factions.length === 2 && factionData.length === 2;
        const leftFaction = factionData[0];
        const rightFaction = factionData[1];

        return (
          <Card>
            {showSymmetrical && (
              <style>{`
                @keyframes faction-leader-crown {
                  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(255,215,0,0.6)); }
                  50% { transform: scale(1.15); filter: drop-shadow(0 0 14px rgba(255,215,0,0.9)); }
                }
              `}</style>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                ⚔️ 阵营 PK
                <span className="text-xs font-normal text-muted-foreground">
                  · {selectedClass?.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: showSymmetrical ? '24px' : '12px',
                  width: '100%',
                  minHeight: 320,
                }}
              >
                {showSymmetrical ? (
                  <>
                    {/* ── 左侧吉祥物大图 ── */}
                    {leftFaction && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{
                          width: '150px', height: '150px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {leftFaction.petType ? (
                            <img src={getMascotImage(leftFaction.mascotPetTypeId)} alt={leftFaction.petType.name}
                              style={{ width: '140px', height: '140px', objectFit: 'contain', imageRendering: 'pixelated' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${leftFaction.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' }}>?</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '17px', fontWeight: 800, color: leftFaction.color }}>
                            {leftFaction.petType?.emoji} {leftFaction.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
                            {leftFaction.validStudents.length} 名学员
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── 左侧柱状图 ── */}
                    <div style={{
                      width: '180px', height: '320px',
                      borderRadius: '16px',
                      border: `2px solid ${leftFaction?.color}25`,
                      background: `${leftFaction?.color}06`,
                      padding: '4px',
                      flexShrink: 0,
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[chartData[0]]} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                          <Bar dataKey="avgScore" radius={[10, 10, 0, 0]} maxBarSize={90} fill={leftFaction?.color}>
                            <LabelList dataKey="avgScore" position="top"
                              formatter={(v: number) => `${v}`}
                              style={{ fontSize: 22, fontWeight: 900, fill: leftFaction?.color || '#000' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* ── VS + 👑 分隔 ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, paddingBottom: '20px' }}>
                      <div style={{
                        fontSize: '56px', fontWeight: 900, lineHeight: 1,
                        background: 'linear-gradient(135deg, #EF4444 0%, #3B82F6 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
                      }}>VS</div>
                      {chartData[0].avgScore !== chartData[1].avgScore && (
                        <div style={{
                          fontSize: '34px',
                          animation: 'faction-leader-crown 1.5s ease-in-out infinite',
                          lineHeight: 1,
                        }}>👑</div>
                      )}
                    </div>

                    {/* ── 右侧柱状图 ── */}
                    <div style={{
                      width: '180px', height: '320px',
                      borderRadius: '16px',
                      border: `2px solid ${rightFaction?.color}25`,
                      background: `${rightFaction?.color}06`,
                      padding: '4px',
                      flexShrink: 0,
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[chartData[1]]} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                          <Bar dataKey="avgScore" radius={[10, 10, 0, 0]} maxBarSize={90} fill={rightFaction?.color}>
                            <LabelList dataKey="avgScore" position="top"
                              formatter={(v: number) => `${v}`}
                              style={{ fontSize: 22, fontWeight: 900, fill: rightFaction?.color || '#000' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* ── 右侧吉祥物大图 ── */}
                    {rightFaction && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{
                          width: '150px', height: '150px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {rightFaction.petType ? (
                            <img src={getMascotImage(rightFaction.mascotPetTypeId)} alt={rightFaction.petType.name}
                              style={{ width: '140px', height: '140px', objectFit: 'contain', imageRendering: 'pixelated' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${rightFaction.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' }}>?</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '17px', fontWeight: 800, color: rightFaction.color }}>
                            {rightFaction.petType?.emoji} {rightFaction.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
                            {rightFaction.validStudents.length} 名学员
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── 非对称模式（3+ 阵营）：保留原柱状图 ── */
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }}
                          tickFormatter={(v: string, i: number) => `${chartData[i]?.emoji || ''} ${v}`} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value: number, _name: string, props: any) => [`${value} 分（${props.payload.count}人）`, '平均积分']} />
                        <Bar dataKey="avgScore" radius={[10, 10, 0, 0]} maxBarSize={100}>
                          {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          <LabelList dataKey="avgScore" position="top"
                            formatter={(v: number) => `${v}`}
                            style={{ fontSize: 18, fontWeight: 900, fill: 'var(--color-foreground)' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ═══ 阵营卡片 ═══ */}
      {selectedClassId && factions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {factionData.map(f => (
            <Card key={f.id} className="overflow-hidden">
              {/* 阵营色条 */}
              <div style={{ height: '5px', background: f.color }} />

              <CardContent className="pt-4 pb-3 space-y-3">
                {/* ── 头部：名称 + 操作 ── */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 颜色选择器 */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-5 h-5 rounded-full cursor-pointer border-2 border-white shadow"
                        style={{ background: f.color }}
                        title="点击更换颜色"
                      />
                      <select
                        className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5"
                        value={f.color}
                        onChange={e => updateFactionColor(selectedClassId, f.id, e.target.value)}
                      >
                        {FACTION_COLORS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {editingFactionId === f.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(f.id);
                            if (e.key === 'Escape') setEditingFactionId(null);
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleRename(f.id)}>OK</Button>
                      </div>
                    ) : (
                      <span className="font-bold text-sm truncate" style={{ color: f.color }}>
                        {f.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost" size="icon" className="w-6 h-6"
                      title="重命名"
                      onClick={() => { setEditingFactionId(f.id); setEditingName(f.name); }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="w-6 h-6 text-destructive hover:text-destructive"
                      title="删除阵营"
                      onClick={() => {
                        removeFaction(selectedClassId, f.id);
                        toast.success('阵营已删除');
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* ── 吉祥物 ── */}
                <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: `${f.color}15` }}>
                  <div className="relative">
                    {f.petType && (
                      <img
                        src={getMascotImage(f.mascotPetTypeId)}
                        alt={f.petType.name}
                        className="w-14 h-14 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {/* 吉祥物选择按钮 */}
                    <button
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shadow"
                      title="选择吉祥物"
                      onClick={() => setMascotPickerFor(mascotPickerFor === f.id ? null : f.id)}
                    >
                      {mascotPickerFor === f.id ? '×' : '🔄'}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">吉祥物</div>
                    <div className="font-bold text-sm flex items-center gap-1">
                      <span>{f.petType?.emoji}</span>
                      <span className="truncate">{f.petType?.name || '未选择'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {f.petType ? f.petType.stages.teen : ''}
                    </div>
                  </div>
                </div>

                {/* 吉祥物选择面板 */}
                {mascotPickerFor === f.id && (
                  <div className="p-2 rounded-xl border bg-muted/30 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-1.5">
                      {petTypes.map(pt => (
                        <button
                          key={pt.id}
                          className={`p-1.5 rounded-lg border text-center transition-all hover:bg-muted ${
                            f.mascotPetTypeId === pt.id ? 'border-primary bg-primary/10' : 'border-transparent'
                          }`}
                          onClick={() => {
                            setMascot(selectedClassId, f.id, pt.id);
                            setMascotPickerFor(null);
                          }}
                          title={pt.name}
                        >
                          <img
                            src={getPetImagePath(pt.id, 'teen', pt.pokemonType, pt)}
                            alt={pt.name}
                            className="w-8 h-8 object-contain mx-auto"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '0.3';
                            }}
                          />
                          <div className="text-[10px] mt-0.5 truncate">{pt.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 积分统计 ── */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-bold">{f.validStudents.length}</span>
                    <span className="text-muted-foreground text-xs">人</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">均分</span>
                    <span className="font-bold text-base" style={{ color: f.color }}>{f.avgScore}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">总分</span>
                    <span className="font-bold">{f.totalScore}</span>
                  </div>
                </div>

                {f.invalidNames.length > 0 && (
                  <div className="text-xs text-amber-500">
                    {f.invalidNames.length} 名学生未在系统中
                  </div>
                )}

                {/* ── 学员列表 ── */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {f.validStudents.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-3">暂无学员</div>
                  ) : (
                    [...f.validStudents]
                      .sort((a, b) => b.pet.experience - a.pet.experience)
                      .map(s => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 group"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-4 text-center">
                            {f.validStudents.indexOf(s) + 1}
                          </span>
                          <span className="text-sm flex-1 truncate">{s.name}</span>
                          <Badge variant="secondary" className="text-xs font-bold">
                            {s.pet.experience}
                          </Badge>
                          {/* 移动到其他阵营 */}
                          <div className="relative">
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-0.5 rounded"
                              title="移动到其他阵营"
                              onClick={() => setMoveMenuFor(moveMenuFor === `${f.id}-${s.id}` ? null : `${f.id}-${s.id}`)}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {moveMenuFor === `${f.id}-${s.id}` && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMoveMenuFor(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 bg-background border rounded-lg shadow-lg py-1 min-w-[120px]">
                                  <div className="px-2 py-1 text-xs text-muted-foreground">移动到…</div>
                                  {factionData
                                    .filter(other => other.id !== f.id)
                                    .map(other => (
                                      <button
                                        key={other.id}
                                        className="w-full px-2 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                                        onClick={() => handleMoveStudent(s.name, f.id, other.id)}
                                      >
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: other.color }} />
                                        {other.name}
                                        <span className="text-xs text-muted-foreground ml-auto">{other.validStudents.length}人</span>
                                      </button>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ 仅有1个阵营时提示 ═══ */}
      {selectedClassId && factions.length === 1 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <div className="text-3xl mb-2">💡</div>
            <div className="text-sm">至少需要 2 个阵营才能进行 PK 对比，点击「添加阵营」或「自动分组」</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
