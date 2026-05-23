import { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import type { Student, PetType } from '@/types/pet';
import { STAGE_CONFIG, getStageByExperience, getPetImagePath, getNextStageExp } from '@/types/pet';
import type { ClassGroup } from '@/hooks/useClasses';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RotateCcw, Users, Eye, Download, ImageIcon, School } from 'lucide-react';
import html2canvas from 'html2canvas';

interface StudentStatusViewProps {
  students: Student[];
  petTypes: PetType[];
  classes?: ClassGroup[];
}

const PAGE_SIZE = 20;

// 姓氏拼音排序
function sortBySurname(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

export function StudentStatusView({ students, petTypes, classes = [] }: StudentStatusViewProps) {

  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  // 班级筛选：null=不按班级筛选，classId=按该班级筛选
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // 网格容器 ref（用于截图）
  const gridRef = useRef<HTMLDivElement>(null);
  // 用于渲染所有页导出时的隐藏容器
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const sortedStudents = useMemo(() => sortBySurname(students), [students]);

  const displayStudents = useMemo(() => {
    let base = sortedStudents;

    // 先按班级过滤
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        const nameSet = new Set(cls.studentNames);
        base = base.filter(s => nameSet.has(s.name));
      }
    }

    // 再按导入名单过滤
    if (!showAll && filteredNames.length > 0) {
      const nameSet = new Set(filteredNames);
      base = base.filter(s => nameSet.has(s.name));
    }

    return base;
  }, [sortedStudents, filteredNames, showAll, selectedClassId, classes]);

  const totalPages = Math.max(1, Math.ceil(displayStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStudents = displayStudents.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const stageStats = useMemo(() => ({
    egg: displayStudents.filter(s => s.pet.stage === 'egg').length,
    baby: displayStudents.filter(s => s.pet.stage === 'baby').length,
    teen: displayStudents.filter(s => s.pet.stage === 'teen').length,
    adult: displayStudents.filter(s => s.pet.stage === 'adult').length,
  }), [displayStudents]);

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
    setSelectedClassId(null);
    setCurrentPage(1);
  };

  const handleSelectClass = (classId: string | null) => {
    setSelectedClassId(classId);
    setFilteredNames([]);
    setShowAll(true);
    setCurrentPage(1);
  };

  // ─── 导出图片工具函数 ─────────────────────────────────────────────────────────

  // 等待所有图片加载
  const waitForImages = (container: HTMLElement): Promise<void> => {
    const imgs = container.querySelectorAll('img');
    const promises = Array.from(imgs).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    return Promise.all(promises).then(() => {});
  };

  // 截图某个容器并下载
  const captureAndDownload = async (element: HTMLElement, filename: string) => {
    await waitForImages(element);
    const canvas = await html2canvas(element, {
      scale: 2,        // 2x 高清
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出当前页
  const handleExportCurrentPage = async () => {
    if (!gridRef.current) return;
    setIsExporting(true);
    try {
      const label = showAll ? '全部' : '筛选';
      const filename = `学生状态-${label}第${safeCurrentPage}页-${new Date().toLocaleDateString('zh-CN')}.png`;
      await captureAndDownload(gridRef.current, filename);
      toast.success('✅ 当前页图片已导出');
    } catch (e) {
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 导出所有页：逐页生成，打包成多张图片（分别下载）
  const handleExportAllPages = async () => {
    if (displayStudents.length === 0) return;
    setIsExporting(true);
    toast.info(`正在导出 ${totalPages} 页，请稍候...`);
    try {
      for (let page = 1; page <= totalPages; page++) {
        const pageData = displayStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        // 渲染到隐藏容器
        await renderPageToExportContainer(pageData);
        if (exportContainerRef.current) {
          const label = showAll ? '全部' : '筛选';
          const filename = `学生状态-${label}第${page}页-${new Date().toLocaleDateString('zh-CN')}.png`;
          await captureAndDownload(exportContainerRef.current, filename);
        }
        // 小延迟避免浏览器卡顿
        await new Promise(r => setTimeout(r, 300));
      }
      toast.success(`✅ 全部 ${totalPages} 页已导出`);
    } catch (e) {
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 阶段配色表（统一使用，避免 UI 和导出不一致）
  const STAGE_COLORS: Record<string, { bg: string; text: string; emoji: string; label: string }> = {
    egg:  { bg: '#fff7ed', text: '#c2410c', emoji: '🥚', label: '蛋' },
    baby: { bg: '#eff6ff', text: '#1d4ed8', emoji: '🐣', label: '幼年' },
    teen: { bg: '#f5f3ff', text: '#6d28d9', emoji: '⭐', label: '成长' },
    adult: { bg: '#fef2f2', text: '#b91c1c', emoji: '👑', label: '完全' },
  };

  // 将一页学生数据渲染到隐藏的导出容器
  const renderPageToExportContainer = (pageData: Student[]): Promise<void> => {
    return new Promise((resolve) => {
      if (!exportContainerRef.current) { resolve(); return; }

      exportContainerRef.current.innerHTML = '';

      const container = document.createElement('div');
      container.style.cssText =
        'width:960px;height:720px;background:linear-gradient(135deg,#eff6ff 0%,#f5f0ff 50%,#fff0f5 100%);' +
        'padding:8px;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(4,1fr);' +
        'gap:6px;box-sizing:border-box;border-radius:16px;overflow:hidden;';

      for (let i = 0; i < PAGE_SIZE; i++) {
        const student = pageData[i];
        const card = document.createElement('div');
        card.style.cssText =
          'display:flex;flex-direction:column;border-radius:8px;background:rgba(255,255,255,0.9);' +
          'overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);';

        if (student) {
          const petType = petTypes.find(p => p.id === student.pet.petTypeId) || petTypes[0];
          const stage = getStageByExperience(student.pet.experience);
          const imagePath = getPetImagePath(petType.id, stage, petType.pokemonType, petType);
          const sc = STAGE_COLORS[stage] || STAGE_COLORS.egg;
          const nextExp = getNextStageExp(student.pet.experience);
          const stageConf = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
          const progress = nextExp
            ? ((student.pet.experience - stageConf.minExp) / (nextExp - stageConf.minExp)) * 100
            : 100;

          card.style.borderTop = `2px solid ${petType.color}`;

          // ── 上部：图片 + 信息 ──
          const topRow = document.createElement('div');
          topRow.style.cssText = 'display:flex;flex:1;min-height:0;';

          // 左侧图片容器
          const imgWrap = document.createElement('div');
          imgWrap.style.cssText =
            'flex:5.5;display:flex;align-items:center;justify-content:center;padding:3px;' +
            `background:${petType.color}12;`;
          const img = document.createElement('img');
          img.src = imagePath;
          img.alt = petType.stages[stage];
          img.crossOrigin = 'anonymous';
          img.style.cssText = 'max-width:100%;max-height:100%;width:auto;height:auto;';
          imgWrap.appendChild(img);

          // 右侧信息容器
          const infoWrap = document.createElement('div');
          infoWrap.style.cssText =
            'flex:4.5;display:flex;flex-direction:column;justify-content:center;' +
            'padding:4px 4px;overflow:hidden;text-align:center;';

          // 学生姓名
          const nameEl = document.createElement('div');
          nameEl.textContent = student.name;
          const nameFontSize = student.name.length > 3 ? '15px' : student.name.length > 2 ? '16px' : '17px';
          nameEl.style.cssText =
            `font-weight:700;font-size:${nameFontSize};color:#1f2937;text-align:center;` +
            'word-break:break-all;line-height:1.3;width:100%;';

          // 阶段标签（满宽条形，和姓名宽度一致，保证对齐）
          const badge = document.createElement('div');
          badge.textContent = `${sc.emoji} ${sc.label}`;
          badge.style.cssText =
            'margin-top:8px;font-size:12px;font-weight:bold;padding:0 0 6px 0;border-radius:4px;' +
            'width:100%;text-align:center;line-height:1.2;' +
            `background:${sc.bg};color:${sc.text};`;

          infoWrap.appendChild(nameEl);
          infoWrap.appendChild(badge);
          topRow.appendChild(imgWrap);
          topRow.appendChild(infoWrap);

          // ── 底部：进度条 ──
          const bottomBar = document.createElement('div');
          bottomBar.style.cssText = 'padding:0 6px 4px;margin-top:auto;';

          const barTrack = document.createElement('div');
          barTrack.style.cssText = 'width:100%;height:5px;background:#e5e7eb;border-radius:999px;overflow:hidden;';

          const barFill = document.createElement('div');
          barFill.style.cssText =
            `height:100%;background:${petType.color};border-radius:999px;` +
            `width:${Math.min(100, Math.max(0, progress))}%;`;
          barTrack.appendChild(barFill);

          const expText = document.createElement('div');
          expText.textContent = `${student.pet.experience}${nextExp ? `/${nextExp}` : ' MAX'}`;
          expText.style.cssText = 'font-size:9px;color:#9ca3af;text-align:center;line-height:1.2;margin-top:2px;font-weight:bold;';

          bottomBar.appendChild(barTrack);
          bottomBar.appendChild(expText);

          card.appendChild(topRow);
          card.appendChild(bottomBar);
        } else {
          card.style.cssText += 'border:1.5px dashed #e5e7eb;background:transparent;box-shadow:none;';
        }

        container.appendChild(card);
      }

      exportContainerRef.current.appendChild(container);

      waitForImages(container).then(() => {
        setTimeout(resolve, 150);
      });
    });
  };

  // ─── UI 组件 ─────────────────────────────────────────────────────────────────

  const stageBadge = (stage: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      egg: { label: '🥚 蛋', color: 'text-orange-700', bg: 'bg-orange-100' },
      baby: { label: '🐣 幼年', color: 'text-blue-700', bg: 'bg-blue-100' },
      teen: { label: '⭐ 成长', color: 'text-purple-700', bg: 'bg-purple-100' },
      adult: { label: '👑 完全', color: 'text-red-700', bg: 'bg-red-100' },
    };
    const c = config[stage] || config.egg;
    return (
      <span className={`block w-full text-center text-xs font-bold py-1 rounded ${c.bg} ${c.color}`}>
        {c.label}
      </span>
    );
  };

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
            按班级快速筛选，或批量导入学生名单，浏览宠物状态。按姓氏排序，每页展示 20 名学生。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 班级筛选 Tabs（有班级时才显示） */}
          {classes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <School className="w-3.5 h-3.5" />
                按班级筛选
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 全部 */}
                <button
                  onClick={() => handleSelectClass(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedClassId === null
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  全部 <span className="ml-1 opacity-70">{students.length}</span>
                </button>
                {/* 各班级 */}
                {classes.map(cls => {
                  const count = cls.studentNames.filter(n => students.some(s => s.name === n)).length;
                  const isActive = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        isActive
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-background border-border hover:bg-muted text-foreground'
                      }`}
                      style={isActive ? { background: cls.color, borderColor: cls.color } : {}}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-white/70' : ''}`}
                        style={!isActive ? { background: cls.color } : {}}
                      />
                      {cls.name}
                      <span className="ml-1 opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => setShowImport(true)} variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              名单筛选
            </Button>
            {(!showAll || selectedClassId !== null) && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                查看全部 ({students.length}人)
              </Button>
            )}
          </div>

          {/* 当前班级/筛选状态提示 */}
          {selectedClassId && (() => {
            const cls = classes.find(c => c.id === selectedClassId);
            if (!cls) return null;
            return (
              <div
                className="p-3 rounded-lg border flex items-center gap-2"
                style={{ background: `${cls.color}10`, borderColor: `${cls.color}30` }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cls.color }} />
                <div className="text-sm">
                  当前班级：<span className="font-bold" style={{ color: cls.color }}>{cls.name}</span>
                  <span className="text-muted-foreground ml-2">（共 {displayStudents.length} 名学生）</span>
                </div>
              </div>
            );
          })()}

          {/* 名单筛选状态 */}
          {!showAll && filteredNames.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">
                名单筛选: <span className="font-bold text-primary">{filteredNames.length}</span> 名学生
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {selectedClassId
                    ? (() => {
                        const cls = classes.find(c => c.id === selectedClassId);
                        return cls
                          ? <span>🏫 {cls.name}</span>
                          : '📊 学生状态';
                      })()
                    : showAll ? '📊 全部学生状态' : '📋 筛选学生状态'
                  }
                  <Badge variant="secondary" className="ml-2">{displayStudents.length} 人</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    第 {safeCurrentPage} / {totalPages} 页
                  </div>
                  {/* 导出按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCurrentPage}
                    disabled={isExporting}
                    className="gap-1.5 text-xs h-8"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {isExporting ? '导出中...' : '导出当前页'}
                  </Button>
                  {totalPages > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAllPages}
                      disabled={isExporting}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isExporting ? '导出中...' : `导出全部 ${totalPages} 页`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 4:3 横版容器（截图目标） */}
              <div
                ref={gridRef}
                className="aspect-[4/3] w-full border-2 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-purple-50/50 to-pink-50/80"
              >
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
                        {/* 上部区域: 图片(55%) + 信息(45%) */}
                        <div className="flex items-stretch min-h-0" style={{ flex: '9' }}>
                          {/* 左侧: 宝可梦图片 */}
                          <div
                            className="flex items-center justify-center min-h-0 p-0.5"
                            style={{
                              flex: '55',
                              background: `linear-gradient(135deg, ${petType.color}10, ${petType.color}20)`,
                            }}
                          >
                            <img
                              src={imagePath}
                              alt={petType.stages[stage]}
                              className="max-h-full max-w-full w-auto h-auto"
                              style={{
                                filter: stage === 'adult'
                                  ? `drop-shadow(0 2px 8px ${petType.color}60)`
                                  : `drop-shadow(0 1px 3px ${petType.color}30)`,
                              }}
                              draggable={false}
                              crossOrigin="anonymous"
                            />
                          </div>

                          {/* 右侧: 学生姓名 + 宠物状态 */}
          <div className="flex flex-col justify-center items-center px-1 pb-1 min-h-0 overflow-hidden" style={{ flex: '45' }}>
                            <div
                              className="font-bold leading-tight text-gray-800 text-center w-full"
                              style={{
                                fontSize: student.name.length > 3 ? '15px' : student.name.length > 2 ? '16px' : '17px',
                                wordBreak: 'break-all',
                                lineHeight: '1.3',
                              }}
                            >
                              {student.name}
                            </div>
                            <div className="mt-2 leading-tight flex-shrink-0 w-full text-center">
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

      {/* 隐藏的导出容器（用于多页导出时渲染） */}
      <div
        ref={exportContainerRef}
        style={{
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          width: '960px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
