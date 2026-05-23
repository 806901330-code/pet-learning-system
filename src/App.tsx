import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentManagement } from '@/sections/StudentManagement';
import { BatchPoints } from '@/sections/BatchPoints';
import { BatchPetAssignment } from '@/sections/BatchPetAssignment';
import { Leaderboard } from '@/sections/Leaderboard';
import { StudentStatusView } from '@/sections/StudentStatusView';
import { PetCreator } from '@/sections/PetCreator';
import { ClassManagement } from '@/sections/ClassManagement';
import { useStudents } from '@/hooks/useStudents';
import { useCustomPets } from '@/hooks/useCustomPets';
import { useClasses } from '@/hooks/useClasses';
import { PET_TYPES } from '@/types/pet';
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

function App() {
  const [activeTab, setActiveTab] = useState('students');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    students,
    loaded,
    addStudents,
    addPoints,
    batchAddPoints,
    batchAssignPet,
    deleteStudent,
    clearAll,
  } = useStudents();

  const { customPets, loaded: customPetsLoaded } = useCustomPets();

  const {
    classes,
    loaded: classesLoaded,
    createClass,
    renameClass,
    updateClassColor,
    importStudentsToClass,
    removeStudentFromClass,
    deleteClass,
  } = useClasses();

  // 合并系统宠物和自定义宠物
  const allPetTypes = [...PET_TYPES, ...customPets];

  // === 数据同步相关状态 ===
  const [syncing, setSyncing] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const isInitialLoad = useRef(true);

  // 自动导出：数据变更后 2 秒自动写入 public/data/students.json
  useEffect(() => {
    if (!loaded || !customPetsLoaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const payload = {
        students,
        customPets,
        exportedAt: new Date().toISOString(),
      };
      fetch('/api/export-query-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json()).then(result => {
        if (result.ok) {
          setHasPendingSync(true);
          console.log('📤 自动导出:', result.count, '名学生');
        }
      }).catch(() => {
        // 开发服务器不可用，忽略
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [students, customPets, loaded, customPetsLoaded]);

  // 一键同步：构建 + 提交 + 推送
  const handleSync = async () => {
    setSyncing(true);
    try {
      // 先确保最新数据已导出
      const payload = { students, customPets, exportedAt: new Date().toISOString() };
      await fetch('/api/export-query-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await fetch('/api/sync-to-github', { method: 'POST' });
      const result = await res.json();

      if (result.ok) {
        setHasPendingSync(false);
        toast.success('已同步！GitHub Pages 将在 1-2 分钟内更新', {
          description: result.logs?.join(' → ') || '',
          duration: 5000,
        });
      } else {
        toast.error('同步失败', {
          description: result.error || '未知错误',
        });
      }
    } catch {
      toast.error('同步失败，请确保在开发服务器 (localhost:5173) 中运行');
    }
    setSyncing(false);
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
    toast.success('已清空所有数据');
  };

  if (!loaded || !customPetsLoaded || !classesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🥚</div>
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-center" richColors />

      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg">
                🐾
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  宠物养成学习系统
                </h1>
                <p className="text-xs text-muted-foreground">
                  学习 → 积分 → 进化 → 成长
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>👥 {students.length} 名学生</span>
                <span>•</span>
                <span>🐉 {students.filter(s => s.pet.stage === 'adult').length} 只完全体</span>
              </div>
              {students.length > 0 && (
                <>
                  {hasPendingSync && (
                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      待同步
                    </span>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                  >
                    {syncing ? (
                      <span className="flex items-center gap-1.5">
                        <span className="animate-spin">⏳</span> 同步中...
                      </span>
                    ) : (
                      '🔁 一键同步到学生端'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    🗑️ 清空数据
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="students" className="gap-1.5">
              👥 学生管理
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-1.5">
              🏫 分班管理
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-1.5">
              ➕ 批量加分
            </TabsTrigger>
            <TabsTrigger value="pets" className="gap-1.5">
              🎨 分配宠物
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-1.5">
              📋 状态浏览
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5">
              🏆 排行榜
            </TabsTrigger>
            <TabsTrigger value="creator" className="gap-1.5">
              🎨 创作栏
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentManagement
              students={students}
              onAddStudents={addStudents}
              onAddPoints={addPoints}
              onDeleteStudent={deleteStudent}
              petTypes={allPetTypes}
            />
          </TabsContent>

          <TabsContent value="classes">
            <ClassManagement
              classes={classes}
              students={students}
              onCreateClass={createClass}
              onRenameClass={renameClass}
              onUpdateClassColor={updateClassColor}
              onImportStudentsToClass={importStudentsToClass}
              onRemoveStudentFromClass={removeStudentFromClass}
              onDeleteClass={deleteClass}
            />
          </TabsContent>

          <TabsContent value="points">
            <BatchPoints
              students={students}
              onBatchAddPoints={batchAddPoints}
            />
          </TabsContent>

          <TabsContent value="pets">
            <BatchPetAssignment
              students={students}
              onBatchAssignPet={batchAssignPet}
              petTypes={allPetTypes}
            />
          </TabsContent>

          <TabsContent value="status">
            <StudentStatusView students={students} petTypes={allPetTypes} classes={classes} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard students={students} petTypes={allPetTypes} />
          </TabsContent>

          <TabsContent value="creator">
            <PetCreator students={students} onBatchAssignPet={batchAssignPet} />
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部 */}
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <div className="flex justify-center gap-4 mb-2">
          {PET_TYPES.map(pet => (
            <span key={pet.id} title={pet.name}>{pet.emoji}</span>
          ))}
        </div>
        宠物养成学习系统 · 用爱心陪伴成长
      </footer>

      {/* 清空确认 */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ 确认清空所有数据？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有学生和宠物的数据，包括所有经验值和成长记录。此操作不可撤销！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
