import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Student, PetType } from '@/types/pet';
import { PET_TYPES, getPetImagePath } from '@/types/pet';
import { toast } from 'sonner';

interface BatchPetAssignmentProps {
  students: Student[];
  petTypes: PetType[];
  onBatchAssignPet: (studentIds: string[], petTypeId: string) => void;
}

export function BatchPetAssignment({ students, petTypes, onBatchAssignPet }: BatchPetAssignmentProps) {
  const [selectedPet, setSelectedPet] = useState(PET_TYPES[0].id);
  const [namesText, setNamesText] = useState('');

  const handleAssign = () => {
    const names = namesText
      .split(/[\n,，;；、\t]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      toast.error('请输入学生名单');
      return;
    }

    const nameSet = new Set(names.map(n => n.trim()));
    const matched = students.filter(s =>
      nameSet.has(s.name) || (s.nickname && nameSet.has(s.nickname))
    );
    const unmatched = names.filter(n => {
      const trimmed = n.trim();
      return !students.some(s => s.name === trimmed || s.nickname === trimmed);
    });

    if (matched.length > 0) {
      onBatchAssignPet(
        matched.map(s => s.id),
        selectedPet
      );
      const petName = petTypes.find(p => p.id === selectedPet)?.name || '';
      toast.success(`✅ 成功为 ${matched.length} 名学生分配 ${petName}`);
    }

    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length}名学生未找到: ${unmatched.join('、')}`);
    }
  };

  const handleSelectAll = () => {
    const allNames = students.map(s => s.name).join('\n');
    setNamesText(allNames);
    toast.success(`已加载全部 ${students.length} 名学生`);
  };

  const selectedPetType = petTypes.find(p => p.id === selectedPet)!;

  return (
    <div className="space-y-6">
      {/* 宠物选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 批量分配宠物
          </CardTitle>
          <CardDescription>
            输入学生名单并选择宝可梦类型，批量为学生分配宠物。已有的经验值和成长阶段会保留。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 宝可梦选择网格 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">选择宠物</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {petTypes.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                    selectedPet === pet.id
                      ? 'border-primary shadow-md scale-[1.02]'
                      : 'border-transparent bg-secondary/50 hover:border-muted-foreground/20'
                  }`}
                  style={selectedPet === pet.id ? { borderColor: pet.color } : {}}
                >
                  <img 
                    src={getPetImagePath(pet.id, 'baby', pet.pokemonType, pet)}
                    alt={pet.name}
                    className="w-14 h-14 object-contain"
                    draggable={false}
                  />
                  <div className="text-center">
                    <div className="font-bold text-sm">{pet.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      →{pet.stages.teen}→{pet.stages.adult}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 选中宠物的进化链预览 */}
          {selectedPetType && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary/30">
              <img 
                src={getPetImagePath(selectedPetType.id, 'egg', selectedPetType.pokemonType, selectedPetType)}
                alt="蛋"
                className="w-12 h-12 object-contain"
                draggable={false}
              />
              <span className="text-muted-foreground text-lg">→</span>
              <img 
                src={getPetImagePath(selectedPetType.id, 'baby', selectedPetType.pokemonType, selectedPetType)}
                alt={selectedPetType.stages.baby}
                className="w-14 h-14 object-contain"
                draggable={false}
              />
              <span className="text-muted-foreground text-lg">→</span>
              <img 
                src={getPetImagePath(selectedPetType.id, 'teen', selectedPetType.pokemonType, selectedPetType)}
                alt={selectedPetType.stages.teen}
                className="w-16 h-16 object-contain"
                draggable={false}
              />
              <span className="text-muted-foreground text-lg">→</span>
              <img 
                src={getPetImagePath(selectedPetType.id, 'adult', selectedPetType.pokemonType, selectedPetType)}
                alt={selectedPetType.stages.adult}
                className="w-18 h-18 object-contain"
                draggable={false}
              />
            </div>
          )}

          {/* 学生名单输入 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">输入学生名单</label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                📋 选择全部学生 ({students.length}人)
              </Button>
            </div>
            <Textarea
              placeholder={"张三\n李四\n王五\n赵六\n或：张三,李四,王五,赵六\n💡 输入姓名或昵称均可匹配"}
              className="min-h-[150px]"
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
            />
            {namesText.trim() && (
              <div className="text-sm text-muted-foreground">
                已输入 <span className="font-bold text-primary">
                  {namesText.split(/[\n,，;；、\t]+/).filter(n => n.trim()).length}
                </span> 个名字
              </div>
            )}
          </div>

          <Button 
            onClick={handleAssign}
            className="gap-2"
            style={{ 
              background: selectedPetType?.color,
            }}
          >
            {selectedPetType?.emoji} 确认分配 {selectedPetType?.name}
          </Button>
        </CardContent>
      </Card>

      {/* 当前宠物分布 */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 当前宠物分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {petTypes.map(pet => {
                const count = students.filter(s => s.pet.petTypeId === pet.id).length;
                return (
                  <div 
                    key={pet.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                  >
                    <img 
                      src={getPetImagePath(pet.id, 'baby', pet.pokemonType, pet)}
                      alt={pet.name}
                      className="w-8 h-8 object-contain"
                      draggable={false}
                    />
                    <div>
                      <div className="text-sm font-medium">{pet.name}</div>
                      <div className="text-xs text-muted-foreground">{count} 人</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
