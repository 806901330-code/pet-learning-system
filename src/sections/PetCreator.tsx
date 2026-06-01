import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { PetType, PokemonType, Student } from '@/types/pet';
import { PET_TYPES, getPetImagePath } from '@/types/pet';
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

interface PetCreatorProps {
  students: Student[];
  onBatchAssignPet: (studentIds: string[], petTypeId: string) => void;
  customPets: PetType[];
  onCreateCustomPet: (
    name: string, eggType: PokemonType,
    babyImage: string | null, teenImage: string | null, adultImage: string | null,
    babyName?: string, teenName?: string, adultName?: string, color?: string,
  ) => PetType;
  onDeleteCustomPet: (petId: string) => void;
}

function ImageUploader({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  placeholder: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 限制大小 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className="relative border-2 border-dashed rounded-xl p-3 cursor-pointer hover:border-red-300 hover:bg-red-50/50 transition-all group min-h-[100px] flex flex-col items-center justify-center"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <div className="relative w-full flex flex-col items-center">
            <img
              src={value}
              alt={label}
              className="h-20 object-contain mb-1 rounded-lg"
              draggable={false}
            />
            <span className="text-xs text-muted-foreground">点击更换图片</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <span className="text-lg">📷</span>
            </div>
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive text-xs h-7"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
        >
          🗑️ 移除
        </Button>
      )}
    </div>
  );
}

