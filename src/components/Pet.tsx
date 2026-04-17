import type { PetStage, PetType } from '@/types/pet';
import { STAGE_CONFIG, getNextStageExp, getPetImagePath } from '@/types/pet';

interface PetProps {
  petType: PetType;
  stage: PetStage;
  experience: number;
  size?: 'sm' | 'md' | 'lg';
  showExp?: boolean;
}

export function Pet({ petType, stage, experience, size = 'md', showExp = true }: PetProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const nextExp = getNextStageExp(experience);
  const progress = nextExp 
    ? ((experience - STAGE_CONFIG[stage].minExp) / (nextExp - STAGE_CONFIG[stage].minExp)) * 100
    : 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative transition-all duration-500 overflow-hidden`}
        style={{ 
          background: stage === 'egg'
            ? `linear-gradient(135deg, ${petType.color}08, ${petType.color}15)`
            : `linear-gradient(135deg, ${petType.color}10, ${petType.color}20)`,
          boxShadow: stage === 'adult' 
            ? `0 0 24px ${petType.color}40, 0 0 48px ${petType.color}15` 
            : stage === 'teen'
            ? `0 0 16px ${petType.color}25`
            : `0 0 8px ${petType.color}15`,
          borderRadius: stage === 'egg' ? '40%' : '16px',
        }}
      >
        <PetSprite petType={petType} stage={stage} size={size} />
      </div>
      
      {showExp && (
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            {petType.stages[stage]}
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
            <div 
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                background: petType.color,
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            经验: {experience}
            {nextExp && ` / ${nextExp}`}
            {!nextExp && ' (满级)'}
          </div>
        </div>
      )}
    </div>
  );
}

// 宠物精灵组件 - 使用宝可梦图片渲染
function PetSprite({ petType, stage, size }: { petType: PetType; stage: PetStage; size: 'sm' | 'md' | 'lg' }) {
  const imageSizes = {
    sm: 48,
    md: 80,
    lg: 112,
  };

  const imageSize = imageSizes[size];
  const imagePath = getPetImagePath(petType.id, stage, petType.pokemonType, petType);

  // 蛋阶段的弹跳动画
  const eggAnimation = stage === 'egg' ? 'animate-bounce' : '';
  // 完全体闪光
  const adultGlow = stage === 'adult' ? 'animate-pulse' : '';

  return (
    <div className="relative">
      {/* 完全体光环 */}
      {stage === 'adult' && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${petType.color}25 0%, transparent 70%)`,
            transform: 'scale(1.3)',
          }}
        />
      )}
      <img 
        src={imagePath} 
        alt={petType.stages[stage]}
        width={imageSize}
        height={imageSize}
        className={`object-contain transition-all duration-500 ${eggAnimation} ${adultGlow}`}
        style={{
          filter: stage === 'adult' 
            ? `drop-shadow(0 2px 8px ${petType.color}60)`
            : `drop-shadow(0 1px 3px ${petType.color}30)`,
        }}
        draggable={false}
      />
    </div>
  );
}
