import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentManagement } from '@/sections/StudentManagement';
import { BatchPoints } from '@/sections/BatchPoints';
import { BatchPetAssignment } from '@/sections/BatchPetAssignment';
import { Leaderboard } from '@/sections/Leaderboard';
import { StudentStatusView } from '@/sections/StudentStatusView';
import { PetCreator } from '@/sections/PetCreator';
import { useStudents } from '@/hooks/useStudents';
import { useCustomPets } from '@/hooks/useCustomPets';
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

  // 合并系统宠物和自定义宠物
  const allPetTypes = [...PET_TYPES, ...customPets];

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
    toast.success('已清空所有数据');
  };

  if (!loaded || !customPetsLoaded) {
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-destructive hover:text-destructive"
                >
                  🗑️ 清空数据
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="students" className="gap-1.5">
              👥 学生管理
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

          <TabsContent value="points">
            <BatchPoints
              students={students}
              onBatchAddPoints={batchAddPoints}
              petTypes={allPetTypes}
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
            <StudentStatusView students={students} petTypes={allPetTypes} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard students={students} petTypes={allPetTypes} />
          </TabsContent>

          <TabsContent value="creator">
            <PetCreator allPetTypes={allPetTypes} students={students} onBatchAssignPet={batchAssignPet} />
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
