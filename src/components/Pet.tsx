import type { PetStage, PetType } from '@/types/pet';
import { STAGE_CONFIG, getNextStageExp, getPetImagePath } from '@/types/pet';

interface PetProps {
  petType: PetType;
  stage: PetStage;
  experience: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showExp?: boolean;
}

export function Pet({ petType, stage, experience, size = 'md', showExp = true }: PetProps) {
  const sizeClasses = { sm: 'w-14 h-14', md: 'w-20 h-20', lg: 'w-28 h-28', xl: 'w-36 h-36', xxl: 'w-44 h-44' };
  const textSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm', xl: 'text-sm', xxl: 'text-sm' };

  const nextExp = getNextStageExp(experience);
  const progress = nextExp
    ? ((experience - STAGE_CONFIG[stage].minExp) / (nextExp - STAGE_CONFIG[stage].minExp)) * 100
    : 100;

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* 精灵容器 · 游戏像素风格 */}
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative transition-all duration-500 overflow-hidden`}
        style={{
          background: stage === 'egg'
            ? `linear-gradient(135deg, ${petType.color}08, ${petType.color}18)`
            : `linear-gradient(135deg, ${petType.color}12, ${petType.color}22)`,
          border: `2.5px solid ${petType.color}${stage === 'adult' ? '50' : '25'}`,
          boxShadow: stage === 'adult'
            ? `0 0 20px ${petType.color}40, 0 0 40px ${petType.color}15`
            : stage === 'teen'
            ? `0 0 12px ${petType.color}20`
            : 'none',
          borderRadius: stage === 'egg' ? '50%' : '16px',
        }}
      >
        {/* 完全体光环 */}
        {stage === 'adult' && (
          <div
            className="absolute inset-0 rounded-full animate-sparkle-spin"
            style={{
              background: `conic-gradient(from 0deg, ${petType.color}00, ${petType.color}20, ${petType.color}00, ${petType.color}10, ${petType.color}00)`,
              opacity: 0.6,
            }}
          />
        )}
        <div className="relative z-10">
          <PetSprite petType={petType} stage={stage} size={size} />
        </div>
      </div>

      {showExp && (
        <div className="text-center w-full">
          {/* 阶段名称 */}
          <div className={`${textSizes[size]} font-extrabold text-[#003A70] font-display mb-1`}>
            {petType.stages[stage]}
          </div>

          {/* HP 风格经验条 */}
          <div className="hp-bar h-2 mb-1">
            <div
              className={`hp-bar-fill ${
                progress > 66 ? 'hp-bar-fill-high'
                : progress > 33 ? 'hp-bar-fill-mid'
                : 'hp-bar-fill-low'
              } ${progress < 100 && stage !== 'adult' ? 'animate-exp-bar-pulse' : ''}`}
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>

          {/* 经验值文字 */}
          <div className={`${textSizes[size]} font-extrabold text-[#003A70]/50 tabular-nums`}>
            {experience}
            {nextExp && ` / ${nextExp}`}
            {!nextExp && ' MAX'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 宠物精灵渲染 ── */
function PetSprite({ petType, stage, size }: { petType: PetType; stage: PetStage; size: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' }) {
  const imageSizes: Record<string, number> = { sm: 44, md: 68, lg: 100, xl: 140, xxl: 172 };
  const imageSize = imageSizes[size];
  const imagePath = getPetImagePath(petType.id, stage, petType.pokemonType, petType);

  return (
    <div className="relative">
      {stage === 'adult' && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${petType.color}20 0%, transparent 70%)`,
            transform: 'scale(1.4)',
            animation: 'evolve-glow 2.5s ease-in-out infinite',
          }}
        />
      )}
      <img
        src={imagePath}
        alt={petType.stages[stage]}
        width={imageSize}
        height={imageSize}
        className="object-contain transition-all duration-500 relative z-10"
        style={{
          filter: stage === 'adult'
            ? `drop-shadow(0 3px 10px ${petType.color}50)`
            : `drop-shadow(0 1px 4px ${petType.color}25)`,
        }}
        draggable={false}
      />
    </div>
  );
}
