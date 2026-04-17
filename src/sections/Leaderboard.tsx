import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Student, PetType } from '@/types/pet';
import { PET_TYPES, getStageByExperience, getPetImagePath } from '@/types/pet';
import { Pet } from '@/components/Pet';

interface LeaderboardProps {
  students: Student[];
  petTypes: PetType[];
}

export function Leaderboard({ students, petTypes }: LeaderboardProps) {
  const sortedStudents = [...students]
    .map(s => ({
      ...s,
      stage: getStageByExperience(s.pet.experience),
    }))
    .sort((a, b) => b.pet.experience - a.pet.experience);

  const topThree = sortedStudents.slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🏆 排行榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            还没有学生数据，快去添加学生吧！
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 前三名展示 */}
      {topThree.length >= 3 && (
        <div className="flex items-end justify-center gap-4 pt-4">
          {/* 第二名 */}
          <div className="text-center">
            <div className="text-2xl mb-1">{medals[1]}</div>
            <Pet 
              petType={petTypes.find(p => p.id === topThree[1].pet.petTypeId) || petTypes[0]}
              stage={topThree[1].stage}
              experience={topThree[1].pet.experience}
              size="sm"
              showExp={false}
            />
            <div className="mt-2 font-bold text-sm">{topThree[1].name}</div>
            <div className="text-xs text-muted-foreground">{topThree[1].pet.experience} 经验</div>
          </div>

          {/* 第一名 */}
          <div className="text-center -mt-4">
            <div className="text-3xl mb-1">{medals[0]}</div>
            <Pet 
              petType={petTypes.find(p => p.id === topThree[0].pet.petTypeId) || petTypes[0]}
              stage={topThree[0].stage}
              experience={topThree[0].pet.experience}
              size="md"
              showExp={false}
            />
            <div className="mt-2 font-bold">{topThree[0].name}</div>
            <div className="text-sm text-muted-foreground">{topThree[0].pet.experience} 经验</div>
          </div>

          {/* 第三名 */}
          <div className="text-center">
            <div className="text-2xl mb-1">{medals[2]}</div>
            <Pet 
              petType={petTypes.find(p => p.id === topThree[2].pet.petTypeId) || petTypes[0]}
              stage={topThree[2].stage}
              experience={topThree[2].pet.experience}
              size="sm"
              showExp={false}
            />
            <div className="mt-2 font-bold text-sm">{topThree[2].name}</div>
            <div className="text-xs text-muted-foreground">{topThree[2].pet.experience} 经验</div>
          </div>
        </div>
      )}

      {/* 完整排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 经验排行榜
            <Badge variant="secondary">{students.length} 人</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedStudents.map((student, index) => {
              const petType = petTypes.find(p => p.id === student.pet.petTypeId) || petTypes[0];
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    index < 3 ? 'bg-amber-50 border border-amber-200' : 'hover:bg-secondary/50'
                  }`}
                >
                  {/* 排名 */}
                  <div className="w-8 text-center font-bold text-lg">
                    {index < 3 ? medals[index] : (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </div>

                  {/* 宝可梦图标 */}
                  <img 
                    src={getPetImagePath(petType.id, student.stage, petType.pokemonType, petType)}
                    alt={petType.name}
                    className="w-10 h-10 object-contain"
                    draggable={false}
                  />

                  {/* 名字 */}
                  <div className="flex-1 font-medium">{student.name}</div>

                  {/* 当前形态名称 */}
                  <div className="text-xs text-muted-foreground hidden sm:block max-w-[80px] truncate">
                    {petType.stages[student.stage]}
                  </div>

                  {/* 阶段 */}
                  <Badge variant="outline" className="text-xs">
                    {student.stage === 'egg' && '🥚 蛋'}
                    {student.stage === 'baby' && '🐣 幼年'}
                    {student.stage === 'teen' && '⭐ 成长'}
                    {student.stage === 'adult' && '👑 完全'}
                  </Badge>

                  {/* 经验值 */}
                  <div className="text-right">
                    <div className="font-bold">{student.pet.experience}</div>
                    <div className="text-xs text-muted-foreground">经验</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