export function PetCreator({ students, onBatchAssignPet, customPets, onCreateCustomPet, onDeleteCustomPet }: PetCreatorProps) {
  const [name, setName] = useState('');
  const [babyImage, setBabyImage] = useState<string | null>(null);
  const [teenImage, setTeenImage] = useState<string | null>(null);
  const [adultImage, setAdultImage] = useState<string | null>(null);
  const [selectedEggType, setSelectedEggType] = useState<PokemonType>('grass');
  const [babyName, setBabyName] = useState('');
  const [teenName, setTeenName] = useState('');
  const [adultName, setAdultName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PetType | null>(null);
  const [previewPet, setPreviewPet] = useState<PetType | null>(null);
  const [assignPet, setAssignPet] = useState<PetType | null>(null);
  const [assignNames, setAssignNames] = useState('');

  const eggTypes: { type: PokemonType; label: string; preview: string }[] = [
    { type: 'grass', label: '🟢 草属性', preview: './pokemon/egg_grass.png' },
    { type: 'fire', label: '🔴 火属性', preview: './pokemon/egg_fire.png' },
    { type: 'water', label: '🔵 水属性', preview: './pokemon/egg_water.png' },
    { type: 'bug', label: '🐛 虫属性', preview: './pokemon/egg_bug.png' },
    { type: 'flying', label: '🟣 飞行属性', preview: './pokemon/egg_flying.png' },
    { type: 'normal', label: '🟠 普通属性', preview: './pokemon/egg_normal.png' },
    { type: 'electric', label: '⚡ 电属性', preview: './pokemon/egg_electric.png' },
    { type: 'ice', label: '❄️ 冰属性', preview: './pokemon/egg_ice.png' },
    { type: 'fighting', label: '👊 格斗属性', preview: './pokemon/egg_fighting.png' },
    { type: 'ghost', label: '👻 幽灵属性', preview: './pokemon/egg_ghost.png' },
    { type: 'rock', label: '🪨 岩石属性', preview: './pokemon/egg_rock.png' },
    { type: 'dragon', label: '🐉 龙属性', preview: './pokemon/egg_dragon.png' },
  ];

  const handleCreate = () => {
    if (!name.trim()) {
      alert('请输入宠物名称');
      return;
    }
    if (!babyImage && !teenImage && !adultImage) {
      alert('请至少上传一个阶段的图片');
      return;
    }

    onCreateCustomPet(
      name.trim(),
      selectedEggType,
      babyImage,
      teenImage,
      adultImage,
      babyName.trim() || undefined,
      teenName.trim() || undefined,
      adultName.trim() || undefined,
    );

    // 重置表单
    setName('');
    setBabyImage(null);
    setTeenImage(null);
    setAdultImage(null);
    setBabyName('');
    setTeenName('');
    setAdultName('');
  };

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteCustomPet(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAssign = () => {
    if (!assignPet) return;
    const names = assignNames
      .split(/[\n,，;；、\t]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      toast.error('请输入学生名单');
      return;
    }

    const matched = students.filter(s => names.includes(s.name));
    const unmatched = names.filter(n => !students.some(s => s.name === n));

    if (matched.length > 0) {
      onBatchAssignPet(matched.map(s => s.id), assignPet.id);
      toast.success(`✅ 成功为 ${matched.length} 名学生分配「${assignPet.name}」`);
    }

    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} 名学生未找到: ${unmatched.join('、')}`);
    }

    setAssignPet(null);
    setAssignNames('');
  };

  const handleAssignAll = () => {
    if (!assignPet || students.length === 0) return;
    onBatchAssignPet(students.map(s => s.id), assignPet.id);
    toast.success(`✅ 成功为全部 ${students.length} 名学生分配「${assignPet.name}」`);
    setAssignPet(null);
    setAssignNames('');
  };

  return (
    <div className="space-y-6">
      {/* 创建新宠物表单 */}
      <Card className="border-2 border-dashed border-red-300 bg-gradient-to-br from-red-50/50 to-amber-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            创作新宠物
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            为你的课堂创作独一无二的精灵宠物！上传三个成长阶段的造型，设定名称即可。
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：基本信息 */}
            <div className="space-y-4">
              {/* 宠物名称 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">宠物名称 *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：学习小精灵"
                  className="h-10"
                />
              </div>

              {/* 蛋阶段选择 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">🥚 蛋阶段造型</Label>
                <div className="grid grid-cols-4 gap-2">
                  {eggTypes.map(egg => (
                    <button
                      key={egg.type}
                      onClick={() => setSelectedEggType(egg.type)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedEggType === egg.type
                          ? 'border-red-400 bg-red-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={egg.preview}
                        alt={egg.label}
                        className="w-8 h-8 object-contain"
                        draggable={false}
                      />
                      <span className="text-[11px] font-medium">{egg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 各阶段名称（可选） */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">各阶段名称（可选）</Label>
                <div className="space-y-1.5">
                  <Input
                    value={babyName}
                    onChange={e => setBabyName(e.target.value)}
                    placeholder={`幼年体名称（默认：${name || '宠物名称'}）`}
                    className="h-8 text-sm"
                  />
                  <Input
                    value={teenName}
                    onChange={e => setTeenName(e.target.value)}
                    placeholder="成长体名称（默认：宠物名称·成长体）"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={adultName}
                    onChange={e => setAdultName(e.target.value)}
                    placeholder="完全体名称（默认：宠物名称·完全体）"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* 创建按钮 */}
              <Button
                onClick={handleCreate}
                className="w-full h-11 text-white font-medium shadow-lg rounded-xl"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                ✨ 创作宠物
              </Button>
            </div>

            {/* 右侧：图片上传 */}
            <div className="space-y-4">
              <ImageUploader
                label="🐣 幼年体造型"
                value={babyImage}
                onChange={setBabyImage}
                placeholder="上传幼年体图片"
              />
              <ImageUploader
                label="⭐ 成长体造型"
                value={teenImage}
                onChange={setTeenImage}
                placeholder="上传成长体图片"
              />
              <ImageUploader
                label="👑 完全体造型"
                value={adultImage}
                onChange={setAdultImage}
                placeholder="上传完全体图片"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 已创作的自定义宠物列表 */}
      {customPets.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <span>📦</span>
            已创作宠物 ({customPets.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customPets.map(pet => (
              <Card key={pet.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="p-3">
                  {/* 进化链预览 */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {/* 蛋 */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${pet.color}15, ${pet.color}25)` }}
                      >
                        <img
                          src={getPetImagePath(pet.id, 'egg', pet.pokemonType, pet)}
                          alt="蛋"
                          className="w-8 h-8 object-contain"
                          draggable={false}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5">蛋</span>
                    </div>
                    <span className="text-muted-foreground text-xs">→</span>
                    {/* 幼年体 */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50"
                        style={{ background: `linear-gradient(135deg, ${pet.color}10, ${pet.color}20)` }}
                      >
                        {pet.customImages?.baby ? (
                          <img
                            src={pet.customImages.baby}
                            alt={pet.stages.baby}
                            className="w-10 h-10 object-contain"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-xl">❓</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[48px]">{pet.stages.baby}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">→</span>
                    {/* 成长体 */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${pet.color}10, ${pet.color}20)` }}
                      >
                        {pet.customImages?.teen ? (
                          <img
                            src={pet.customImages.teen}
                            alt={pet.stages.teen}
                            className="w-10 h-10 object-contain"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-xl">❓</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[48px]">{pet.stages.teen}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">→</span>
                    {/* 完全体 */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${pet.color}10, ${pet.color}20)` }}
                      >
                        {pet.customImages?.adult ? (
                          <img
                            src={pet.customImages.adult}
                            alt={pet.stages.adult}
                            className="w-10 h-10 object-contain"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-xl">❓</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[48px]">{pet.stages.adult}</span>
                    </div>
                  </div>

                  {/* 宠物名称 + 操作 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">✨</span>
                      <span className="font-bold text-sm">{pet.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setAssignPet(pet)}
                      >
                        📋 分配
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setPreviewPet(pet)}
                      >
                        👁️ 预览
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(pet)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 系统内置宠物参考 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>📚</span>
            系统内置宠物
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PET_TYPES.map(pet => (
              <div
                key={pet.id}
                className="flex flex-col items-center p-2 rounded-lg bg-gray-50 border"
              >
                <img
                  src={getPetImagePath(pet.id, 'baby', pet.pokemonType)}
                  alt={pet.name}
                  className="w-10 h-10 object-contain mb-1"
                  draggable={false}
                />
                <span className="text-xs font-medium">{pet.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {pet.stages.teen} → {pet.stages.adult}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 预览弹窗 */}
      {previewPet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPreviewPet(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>✨</span>
                {previewPet.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewPet(null)}
                className="h-8"
              >
                ✕
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4">
              {/* 蛋 */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center border"
                  style={{ background: `linear-gradient(135deg, ${previewPet.color}10, ${previewPet.color}25)` }}
                >
                  <img
                    src={getPetImagePath(previewPet.id, 'egg', previewPet.pokemonType, previewPet)}
                    alt="蛋"
                    className="w-14 h-14 object-contain"
                    draggable={false}
                  />
                </div>
                <span className="text-xs font-medium">🥚 蛋</span>
              </div>
              <span className="text-muted-foreground text-xl">→</span>
              {/* 幼年体 */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center border bg-gray-50">
                  {previewPet.customImages?.baby ? (
                    <img
                      src={previewPet.customImages.baby}
                      alt={previewPet.stages.baby}
                      className="w-16 h-16 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-3xl">❓</span>
                  )}
                </div>
                <span className="text-xs font-medium">{previewPet.stages.baby}</span>
              </div>
              <span className="text-muted-foreground text-xl">→</span>
              {/* 成长体 */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center border bg-gray-50">
                  {previewPet.customImages?.teen ? (
                    <img
                      src={previewPet.customImages.teen}
                      alt={previewPet.stages.teen}
                      className="w-16 h-16 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-3xl">❓</span>
                  )}
                </div>
                <span className="text-xs font-medium">{previewPet.stages.teen}</span>
              </div>
              <span className="text-muted-foreground text-xl">→</span>
              {/* 完全体 */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center border bg-gray-50">
                  {previewPet.customImages?.adult ? (
                    <img
                      src={previewPet.customImages.adult}
                      alt={previewPet.stages.adult}
                      className="w-16 h-16 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-3xl">❓</span>
                  )}
                </div>
                <span className="text-xs font-medium">{previewPet.stages.adult}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除「{deleteTarget?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，已分配该宠物的学生将显示为无宠物状态。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 分配宠物对话框 */}
      <AlertDialog open={!!assignPet} onOpenChange={() => { setAssignPet(null); setAssignNames(''); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              分配「{assignPet?.name}」给学生
            </AlertDialogTitle>
            <AlertDialogDescription>
              输入学生名单，每行一个或用逗号分隔。已有的经验值和成长阶段会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {/* 进化链预览 */}
            {assignPet && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-secondary/30">
                <img
                  src={getPetImagePath(assignPet.id, 'baby', assignPet.pokemonType, assignPet)}
                  alt={assignPet.name}
                  className="w-10 h-10 object-contain"
                  draggable={false}
                />
                <span className="text-muted-foreground">→</span>
                <img
                  src={getPetImagePath(assignPet.id, 'teen', assignPet.pokemonType, assignPet)}
                  alt={assignPet.stages.teen}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
                <span className="text-muted-foreground">→</span>
                <img
                  src={getPetImagePath(assignPet.id, 'adult', assignPet.pokemonType, assignPet)}
                  alt={assignPet.stages.adult}
                  className="w-14 h-14 object-contain"
                  draggable={false}
                />
              </div>
            )}
            <Textarea
              placeholder={"张三\n李四\n王五\n或：张三,李四,王五"}
              className="min-h-[120px]"
              value={assignNames}
              onChange={(e) => setAssignNames(e.target.value)}
            />
            {assignNames.trim() && (
              <div className="text-sm text-muted-foreground">
                已输入 <span className="font-bold text-primary">
                  {assignNames.split(/[\n,，;；、\t]+/).filter(n => n.trim()).length}
                </span> 个名字
              </div>
            )}
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {students.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAssignAll}
              >
                📋 全部学生 ({students.length}人)
              </Button>
            )}
            <div className="flex gap-2 w-full">
              <AlertDialogCancel className="flex-1">取消</AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
                onClick={handleAssign}
              >
                ✅ 确认分配
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
