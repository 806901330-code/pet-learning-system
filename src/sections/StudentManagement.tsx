import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  students,
  petTypes,
  onAddStudents,
  onAddPoints,
  onDeleteStudent,
  onRenameStudent,
  onSetNickname,
}: StudentManagementProps) {
  const [showImport, setShowImport] = useState(false);
  const [selectedPet, setSelectedPet] = useState(PET_TYPES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = (names: string[]) => {
    const added = onAddStudents(names, selectedPet);
    console.log(`成功添加 ${added} 名学生`);
  };

  // 过滤学生（姓名或昵称匹配）
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q)
      || (s.nickname && s.nickname.toLowerCase().includes(q));
  });

  // 统计各阶段人数
  const stageCount = {
    egg: students.filter(s => s.pet.stage === 'egg').length,
    baby: students.filter(s => s.pet.stage === 'baby').length,
    teen: students.filter(s => s.pet.stage === 'teen').length,
    adult: students.filter(s => s.pet.stage === 'adult').length,
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Button onClick={() => setShowImport(true)} className="gap-2">
            📥 批量导入学生
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">默认宠物:</span>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map(pet => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.emoji} {pet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 搜索 */}
        <input
          type="text"
          placeholder="🔍 搜索姓名或昵称..."
          className="px-4 py-2 rounded-lg border border-input bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl mb-1">🥚</div>
            <div className="text-2xl font-bold">{stageCount.egg}</div>
            <div className="text-sm text-muted-foreground">蛋阶段</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl mb-1">🐣</div>
            <div className="text-2xl font-bold">{stageCount.baby}</div>
            <div className="text-sm text-muted-foreground">幼年体</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-2xl font-bold">{stageCount.teen}</div>
            <div className="text-sm text-muted-foreground">成长体</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl mb-1">👑</div>
            <div className="text-2xl font-bold">{stageCount.adult}</div>
            <div className="text-sm text-muted-foreground">完全体</div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 学生列表
            <Badge variant="secondary">{students.length} 人</Badge>
          </CardTitle>
          <CardDescription>
            点击学生卡片可以单个加分或删除
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {students.length === 0 
                ? '还没有学生，点击上方按钮批量导入吧！' 
                : '没有找到匹配的学生'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  petTypes={petTypes}
                  onAddPoints={onAddPoints}
                  onDelete={onDeleteStudent}
                  onRename={onRenameStudent}
                  onSetNickname={onSetNickname}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 批量导入对话框 */}
      <BatchImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="批量导入学生名单"
        description="每行一个名字，或用逗号、顿号分隔。导入后默认分配选择的宠物。"
        placeholder={"张三\n李四\n王五\n赵六\n或：张三,李四,王五,赵六"}
        onConfirm={handleImport}
      />
    </div>
  );
}
