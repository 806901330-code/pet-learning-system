import type { Student, PetType } from '@/types/pet';
import { getStageByExperience, getPetImagePath } from '@/types/pet';
import { Pet } from '@/components/Pet';

interface LeaderboardProps {
  students: Student[];
  petTypes: PetType[];
}

export function Leaderboard({ students, petTypes }: LeaderboardProps) {
  const getRank = (exp: number): number => {
    let higher = 0;
    for (const s of students) { if (s.pet.experience > exp) higher++; }
    return higher + 1;
  };

  const sorted = [...students]
    .map((s) => ({ ...s, stage: getStageByExperience(s.pet.experience), rank: getRank(s.pet.experience) }))
    .sort((a, b) => b.pet.experience - a.pet.experience);

  const topThree = sorted.slice(0, 3);

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const podiumHeights = ['h-32', 'h-24', 'h-20'];
  const podiumWidths = ['w-36', 'w-32', 'w-28'];

  if (students.length === 0) {
    return (
      <div className="game-card text-center py-24">
        <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto mb-6 opacity-10">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#222224" strokeWidth="4"/>
          <path d="M4 50 Q50 73 96 50" fill="#EE1515" stroke="#222224" strokeWidth="4"/>
          <line x1="4" y1="50" x2="96" y2="50" stroke="#222224" strokeWidth="4"/>
          <circle cx="50" cy="50" r="10" fill="white" stroke="#222224" strokeWidth="4"/>
          <circle cx="50" cy="50" r="4" fill="#222224"/>
        </svg>
        <p className="text-sm font-extrabold text-[#003A70]/50 font-display">
          还没有训练家数据，快去添加吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════
          前三名 · 冠军领奖台
          ═══════════════════════════════════════════════════════ */}
      {topThree.length >= 3 && (
        <div className="flex items-end justify-center gap-5 md:gap-8 pt-4 pb-8">
          {/* 第二名 (左) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥈</span>
              <Pet
                petType={petTypes.find((p) => p.id === topThree[1].pet.petTypeId) || petTypes[0]}
                stage={topThree[1].stage} experience={topThree[1].pet.experience}
                size="sm" showExp={false}
              />
            </div>
            <div
              className={`${podiumHeights[1]} ${podiumWidths[1]} rounded-t-2xl flex flex-col items-center justify-end pb-4`}
              style={{
                background: `linear-gradient(180deg, ${podiumColors[1]}30, ${podiumColors[1]}08)`,
                border: `3px solid ${podiumColors[1]}40`,
                borderBottom: 'none',
              }}
            >
              <div className="font-extrabold text-sm text-[#003A70] font-display">{topThree[1].name}</div>
              <div className="text-[11px] font-bold text-[#003A70]/50 mt-1">{topThree[1].pet.experience} EXP</div>
            </div>
          </div>

          {/* 第一名 (中) · 冠军 */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative mb-4">
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</span>
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl">🥇</span>
              {/* 冠军光环 */}
              <div className="absolute inset-0 rounded-full animate-sparkle-spin"
                style={{
                  background: `conic-gradient(from 0deg, #FFD70000, #FFD70030, #FFD70000, #FFD70020, #FFD70000)`,
                  transform: 'scale(1.3)',
                }}
              />
              <div className="relative z-10">
                <Pet
                  petType={petTypes.find((p) => p.id === topThree[0].pet.petTypeId) || petTypes[0]}
                  stage={topThree[0].stage} experience={topThree[0].pet.experience}
                  size="lg" showExp={false}
                />
              </div>
            </div>
            <div
              className={`${podiumHeights[0]} ${podiumWidths[0]} rounded-t-2xl flex flex-col items-center justify-end pb-5`}
              style={{
                background: `linear-gradient(180deg, ${podiumColors[0]}40, ${podiumColors[0]}10)`,
                border: `3px solid ${podiumColors[0]}60`,
                borderBottom: 'none',
                boxShadow: `0 0 24px ${podiumColors[0]}30`,
              }}
            >
              <div className="font-extrabold text-lg text-[#003A70] font-display">{topThree[0].name}</div>
              <div className="text-sm font-extrabold text-[#003A70]/70 mt-1">{topThree[0].pet.experience} EXP</div>
            </div>
          </div>

          {/* 第三名 (右) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥉</span>
              <Pet
                petType={petTypes.find((p) => p.id === topThree[2].pet.petTypeId) || petTypes[0]}
                stage={topThree[2].stage} experience={topThree[2].pet.experience}
                size="sm" showExp={false}
              />
            </div>
            <div
              className={`${podiumHeights[2]} ${podiumWidths[2]} rounded-t-2xl flex flex-col items-center justify-end pb-4`}
              style={{
                background: `linear-gradient(180deg, ${podiumColors[2]}30, ${podiumColors[2]}08)`,
                border: `3px solid ${podiumColors[2]}40`,
                borderBottom: 'none',
              }}
            >
              <div className="font-extrabold text-sm text-[#003A70] font-display">{topThree[2].name}</div>
              <div className="text-[11px] font-bold text-[#003A70]/50 mt-1">{topThree[2].pet.experience} EXP</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          完整排行列表 · 图鉴风格
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-game text-[#003A70] tracking-tight">
            经验排行
          </h2>
          <span className="px-3 py-1 rounded-xl bg-[#FFCB05]/15 text-[#003A70] text-xs font-extrabold font-display border-2 border-[#FFCB05]/30">
            {students.length} 人
          </span>
        </div>

        <div className="space-y-3">
          {sorted.map((student) => {
            const petType = petTypes.find((p) => p.id === student.pet.petTypeId) || petTypes[0];
            const isTop3 = student.rank <= 3;
            const stageLabels: Record<string, string> = {
              egg: '🥚 蛋', baby: '🐣 幼年', teen: '⭐ 成长', adult: '👑 完全',
            };

            return (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isTop3
                    ? 'bg-gradient-to-r from-[#FFCB05]/10 to-[#FFCB05]/5 border-2 border-[#FFCB05]/30'
                    : 'bg-white border-2 border-[#003A70]/10 hover:border-[#003A70]/20 hover:shadow-sm'
                }`}
              >
                {/* 排名 */}
                <div className="w-10 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-2xl">{medals[student.rank]}</span>
                  ) : (
                    <span className="text-sm font-extrabold text-[#003A70]/40 font-display">
                      #{student.rank}
                    </span>
                  )}
                </div>

                {/* 精灵 */}
                <img
                  src={getPetImagePath(petType.id, student.stage, petType.pokemonType, petType)}
                  alt={petType.name}
                  className="w-12 h-12 object-contain shrink-0"
                  draggable={false}
                />

                {/* 名字 */}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[#003A70] truncate font-display">
                    {student.name}
                  </div>
                  <div className="text-[11px] font-semibold text-[#003A70]/40 truncate hidden sm:block">
                    {petType.stages[student.stage]}
                  </div>
                </div>

                {/* 阶段标签 */}
                <span
                  className="hidden sm:inline-flex text-[10px] font-extrabold px-3 py-1 rounded-xl shrink-0 font-display"
                  style={{
                    background: `${petType.color}12`,
                    color: petType.color,
                    border: `1.5px solid ${petType.color}25`,
                  }}
                >
                  {stageLabels[student.stage] || '🥚 蛋'}
                </span>

                {/* 经验值 */}
                <div className="text-right shrink-0 w-20">
                  <div className="font-extrabold text-lg text-[#003A70] font-display tabular-nums">
                    {student.pet.experience}
                  </div>
                  <div className="text-[10px] font-bold text-[#003A70]/30 uppercase tracking-wider">
                    EXP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
