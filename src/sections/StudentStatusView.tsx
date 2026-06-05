import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import type { Student, PetType } from '@/types/pet';
import { STAGE_CONFIG, getStageByExperience, getPetImagePath, getNextStageExp } from '@/types/pet';
import type { ClassGroup } from '@/hooks/useClasses';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RotateCcw, Users, Download, ImageIcon, School } from 'lucide-react';
import html2canvas from 'html2canvas';

interface StudentStatusViewProps {
  students: Student[];
  petTypes: PetType[];
  classes?: ClassGroup[];
}

const PAGE_SIZE = 20;

/* ── 内联精灵球 SVG ── */
function PokeballWatermark({ color, opacity = 0.06 }: { color: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ opacity }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3" />
      <path d="M4 50 Q50 72 96 50" fill="#EE1515" fillOpacity="0.15" stroke={color} strokeWidth="3" />
      <line x1="4" y1="50" x2="96" y2="50" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="50" r="12" fill="white" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="50" r="5" fill={color} />
    </svg>
  );
}

function PokeballCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ── 姓氏拼音排序 ── */
function sortBySurname(students: Student[]): Student[] {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

/* ── 阶段配色 ── */
const STAGE_COLORS: Record<string, { bg: string; text: string; emoji: string; label: string }> = {
  egg:  { bg: '#fff7ed', text: '#c2410c', emoji: '🥚', label: '蛋' },
  baby: { bg: '#eff6ff', text: '#1d4ed8', emoji: '🐣', label: '幼年' },
  teen: { bg: '#f5f3ff', text: '#6d28d9', emoji: '⭐', label: '成长' },
  adult: { bg: '#fef2f2', text: '#b91c1c', emoji: '👑', label: '完全' },
};

export function StudentStatusView({ students, petTypes, classes = [] }: StudentStatusViewProps) {

  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  /* ── 导出全部页面：state 驱动逐页切换 ── */
  const [exportAllQueue, setExportAllQueue] = useState<number[]>([]);
  const [exportAllCurrent, setExportAllCurrent] = useState<number>(0);
  const isExportAllRef = useRef(false);

  const gridRef = useRef<HTMLDivElement>(null);

  const sortedStudents = useMemo(() => sortBySurname(students), [students]);

  const displayStudents = useMemo(() => {
    let base = sortedStudents;
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        const nameSet = new Set(cls.studentNames);
        base = base.filter(s => nameSet.has(s.name));
      }
    }
    if (!showAll && filteredNames.length > 0) {
      const nameSet = new Set(filteredNames);
      base = base.filter(s => nameSet.has(s.name));
    }
    if (stageFilter) {
      base = base.filter(s => s.pet.stage === stageFilter);
    }
    return base;
  }, [sortedStudents, filteredNames, showAll, selectedClassId, stageFilter, classes]);

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
    if (matched.length > 0) toast.success(`✅ 已筛选 ${matched.length} 名学生`);
    if (unmatched.length > 0) toast.warning(`${unmatched.length} 名学生未找到: ${unmatched.join('、')}`);
  };

  const handleReset = () => {
    setFilteredNames([]);
    setShowAll(true);
    setSelectedClassId(null);
    setStageFilter(null);
    setCurrentPage(1);
  };

  const handleSelectClass = (classId: string | null) => {
    setSelectedClassId(classId);
    setFilteredNames([]);
    setShowAll(true);
    setCurrentPage(1);
  };

  /* ── 导出工具 ── */

  const waitForImages = (container: HTMLElement): Promise<void> => {
    const imgs = container.querySelectorAll('img');
    const imgPromises = Array.from(imgs).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    // 强制等待字体加载（兼容处理）
    const fontReady = (document as any).fonts?.ready?.catch?.(() => {}) || Promise.resolve();
    // 强制同步布局重算，确保 html2canvas 获取正确尺寸
    const forceReflow = () => {
      try { void (container as any).offsetHeight; } catch {}
      container.querySelectorAll('*').forEach(el => { try { void (el as any).offsetHeight; } catch {} });
    };
    return Promise.all([...imgPromises, fontReady]).then(() => {
      forceReflow();
    });
  };

  /* 读取当前主题的实际背景色（html2canvas 不解析 CSS 变量，必须提前求值） */
  const getThemeBgColor = (): string => {
    try {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg').trim();
      if (v) return v;
    } catch {}
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    return isBlue ? '#1e293b' : '#f8fafc';
  };

  const captureAndDownload = async (element: HTMLElement, filename: string) => {
    await waitForImages(element);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: false,           // 关键修复：同域资源不需要 CORS，设为 true 反而导致 canvas 污染
        allowTaint: true,
        backgroundColor: getThemeBgColor(),
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (e: any) {
      console.error('html2canvas 导出失败:', e);
      throw e;
    }
  };

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

  const handleExportAllPages = async () => {
    if (displayStudents.length === 0) return;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setExportAllQueue(pages);
    setExportAllCurrent(0);
    setIsExporting(true);
    isExportAllRef.current = true;
    toast.info(`正在导出 ${totalPages} 页，请稍候...`);
  };

  // 导出全部页面时，逐页切换并捕获
  useEffect(() => {
    if (exportAllQueue.length === 0 || exportAllCurrent >= exportAllQueue.length) {
      if (isExportAllRef.current) {
        isExportAllRef.current = false;
        setIsExporting(false);
        toast.success(`✅ 全部 ${totalPages} 页已导出`);
      }
      return;
    }
    const page = exportAllQueue[exportAllCurrent];
    setCurrentPage(page);
    // 等待 React 重新渲染 + 图片加载
    const timer = setTimeout(async () => {
      if (!gridRef.current) {
        setExportAllCurrent(n => n + 1);
        return;
      }
      try {
        const label = showAll ? '全部' : '筛选';
        const filename = `学生状态-${label}第${page}页-${new Date().toLocaleDateString('zh-CN')}.png`;
        await captureAndDownload(gridRef.current, filename);
      } catch (e: any) {
        console.error('导出第', page, '页失败:', e);
      }
      setExportAllCurrent(n => n + 1);
    }, 300);
    return () => clearTimeout(timer);
  // exportAllQueue.length 必须在依赖里 —— exportAllCurrent 初值 = setExportAllCurrent(0)，
  // React 不触发更新，必须队列长度变化来"唤醒"这个 effect
  }, [exportAllCurrent, exportAllQueue.length]);

  /* ════════════════════════════════════════════════════════
     TCG 卡片渲染函数（浏览器 & 导出共用逻辑）
     ════════════════════════════════════════════════════════ */

  const renderTcgCard = (student: Student) => {
    const petType = petTypes.find(p => p.id === student.pet.petTypeId) || petTypes[0];
    const stage = getStageByExperience(student.pet.experience);
    const imagePath = getPetImagePath(petType.id, stage, petType.pokemonType, petType);
    const sc = STAGE_COLORS[stage] || STAGE_COLORS.egg;
    const nextExp = getNextStageExp(student.pet.experience);
    const stageConf = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
    const progress = nextExp
      ? ((student.pet.experience - stageConf.minExp) / (nextExp - stageConf.minExp)) * 100
      : 100;

    return (
      <div
        key={student.id}
        className="tcg-card cursor-default flex flex-col"
        style={{ background: '#ffffff', aspectRatio: '1' }}
      >
        {/* 类型色条 */}
        <div
          className="tcg-card__type-bar"
          style={{ background: petType.color }}
        />

        {/* 上半部分：左侧信息 + 右侧图片 */}
        <div className="flex flex-row flex-1 min-h-0 p-1 gap-1">
          {/* 左侧：姓名居中 + 底部阶段属性 */}
          <div className="flex flex-col min-w-0" style={{ width: '38%' }}>
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="font-extrabold text-primary font-display leading-relaxed"
                style={{
                  fontSize: student.name.length > 3 ? '16px' : student.name.length > 2 ? '18px' : '20px',
                  lineHeight: '1.8',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  overflow: 'visible',
                }}
              >
                {student.name}
              </div>
            </div>
            <div className="flex gap-1 flex-wrap shrink-0">
              <span
                className="text-[9px] font-extrabold font-display leading-none rounded px-1.5 py-[2px]"
                style={{ background: sc.bg, color: sc.text }}
              >
                {sc.emoji} {sc.label}
              </span>
              <span
                className="type-tag type-tag--sm text-[9px]"
                style={{ background: `${petType.color}15`, color: petType.color }}
              >
                {petType.pokemonType}
              </span>
            </div>
          </div>

          {/* 右侧：宠物图片（占更大面积） */}
          <div
            className="relative flex items-center justify-center rounded-xl overflow-hidden flex-1"
            style={{
              background: `radial-gradient(ellipse at 50% 55%, ${petType.color}18 0%, ${petType.color}08 50%, transparent 85%)`,
              border: `1.5px solid ${petType.color}30`,
            }}
          >
            <PokeballWatermark color={petType.color} opacity={0.05} />
            <img
              src={imagePath}
              alt={petType.stages[stage]}
              className="relative z-10 object-contain"
              style={{ maxWidth: '85%', maxHeight: '85%' }}
              draggable={false}
            />
            <PokeballCorner className="absolute bottom-1 right-1 w-4 h-4 opacity-[0.06]" style={{ color: petType.color }} />
          </div>
        </div>

        {/* 底部：EXP 进度条（全宽） */}
        <div className="shrink-0 px-2 pb-1.5">
          <div className="hp-bar mb-0.5">
            <div
              className="hp-bar-fill hp-bar-fill-mid"
              style={{ width: `${Math.min(100, Math.max(2, progress))}%`, background: petType.color }}
            />
          </div>
          <div className="text-[9px] text-center font-bold" style={{ color: '#9ca3af' }}>
            EXP {student.pet.experience}{nextExp ? `/${nextExp}` : ''}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════
     UI
     ════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* 操作区 */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-game text-xs text-primary">
            📋 学生图鉴
          </CardTitle>
          <CardDescription className="font-semibold text-primary/50">
            按班级快速筛选，或批量导入学生名单，浏览宠物状态。按姓氏排序，每页展示 20 名学生。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 班级筛选 Tabs */}
          {classes.length > 0 && (
            <div>
              <div className="text-xs font-extrabold text-primary/50 mb-2 flex items-center gap-1 font-display">
                <School className="w-3.5 h-3.5" />
                按班级筛选
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectClass(null)}
                  className={`game-btn text-xs !py-1.5 !px-3 !rounded-full ${
                    selectedClassId === null ? 'game-btn-yellow' : 'game-btn-outline'
                  }`}
                >
                  全部 <span className="ml-1 opacity-60">{students.length}</span>
                </button>
                {classes.map(cls => {
                  const count = cls.studentNames.filter(n => students.some(s => s.name === n)).length;
                  const isActive = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls.id)}
                      className={`game-btn text-xs !py-1.5 !px-3 !rounded-full ${
                        isActive ? 'game-btn-blue' : 'game-btn-outline'
                      }`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: cls.color }} />
                      {cls.name}
                      <span className="ml-1 opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <button
              className="game-btn game-btn-outline text-xs !py-2 !px-4 !gap-1.5 !rounded-xl"
              onClick={() => setShowImport(true)}
            >
              <Users className="w-4 h-4" />
              名单筛选
            </button>

            {/* 阶段筛选按钮 */}
            {[
              { key: 'egg', emoji: '🥚', label: '蛋', count: stageStats.egg, colors: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' } },
              { key: 'baby', emoji: '🐣', label: '幼年', count: stageStats.baby, colors: { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' } },
              { key: 'teen', emoji: '⭐', label: '成长', count: stageStats.teen, colors: { bg: '#f5f3ff', text: '#6d28d9', border: '#ede9fe' } },
              { key: 'adult', emoji: '👑', label: '完全', count: stageStats.adult, colors: { bg: '#fef2f2', text: '#b91c1c', border: '#fee2e2' } },
            ].map(s => {
              const isActive = stageFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStageFilter(isActive ? null : s.key)}
                  className="flex items-center gap-1.5 text-xs font-extrabold rounded-lg py-1.5 px-2.5 transition-all hover:scale-[1.02] cursor-pointer border-2 shrink-0"
                  style={{
                    background: isActive ? s.colors.text : s.colors.bg,
                    color: isActive ? '#fff' : s.colors.text,
                    borderColor: s.colors.text,
                    boxShadow: isActive ? `0 0 12px ${s.colors.text}30` : 'none',
                  }}
                >
                  <span className="text-sm">{s.emoji}</span>
                  <span>{s.label}</span>
                  <span className="opacity-70">{s.count}</span>
                </button>
              );
            })}

            {(!showAll || selectedClassId !== null || stageFilter) && (
              <button
                className="game-btn game-btn-blue text-xs !py-2 !px-4 !gap-1.5 !rounded-xl"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
                查看全部 ({students.length}人)
              </button>
            )}
          </div>

          {/* 班级提示 */}
          {selectedClassId && (() => {
            const cls = classes.find(c => c.id === selectedClassId);
            if (!cls) return null;
            return (
              <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: `${cls.color}08`, borderColor: `${cls.color}30` }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cls.color }} />
                <div className="text-sm font-semibold">
                  当前班级：<span className="font-extrabold" style={{ color: cls.color }}>{cls.name}</span>
                  <span className="text-primary/40 ml-2">（共 {displayStudents.length} 名学生）</span>
                </div>
              </div>
            );
          })()}

          {/* 名单筛选状态 */}
          {!showAll && filteredNames.length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-accent-soft)' }}>
              <div className="text-sm font-semibold text-primary/50 mb-1">
                名单筛选: <span className="font-extrabold text-primary">{filteredNames.length}</span> 名学生
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

      {/* ── 4:3 TCG 网格 ── */}
      {displayStudents.length === 0 ? (
        <Card className="game-card">
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-extrabold text-primary/40 font-display">
              {students.length === 0 ? '还没有学生数据，快去添加学生吧！' : '没有找到匹配的学生'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="game-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2 font-game text-xs text-primary">
                  {selectedClassId
                    ? (() => {
                        const cls = classes.find(c => c.id === selectedClassId);
                        return cls ? <span>🏫 {cls.name}</span> : '📊 学生状态';
                      })()
                    : showAll ? '📊 全部学生状态' : '📋 筛选学生状态'
                  }
                  <Badge variant="secondary" className="ml-2 text-[10px] font-extrabold">{displayStudents.length} 人</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-primary/40 font-display">
                    第 {safeCurrentPage} / {totalPages} 页
                  </span>
                  <button
                    className="game-btn game-btn-yellow text-xs !py-1.5 !px-3 !gap-1.5 !rounded-xl"
                    onClick={handleExportCurrentPage}
                    disabled={isExporting}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {isExporting ? '导出中...' : '导出当前页'}
                  </button>
                  {totalPages > 1 && (
                    <button
                      className="game-btn game-btn-blue text-xs !py-1.5 !px-3 !gap-1.5 !rounded-xl"
                      onClick={handleExportAllPages}
                      disabled={isExporting}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isExporting ? '导出中...' : `导出全部 ${totalPages} 页`}
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 4:3 横版容器 · 5×4 网格 */}
                <div
                  ref={gridRef}
                  className="aspect-[4/3] w-full rounded-2xl p-2"
                  style={{ background: 'var(--color-bg)' }}
                >
                <div className="h-full grid grid-cols-5 grid-rows-4 gap-1.5">
                  {pageStudents.map(renderTcgCard)}

                  {/* 填充空白格子 */}
                  {Array.from({ length: Math.max(0, PAGE_SIZE - pageStudents.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="rounded-lg border border-dashed border-gray-200/40" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                className="game-btn game-btn-outline text-xs !py-1.5 !px-3 !rounded-xl"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 7) {
                    if (page === 1 || page === totalPages || (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1)) {
                      return (
                        <button
                          key={page}
                          className={`game-btn text-xs !w-8 !h-8 !p-0 !rounded-lg ${
                            safeCurrentPage === page ? 'game-btn-yellow' : 'game-btn-outline'
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === safeCurrentPage - 2 || page === safeCurrentPage + 2) {
                      return <span key={page} className="text-primary/30 font-extrabold text-sm">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      className={`game-btn text-xs !w-8 !h-8 !p-0 !rounded-lg ${
                        safeCurrentPage === page ? 'game-btn-yellow' : 'game-btn-outline'
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                className="game-btn game-btn-outline text-xs !py-1.5 !px-3 !rounded-xl"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* 批量导入对话框 */}
    </div>
  );
}
