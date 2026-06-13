import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BatchImportDialog } from '@/components/BatchImportDialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Student } from '@/types/pet';
import { getStageByExperience } from '@/types/pet';
import type { ClassGroup } from '@/hooks/useClasses';
import { toast } from 'sonner';

interface BatchPointsProps {
  students: Student[];
  classes: ClassGroup[];
  onBatchAddPoints: (studentIds: string[], points: number) => void;
}

export function BatchPoints({ students, classes, onBatchAddPoints }: BatchPointsProps) {
  const [showImport, setShowImport] = useState(false);
  const [points, setPoints] = useState(10);
  const [classPoints, setClassPoints] = useState(10);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // 常用分数选项
  const quickPoints = [1, 2, 3, 5, 10, 20, 50];

  // ============ 按班级加分 ============

  // 获取某班级内匹配的学生
  const getClassStudents = (classId: string): Student[] => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return [];
    const nameSet = new Set(cls.studentNames.map(n => n.trim()));
    return students.filter(s => nameSet.has(s.name) || (s.nickname && nameSet.has(s.nickname)));
  };

  // 按班级加分
  const handleClassAddPoints = () => {
    if (!selectedClassId) { toast.error('请先选择班级'); return; }
    const matched = getClassStudents(selectedClassId);
    if (matched.length === 0) {
      toast.error('该班级没有匹配到有效学生，请检查分班名单');
      return;
    }

    const cls = classes.find(c => c.id === selectedClassId)!;
    onBatchAddPoints(matched.map(s => s.id), classPoints);

    // 显示进化信息
    const evolved = matched.filter(s => {
      const oldStage = getStageByExperience(s.pet.experience);
      const newStage = getStageByExperience(s.pet.experience + classPoints);
      return oldStage !== newStage;
    });
    if (evolved.length > 0) {
      toast.success(`🎉 ${evolved.length}名学生宠物进化了！`, {
        description: evolved.map(s => s.name).join('、') + ' 的宠物升级了！',
        duration: 5000,
      });
    }
    toast.success(`✅ 已为「${cls.name}」${matched.length}名学生各加 ${classPoints} 分`);
  };

  // ============ 按姓名批量加分（原有逻辑）============

  // 确认批量加分
  const handleConfirmPoints = (names: string[]) => {
    const nameSet = new Set(names.map(n => n.trim()));
    const matched = students.filter(s =>
      nameSet.has(s.name) || (s.nickname && nameSet.has(s.nickname))
    );
    const unmatched = names.filter(n => {
      const trimmed = n.trim();
      return !students.some(s => s.name === trimmed || s.nickname === trimmed);
    });

    if (matched.length > 0) {
      onBatchAddPoints(matched.map(s => s.id), points);
      
      // 显示进化信息
      const evolved = matched.filter(s => {
        const oldStage = getStageByExperience(s.pet.experience);
        const newStage = getStageByExperience(s.pet.experience + points);
        return oldStage !== newStage;
      });

      if (evolved.length > 0) {
        toast.success(`🎉 ${evolved.length}名学生宠物进化了！`, {
          description: evolved.map(s => s.name).join('、') + ' 的宠物升级了！',
          duration: 5000,
        });
      }
    }

    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length}名学生未找到: ${unmatched.join('、')}`);
    }

    toast.success(`✅ 成功为 ${matched.length} 名学生加 ${points} 分`);
  };

  return (
    <div className="space-y-6">
      {/* 加分操作区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ➕ 批量加分
          </CardTitle>
          <CardDescription>
            输入学生名单和加分数量，批量为学生增加经验值。宠物在经验达到阈值时会自动进化！
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 分数设置 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">选择加分数量</label>
            <div className="flex flex-wrap gap-2">
              {quickPoints.map(p => (
                <Button
                  key={p}
                  variant={points === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPoints(p)}
                >
                  +{p}分
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
              className="w-32"
              min={1}
              placeholder="自定义分数"
            />
          </div>

          {/* 学生名单输入 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">输入学生名单</label>
            <Textarea
              placeholder={"张三\n李四\n王五\n赵六\n或：张三,李四,王五,赵六\n💡 输入姓名或昵称均可匹配"}
              className="min-h-[120px]"
              id="batch-points-textarea"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => {
                const textarea = document.getElementById('batch-points-textarea') as HTMLTextAreaElement;
                if (textarea) {
                  const names = textarea.value.split(/[\n,，;；、\t]+/).map(n => n.trim()).filter(n => n);
                  if (names.length === 0) {
                    toast.error('请输入学生名单');
                    return;
                  }
                  handleConfirmPoints(names);
                }
              }}
              className="gap-2"
            >
              ⚡ 确认加分 (+{points})
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowImport(true)}
              className="gap-2"
            >
              📥 从弹窗导入
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          按班级加分
          ═══════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏫 按班级加分
          </CardTitle>
          <CardDescription>
            选择一个班级，为该班级内所有学生统一增加经验值
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 班级选择 + 分数设置 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择班级</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full h-10 text-sm font-bold border-2 border-primary/20 rounded-xl">
                  <SelectValue placeholder="-- 请选择班级 --" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      暂无班级，请先在「道馆」中创建
                    </div>
                  ) : (
                    classes.map(cls => {
                      const count = getClassStudents(cls.id).length;
                      return (
                        <SelectItem key={cls.id} value={cls.id} className="font-semibold">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ background: cls.color }}
                            />
                            {cls.name}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {count}人
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">选择加分数量</label>
              <div className="flex flex-wrap gap-1.5">
                {quickPoints.map(p => (
                  <Button
                    key={p}
                    variant={classPoints === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setClassPoints(p)}
                  >
                    +{p}分
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={classPoints}
                onChange={(e) => setClassPoints(Math.max(1, Number(e.target.value)))}
                className="w-32"
                min={1}
                placeholder="自定义"
              />
            </div>
          </div>

          {/* 确认按钮 + 预览人数 */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleClassAddPoints}
              className="gap-2"
              disabled={!selectedClassId}
            >
              ⚡ 为全班加分 (+{classPoints})
            </Button>
            {selectedClassId && (
              <span className="text-sm text-muted-foreground">
                将影响 <span className="font-bold text-primary">{getClassStudents(selectedClassId).length}</span> 名学生
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 进化阶段说明 */}
      <Card>
        <CardHeader>
          <CardTitle>📊 成长阶段说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="text-3xl mb-2">🥚</div>
              <div className="font-bold">蛋阶段</div>
              <div className="text-sm text-muted-foreground">0 - 99 经验</div>
              <div className="text-xs text-muted-foreground mt-1">开始学习的旅程</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-3xl mb-2">🐣</div>
              <div className="font-bold">幼年体</div>
              <div className="text-sm text-muted-foreground">100 - 299 经验</div>
              <div className="text-xs text-muted-foreground mt-1">第一次破壳蜕变</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-3xl mb-2">🦊</div>
              <div className="font-bold">成长体</div>
              <div className="text-sm text-muted-foreground">300 - 599 经验</div>
              <div className="text-xs text-muted-foreground mt-1">持续努力在成长</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-3xl mb-2">🐉</div>
              <div className="font-bold">完全体</div>
              <div className="text-sm text-muted-foreground">600+ 经验</div>
              <div className="text-xs text-muted-foreground mt-1">荣耀终极形态</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量导入对话框 */}
      <BatchImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="批量加分 - 导入学生名单"
        description={`将为导入的学生每人加 ${points} 分经验值，支持姓名或昵称匹配`}
        placeholder={"张三\n李四\n王五\n赵六"}
        onConfirm={handleConfirmPoints}
      />
    </div>
  );
}
