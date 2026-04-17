import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import type { Student, PetType } from '@/types/pet';
import { PET_TYPES, STAGE_CONFIG, getStageByExperience, getPetImagePath, getNextStageExp } from '@/types/pet';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RotateCcw, Users, Eye } from 'lucide-react';

interface StudentStatusViewProps {
  students: Student[];
  petTypes: PetType[];
}

const PAGE_SIZE = 20;

// 姓氏拼音排序（简化版：按姓氏首字符排序）
function sortBySurname(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

export function StudentStatusView({ students, petTypes }: StudentStatusViewProps) {

  // 进化链名称
  const getEvolutionName = (petTypeId: string, stage: string): string => {
    const pt = petTypes.find(p => p.id === petTypeId);
    if (!pt) return '';
    return pt.stages[stage as keyof typeof pt.stages] || '';
  };
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(true); // true = 查看全部，false = 查看筛选名单

  // 按姓氏排序
  const sortedStudents = useMemo(() => sortBySurname(students), [students]);

  // 根据 showAll 或 filteredNames 筛选
  const displayStudents = useMemo(() => {
    if (showAll || filteredNames.length === 0) {
      return sortedStudents;
    }
    const nameSet = new Set(filteredNames);
    return sortedStudents.filter(s => nameSet.has(s.name));
  }, [sortedStudents, filteredNames, showAll]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(displayStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStudents = displayStudents.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // 统计
  const stageStats = useMemo(() => ({
    egg: displayStudents.filter(s => s.pet.stage === 'egg').length,
    baby: displayStudents.filter(s => s.pet.stage === 'baby').length,
    teen: displayStudents.filter(s => s.pet.stage === 'teen').length,
    adult: displayStudents.filter(s => s.pet.stage === 'adult').length,
  }), [displayStudents]);

  // 处理批量导入名单
  const handleImportNames = (names: string[]) => {
    const matched = names.filter(n => students.some(s => s.name === n));
    const unmatched = names.filter(n => !students.some(s => s.name === n));

    setFilteredNames(matched);
    setShowAll(false);
    setCurrentPage(1);

    if (matched.length > 0) {
      toast.success(`✅ 已筛选 ${matched.length} 名学生`);
    }
    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} 名学生未找到: ${unmatched.join('、')}`);
    }
  };

  const handleReset = () => {
    setFilteredNames([]);
    setShowAll(true);
    setCurrentPage(1);
  };

  // 进化链预览
  const getEvolutionChain = (petTypeId: string) => {
    const pt = petTypes.find(p => p.id === petTypeId);
    if (!pt) return null;
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{pt.stages.baby}</span>
        <span className="text-[10px] text-muted-foreground">→</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{pt.stages.teen}</span>
        <span className="text-[10px] text-muted-foreground">→</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{pt.stages.adult}</span>
      </div>
    );
  };

  const stageBadge = (stage: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      egg: { label: '🥚 蛋', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
      baby: { label: '🐣 幼年', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
      teen: { label: '⭐ 成长', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
      adult: { label: '👑 完全', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
    };
    const c = config[stage] || config.egg;
    return (
      <span className={`text-[11px] font-bold px-1.5 py-0 rounded-full border ${c.bg} ${c.color}`}>
        {c.label}
      </span>
    );
  };

  // 进度条
  const ProgressBar = ({ experience, stage, petType }: { experience: number; stage: string; petType: PetType }) => {
    const nextExp = getNextStageExp(experience);
    const stageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
    const progress = nextExp
      ? ((experience - stageConfig.minExp) / (nextExp - stageConfig.minExp)) * 100
      : 100;

    return (
      <div className="w-full">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: petType.color,
            }}
          />
        </div>
        <div className="text-[9px] text-muted-foreground text-center font-bold leading-none">
          {experience}{nextExp ? `/${nextExp}` : ' ✨MAX'}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 操作区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            学生状态浏览
          </CardTitle>
          <CardDescription>
            批量导入学生名单，浏览对应学生的宠物状态和得分情况。按姓氏排序，每页展示 20 名学生。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => setShowImport(true)} className="gap-2">
              <Users className="w-4 h-4" />
              导入名单筛选
            </Button>
            {!showAll && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                查看全部 ({students.length}人)
              </Button>
            )}
          </div>

          {/* 筛选状态 */}
          {!showAll && filteredNames.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">
                当前筛选: <span className="font-bold text-primary">{filteredNames.length}</span> 名学生
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {filteredNames.map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-lg">🥚</div>
          <div className="text-base font-bold">{stageStats.egg}</div>
          <div className="text-[10px] text-muted-foreground">蛋阶段</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-lg">🐣</div>
          <div className="text-base font-bold">{stageStats.baby}</div>
          <div className="text-[10px] text-muted-foreground">幼年体</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-purple-50 border border-purple-200">
          <div className="text-lg">⭐</div>
          <div className="text-base font-bold">{stageStats.teen}</div>
          <div className="text-[10px] text-muted-foreground">成长体</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50 border border-red-200">
          <div className="text-lg">👑</div>
          <div className="text-base font-bold">{stageStats.adult}</div>
          <div className="text-[10px] text-muted-foreground">完全体</div>
        </div>
      </div>

      {/* 4:3 横版学生网格 */}
      {displayStudents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {students.length === 0
              ? '还没有学生数据，快去添加学生吧！'
              : '没有找到匹配的学生'}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {showAll ? '📊 全部学生状态' : '📋 筛选学生状态'}
                  <Badge variant="secondary" className="ml-2">{displayStudents.length} 人</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  第 {safeCurrentPage} / {totalPages} 页
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 4:3 横版容器 */}
              <div className="aspect-[4/3] w-full border-2 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-purple-50/50 to-pink-50/80">
                <div className="h-full p-1.5 grid grid-cols-5 grid-rows-4 gap-1">
                  {pageStudents.map((student) => {
                    const petType = petTypes.find(p => p.id === student.pet.petTypeId) || petTypes[0];
                    const stage = getStageByExperience(student.pet.experience);
                    const imagePath = getPetImagePath(petType.id, stage, petType.pokemonType, petType);

                    return (
                      <div
                        key={student.id}
                        className="flex flex-col rounded-lg bg-white/80 backdrop-blur-sm border border-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden"
                        style={{ borderTop: `2px solid ${petType.color}` }}
                      >
                        {/* 上部区域: 图片(60%) + 信息(40%) */}
                        <div className="flex items-stretch min-h-0" style={{ flex: '9' }}>
                          {/* 左侧: 宝可梦图片 (60%) */}
                          <div
                            className="flex items-center justify-center min-h-0 p-0.5"
                            style={{
                              flex: '6',
                              background: `linear-gradient(135deg, ${petType.color}10, ${petType.color}20)`,
                            }}
                          >
                            <img
                              src={imagePath}
                              alt={petType.stages[stage]}
                              className={`w-full h-full object-contain ${stage === 'egg' ? 'animate-bounce' : ''}`}
                              style={{
                                filter: stage === 'adult'
                                  ? `drop-shadow(0 2px 8px ${petType.color}60)`
                                  : `drop-shadow(0 1px 3px ${petType.color}30)`,
                              }}
                              draggable={false}
                            />
                          </div>

                          {/* 右侧: 学生姓名 + 宠物状态 (40%) */}
                          <div className="flex flex-col justify-center items-center px-1 min-h-0" style={{ flex: '4' }}>
                            <div className="font-bold text-sm leading-tight text-gray-800 truncate max-w-full text-center">
                              {student.name}
                            </div>
                            <div className="leading-tight mt-0.5">
                              {stageBadge(stage)}
                            </div>
                          </div>
                        </div>

                        {/* 底部: 经验进度条 */}
                        <div className="px-1 pb-1 pt-0.5">
                          <ProgressBar experience={student.pet.experience} stage={stage} petType={petType} />
                        </div>
                      </div>
                    );
                  })}

                  {/* 填充空白格子 */}
                  {Array.from({ length: Math.max(0, PAGE_SIZE - pageStudents.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="rounded-lg border border-dashed border-gray-200/60" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // 最多显示7个页码按钮
                  if (totalPages > 7) {
                    if (page === 1 || page === totalPages ||
                        (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1)) {
                      return (
                        <Button
                          key={page}
                          variant={safeCurrentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    }
                    if (page === safeCurrentPage - 2 || page === safeCurrentPage + 2) {
                      return <span key={page} className="text-muted-foreground text-sm">...</span>;
                    }
                    return null;
                  }
                  return (
                    <Button
                      key={page}
                      variant={safeCurrentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="gap-1"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 批量导入对话框 */}
      <BatchImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="导入名单 - 筛选学生"
        description="输入学生名单，将筛选显示这些学生的宠物状态。支持换行、逗号、顿号分隔。"
        placeholder={"张三\n李四\n王五\n赵六\n或：张三,李四,王五,赵六"}
        onConfirm={handleImportNames}
      />
    </div>
  );
}
