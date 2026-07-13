import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Upload, X, School } from 'lucide-react';
import type { ClassGroup } from '@/hooks/useClasses';
import { CLASS_COLORS } from '@/hooks/useClasses';
import type { Student, PetType } from '@/types/pet';
import { FactionPK } from './FactionPK';

interface ClassManagementProps {
  classes: ClassGroup[];
  students: Student[];
  petTypes: PetType[];
  onCreateClass: (name: string, studentNames: string[]) => ClassGroup;
  onRenameClass: (classId: string, newName: string) => void;
  onUpdateClassColor: (classId: string, color: string) => void;
  onImportStudentsToClass: (classId: string, studentNames: string[], mode: 'replace' | 'append') => void;
  onRemoveStudentFromClass: (classId: string, studentName: string) => void;
  onDeleteClass: (classId: string) => void;
}

// 解析名单文本（支持换行、逗号、顿号分隔）
function parseNames(text: string): string[] {
  return text
    .split(/[\n,，、\s]+/)
    .map(n => n.trim())
    .filter(Boolean);
}

export function ClassManagement({
  classes,
  students,
  petTypes,
  onCreateClass,
  onRenameClass,
  onUpdateClassColor,
  onImportStudentsToClass,
  onRemoveStudentFromClass,
  onDeleteClass,
}: ClassManagementProps) {
  // 新建班级对话框
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createNames, setCreateNames] = useState('');

  // 编辑班级名称
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 导入学生到班级
  const [importingClassId, setImportingClassId] = useState<string | null>(null);
  const [importNames, setImportNames] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // 删除班级确认
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // 展开的班级（查看学生列表）
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const studentNameSet = new Set(students.map(s => s.name));

  // ── 创建班级 ──────────────────────────────────────────────────────────────
  const handleCreate = () => {
    const name = createName.trim();
    if (!name) { toast.error('请输入班级名称'); return; }
    const names = parseNames(createNames);
    onCreateClass(name, names);
    const matched = names.filter(n => studentNameSet.has(n));
    const unmatched = names.filter(n => !studentNameSet.has(n));
    toast.success(`✅ 已创建班级「${name}」，包含 ${matched.length} 名学生`);
    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} 名学生未在系统中找到：${unmatched.slice(0, 5).join('、')}${unmatched.length > 5 ? '...' : ''}`);
    }
    setCreateName('');
    setCreateNames('');
    setShowCreate(false);
  };

  // ── 重命名班级 ────────────────────────────────────────────────────────────
  const handleRename = (classId: string) => {
    const name = editingName.trim();
    if (!name) { toast.error('班级名称不能为空'); return; }
    onRenameClass(classId, name);
    setEditingId(null);
    toast.success('✅ 班级名称已更新');
  };

  // ── 导入学生到班级 ────────────────────────────────────────────────────────
  const handleImport = () => {
    if (!importingClassId) return;
    const names = parseNames(importNames);
    if (names.length === 0) { toast.error('请输入学生名单'); return; }
    const matched = names.filter(n => studentNameSet.has(n));
    const unmatched = names.filter(n => !studentNameSet.has(n));
    onImportStudentsToClass(importingClassId, names, importMode);
    toast.success(`✅ 已${importMode === 'replace' ? '覆盖' : '追加'} ${matched.length} 名学生`);
    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} 名未找到：${unmatched.slice(0, 5).join('、')}${unmatched.length > 5 ? '...' : ''}`);
    }
    setImportingClassId(null);
    setImportNames('');
  };

  const importingClass = classes.find(c => c.id === importingClassId);
  const deletingClass = classes.find(c => c.id === deletingClassId);

  return (
    <div className="space-y-6">
      {/* 操作区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5" />
            班级管理
          </CardTitle>
          <CardDescription>
            创建自定义班级，通过批量导入学生姓名进行分班。在「状态浏览」中可按班级筛选查看。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            新建班级
          </Button>
        </CardContent>
      </Card>

      {/* 班级列表 */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="text-5xl mb-4">🏫</div>
            <div className="font-medium mb-1">还没有班级</div>
            <div className="text-sm">点击「新建班级」开始创建</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(cls => {
            const validStudents = cls.studentNames.filter(n => studentNameSet.has(n));
            const invalidStudents = cls.studentNames.filter(n => !studentNameSet.has(n));
            const isExpanded = expandedId === cls.id;

            return (
              <Card key={cls.id} className="overflow-hidden">
                {/* 班级色条 */}
                <div style={{ height: '4px', background: cls.color }} />
                <CardContent className="pt-4 pb-3 space-y-3">
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* 颜色选择器 */}
                      <div className="relative">
                        <div
                          className="w-5 h-5 rounded-full cursor-pointer border-2 border-white shadow flex-shrink-0"
                          style={{ background: cls.color }}
                          title="点击更换颜色"
                        />
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5"
                          value={cls.color}
                          onChange={e => onUpdateClassColor(cls.id, e.target.value)}
                        >
                          {CLASS_COLORS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {editingId === cls.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(cls.id); if (e.key === 'Escape') setEditingId(null); }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleRename(cls.id)}>保存</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>取消</Button>
                        </div>
                      ) : (
                        <div className="font-bold text-base truncate">{cls.name}</div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        title="编辑名称"
                        onClick={() => { setEditingId(cls.id); setEditingName(cls.name); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        title="导入学生"
                        onClick={() => { setImportingClassId(cls.id); setImportNames(''); setImportMode('replace'); }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-destructive hover:text-destructive"
                        title="删除班级"
                        onClick={() => setDeletingClassId(cls.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 学生数量统计 */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      <span className="font-bold text-foreground">{validStudents.length}</span> 名有效学生
                      {invalidStudents.length > 0 && (
                        <span className="text-amber-500 ml-1">（{invalidStudents.length} 名未找到）</span>
                      )}
                    </span>
                    <button
                      className="ml-auto text-xs text-primary hover:underline"
                      onClick={() => setExpandedId(isExpanded ? null : cls.id)}
                    >
                      {isExpanded ? '收起' : '查看学生'}
                    </button>
                  </div>

                  {/* 展开的学生列表 */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t">
                      {cls.studentNames.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-2">暂无学生</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                          {cls.studentNames.map(name => (
                            <div key={name} className="flex items-center gap-0.5">
                              <Badge
                                variant={studentNameSet.has(name) ? 'secondary' : 'outline'}
                                className={`text-xs ${!studentNameSet.has(name) ? 'text-amber-500 border-amber-300' : ''}`}
                              >
                                {name}
                              </Badge>
                              <button
                                className="text-muted-foreground hover:text-destructive p-0.5 rounded"
                                onClick={() => onRemoveStudentFromClass(cls.id, name)}
                                title="从班级移除"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          阵营 PK · 班级下方
          ═══════════════════════════════════════════════════════ */}
      <div className="mt-2">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-game text-primary tracking-tight">⚔️ 阵营 PK</h2>
          <span
            className="px-3 py-1 rounded-xl text-primary text-xs font-extrabold font-display border-2"
            style={{ backgroundColor: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-soft)' }}
          >
            团队对战
          </span>
        </div>
        <FactionPK classes={classes} students={students} petTypes={petTypes} />
      </div>

      {/* ── 新建班级对话框 ────────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">班级名称 *</label>
              <Input
                placeholder="例如：周六班A组、高年级班..."
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                学生名单
                <span className="text-muted-foreground font-normal ml-2 text-xs">（可选，支持换行/逗号/顿号分隔）</span>
              </label>
              <Textarea
                placeholder={"张三\n李四\n王五\n或：张三,李四,王五"}
                value={createNames}
                onChange={e => setCreateNames(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              {createNames && (
                <div className="text-xs text-muted-foreground mt-1">
                  已识别 {parseNames(createNames).length} 个姓名
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate}>创建班级</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 导入学生对话框 ─────────────────────────────────────────────────────── */}
      <Dialog open={!!importingClassId} onOpenChange={open => !open && setImportingClassId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              导入学生 → {importingClass?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${importMode === 'replace' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                onClick={() => setImportMode('replace')}
              >
                🔄 覆盖（清空重导）
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${importMode === 'append' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                onClick={() => setImportMode('append')}
              >
                ➕ 追加（保留原有）
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                学生名单
                <span className="text-muted-foreground font-normal ml-2 text-xs">（支持换行/逗号/顿号分隔）</span>
              </label>
              <Textarea
                placeholder={"张三\n李四\n王五\n或：张三,李四,王五"}
                value={importNames}
                onChange={e => setImportNames(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                autoFocus
              />
              {importNames && (
                <div className="text-xs text-muted-foreground mt-1">
                  已识别 {parseNames(importNames).length} 个姓名
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportingClassId(null)}>取消</Button>
            <Button onClick={handleImport}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 删除班级确认 ───────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deletingClassId} onOpenChange={open => !open && setDeletingClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除班级「{deletingClass?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除班级及其分班记录，学生本身的数据不受影响。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingClassId) { onDeleteClass(deletingClassId); setDeletingClassId(null); toast.success('班级已删除'); } }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
