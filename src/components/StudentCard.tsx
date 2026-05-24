import { useState } from 'react';
import type { Student, PetType } from '@/types/pet';
import { getStageByExperience } from '@/types/pet';
import { Pet } from './Pet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

interface StudentCardProps {
  student: Student;
  petTypes: PetType[];
  onAddPoints: (studentId: string, points: number) => void;
  onDelete: (studentId: string) => void;
  onRename?: (studentId: string, newName: string) => boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function StudentCard({ 
  student,
  petTypes,
  onAddPoints, 
  onDelete, 
  onRename,
  isSelected, 
  onToggleSelect 
}: StudentCardProps) {
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [points, setPoints] = useState(10);
  const [showDelete, setShowDelete] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');
  
  const petType = petTypes.find(p => p.id === student.pet.petTypeId) || petTypes[0];
  const currentStage = getStageByExperience(student.pet.experience);

  const handleAddPoints = () => {
    if (points > 0) {
      onAddPoints(student.id, points);
      setShowAddPoints(false);
      setPoints(10);
    }
  };

  const handleRename = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setRenameError('姓名不能为空');
      return;
    }
    if (trimmed === student.name) {
      setShowRename(false);
      return;
    }
    const success = onRename?.(student.id, trimmed);
    if (success === false) {
      setRenameError('该姓名已存在，请换一个');
      return;
    }
    setShowRename(false);
    setRenameError('');
  };

  return (
    <>
      <Card 
        className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
          isSelected ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
        onClick={onToggleSelect}
      >
        {/* 顶部颜色条 */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: petType.color }}
        />
        
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            {/* 宠物 */}
            <Pet 
              petType={petType}
              stage={currentStage}
              experience={student.pet.experience}
              size="sm"
            />
            
            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg truncate">{student.name}</h3>
                <Badge variant="outline" style={{ color: petType.color, borderColor: petType.color }}>
                  {petType.name}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div>经验值: {student.pet.experience}</div>
                <div>
                  成长阶段: {currentStage === 'egg' && '🥚'}
                  {currentStage === 'baby' && '🐣'}
                  {currentStage === 'teen' && '⭐'}
                  {currentStage === 'adult' && '👑'}
                  {' '}{['蛋', '幼年体', '成长体', '完全体'][['egg', 'baby', 'teen', 'adult'].indexOf(currentStage)]}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddPoints(true);
                  }}
                >
                  ➕ 加分
                </Button>
                {onRename && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewName(student.name);
                      setRenameError('');
                      setShowRename(true);
                    }}
                  >
                    ✏️ 改名
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDelete(true);
                  }}
                >
                  🗑️ 删除
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加分对话框 */}
      <AlertDialog open={showAddPoints} onOpenChange={setShowAddPoints}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>为 {student.name} 加分</AlertDialogTitle>
            <AlertDialogDescription>
              当前经验值: {student.pet.experience}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">加分数量</label>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => setPoints(5)}>+5</Button>
              <Button size="sm" variant="outline" onClick={() => setPoints(10)}>+10</Button>
              <Button size="sm" variant="outline" onClick={() => setPoints(20)}>+20</Button>
              <Button size="sm" variant="outline" onClick={() => setPoints(50)}>+50</Button>
            </div>
            <Input 
              type="number" 
              value={points} 
              onChange={(e) => setPoints(Number(e.target.value))}
              className="mt-2"
              min={1}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddPoints}>确认加分</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生 "{student.name}" 吗？此操作不可撤销，宠物的所有成长记录都将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(student.id);
                setShowDelete(false);
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 改名对话框 */}
      <AlertDialog open={showRename} onOpenChange={(open) => { setShowRename(open); setRenameError(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>修改学生姓名</AlertDialogTitle>
            <AlertDialogDescription>
              当前姓名：{student.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium">新姓名</label>
            <Input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setRenameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              placeholder="请输入新姓名..."
              autoFocus
            />
            {renameError && (
              <p className="text-sm text-destructive">{renameError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRenameError('')}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename}>确认改名</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
