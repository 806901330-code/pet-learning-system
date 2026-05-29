// generate-pokemon-images.js
// 在项目根目录运行：node generate-pokemon-images.js
// 自动生成所有宝可梦 SVG 图片到 public/pokemon/

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'pokemon');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function writeSVG(filename, svg) {
  fs.writeFileSync(path.join(dir, filename), svg.trim(), 'utf-8');
  console.log('  ✓ ' + filename);
}

// ========== 12 个蛋 ==========
const eggTypes = {
  grass:    { color: '#4CAF50', pattern: 'leaf' },
  fire:     { color: '#FF5722', pattern: 'flame' },
  water:    { color: '#2196F3', pattern: 'drop' },
  bug:      { color: '#8BC34A', pattern: 'circle' },
  flying:   { color: '#9C27B0', pattern: 'stripe' },
  normal:   { color: '#9E9E9E', pattern: 'star' },
  electric: { color: '#FFC107', pattern: 'bolt' },
  ice:      { color: '#00BCD4', pattern: 'snow' },
  fighting: { color: '#795548', pattern: 'fist' },
  ghost:    { color: '#673AB7', pattern: 'wave' },
  rock:     { color: '#607D8B', pattern: 'diamond' },
  dragon:   { color: '#3F51B5', pattern: 'scale' },
};

for (const [type, cfg] of Object.entries(eggTypes)) {
  let pattern = '';
  if (cfg.pattern === 'leaf') pattern = '<ellipse cx="28" cy="20" rx="6" ry="10" fill="#388E3C" transform="rotate(30,28,20)"/><ellipse cx="36" cy="28" rx="6" ry="10" fill="#388E3C" transform="rotate(-20,36,28)"/>';
  else if (cfg.pattern === 'flame') pattern = '<path d="M28 32 Q28 18 34 10 Q34 18 40 32Z" fill="#E64A19" opacity="0.8"/><path d="M24 34 Q24 22 30 16 Q30 24 34 34Z" fill="#FF7043" opacity="0.6"/>';
  else if (cfg.pattern === 'drop') pattern = '<ellipse cx="30" cy="16" rx="5" ry="8" fill="#1565C0" opacity="0.7"/><ellipse cx="36" cy="22" rx="3" ry="5" fill="#1976D2" opacity="0.6"/>';
  else if (cfg.pattern === 'circle') pattern = '<circle cx="26" cy="18" r="6" fill="#689F38" opacity="0.7"/><circle cx="38" cy="24" r="4" fill="#689F38" opacity="0.6"/><circle cx="28" cy="32" r="3" fill="#689F38" opacity="0.5"/>';
  else if (cfg.pattern === 'stripe') pattern = '<line x1="20" y1="16" x2="44" y2="16" stroke="#7B1FA2" stroke-width="2.5"/><line x1="22" y1="24" x2="42" y2="24" stroke="#7B1FA2" stroke-width="2"/><line x1="20" y1="32" x2="44" y2="32" stroke="#7B1FA2" stroke-width="2.5"/>';
  else if (cfg.pattern === 'star') pattern = '<polygon points="32,14 36,22 44,22 38,27 40,36 32,30 24,36 26,27 20,22 28,22" fill="#757575" opacity="0.7"/>';
  else if (cfg.pattern === 'bolt') pattern = '<polygon points="32,8 26,24 34,22 28,40 40,20 32,24" fill="#FF8F00" opacity="0.8"/>';
  else if (cfg.pattern === 'snow') pattern = '<text x="32" y="36" text-anchor="middle" font-size="24" opacity="0.7">❄</text>';
  else if (cfg.pattern === 'fist') pattern = '<circle cx="32" cy="24" r="10" fill="#5D4037" opacity="0.7"/><rect x="28" y="30" width="8" height="10" rx="2" fill="#5D4037" opacity="0.7"/>';
  else if (cfg.pattern === 'wave') pattern = '<path d="M18 18 Q26 10 32 18 Q38 26 46 18" stroke="#7E57C2" stroke-width="2.5" fill="none" opacity="0.8"/><path d="M18 28 Q26 20 32 28 Q38 36 46 28" stroke="#7E57C2" stroke-width="2" fill="none" opacity="0.6"/>';
  else if (cfg.pattern === 'diamond') pattern = '<polygon points="32,10 42,24 32,38 22,24" fill="#455A64" opacity="0.7"/>';
  else if (cfg.pattern === 'scale') pattern = '<path d="M20 18 Q26 10 32 18 Q38 10 44 18" fill="none" stroke="#283593" stroke-width="2.5" opacity="0.8"/><path d="M18 28 Q26 20 32 28 Q38 20 46 28" fill="none" stroke="#283593" stroke-width="2" opacity="0.6"/>';

  writeSVG(`egg_${type}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="34" rx="18" ry="22" fill="${cfg.color}" opacity="0.25"/>
  <ellipse cx="32" cy="34" rx="16" ry="20" fill="${cfg.color}" opacity="0.15" stroke="${cfg.color}" stroke-width="2"/>
  ${pattern}
</svg>`);
}

// ========== 10 只宝可梦 × 3 阶段 ==========
const pokemons = [
  { id: 'bulbasaur',   color: '#4CAF50', body: '#66BB6A' },
  { id: 'charmander',  color: '#FF5722', body: '#FF7043' },
  { id: 'squirtle',    color: '#2196F3', body: '#42A5F5' },
  { id: 'caterpie',    color: '#8BC34A', body: '#9CCC65' },
  { id: 'pidgey',      color: '#9C27B0', body: '#AB47BC' },
  { id: 'chikorita',   color: '#66BB6A', body: '#81C784' },
  { id: 'cyndaquil',   color: '#FF7043', body: '#FF8A65' },
  { id: 'torchic',     color: '#FF9800', body: '#FFB74D' },
  { id: 'mudkip',      color: '#039BE5', body: '#29B6F6' },
  { id: 'sprigatito',  color: '#4CAF50', body: '#66BB6A' },
];

// 为每只精灵设计不同特征
const features = {
  bulbasaur: {
    baby:   { size: 18, features: '<rect x="22" y="10" width="6" height="8" rx="3" fill="#388E3C"/><rect x="38" y="10" width="6" height="8" rx="3" fill="#388E3C"/>' },
    teen:   { size: 24, features: '<path d="M24 12 Q26 4 32 4 Q38 4 40 12" fill="#388E3C"/><polygon points="32,36 26,48 38,48" fill="#388E3C" rx="2"/>' },
    adult:  { size: 30, features: '<rect x="30" y="6" width="4" height="10" rx="2" fill="#388E3C"/><ellipse cx="32" cy="40" rx="12" ry="6" fill="#388E3C" opacity="0.4"/><circle cx="26" cy="30" r="4" fill="#FF5252"/>' },
  },
  charmander: {
    baby:   { size: 18, features: '<polygon points="26,0 30,10 22,10" fill="#FF9800"/><polygon points="32,0 36,8 28,8" fill="#FF9800"/>' },
    teen:   { size: 24, features: '<polygon points="28,0 32,12 24,12" fill="#FF9800"/><ellipse cx="42" cy="22" rx="8" ry="4" fill="#FF9800" opacity="0.5"/>' },
    adult:  { size: 30, features: '<polygon points="28,0 32,14 24,14" fill="#FF9800"/><ellipse cx="48" cy="24" rx="12" ry="5" fill="#FF9800" opacity="0.5"/><circle cx="24" cy="30" r="4" fill="#FF5252"/>' },
  },
  squirtle: {
    baby:   { size: 18, features: '<ellipse cx="32" cy="4" rx="8" ry="5" fill="#1565C0" opacity="0.5"/>' },
    teen:   { size: 24, features: '<ellipse cx="32" cy="2" rx="10" ry="6" fill="#1565C0" opacity="0.5"/><ellipse cx="48" cy="22" rx="8" ry="5" fill="#1976D2" opacity="0.3"/>' },
    adult:  { size: 30, features: '<ellipse cx="32" cy="0" rx="12" ry="7" fill="#1565C0" opacity="0.5"/><ellipse cx="52" cy="20" rx="10" ry="6" fill="#1976D2" opacity="0.3"/><circle cx="40" cy="30" r="4" fill="#FF5252"/>' },
  },
  caterpie: {
    baby:   { size: 16, features: '<circle cx="48" cy="20" r="4" fill="#689F38" opacity="0.5"/>' },
    teen:   { size: 22, features: '<circle cx="50" cy="16" r="5" fill="#689F38" opacity="0.5"/><circle cx="52" cy="28" r="4" fill="#689F38" opacity="0.4"/>' },
    adult:  { size: 28, features: '<circle cx="52" cy="12" r="6" fill="#689F38" opacity="0.5"/><circle cx="54" cy="26" r="5" fill="#689F38" opacity="0.4"/><ellipse cx="16" cy="30" rx="8" ry="4" fill="#FFE082"/>' },
  },
  pidgey: {
    baby:   { size: 18, features: '<polygon points="50,4 54,14 46,14" fill="#FFC107"/>' },
    teen:   { size: 24, features: '<polygon points="54,2 58,12 50,12" fill="#FFC107"/><ellipse cx="56" cy="20" rx="6" ry="3" fill="#FFE082" opacity="0.5"/>' },
    adult:  { size: 30, features: '<polygon points="56,0 60,10 52,10" fill="#FFC107"/><ellipse cx="58" cy="18" rx="8" ry="4" fill="#FFE082" opacity="0.5"/><ellipse cx="18" cy="22" rx="10" ry="5" fill="#FFE082"/>' },
  },
  chikorita: {
    baby:   { size: 18, features: '<ellipse cx="32" cy="4" rx="8" ry="10" fill="#388E3C" opacity="0.5"/>' },
    teen:   { size: 24, features: '<ellipse cx="32" cy="2" rx="10" ry="12" fill="#388E3C" opacity="0.5"/><circle cx="28" cy="10" r="2" fill="#388E3C"/>' },
    adult:  { size: 30, features: '<ellipse cx="32" cy="2" rx="10" ry="12" fill="#388E3C" opacity="0.5"/><path d="M28 0 L32 6 L36 0" fill="#388E3C"/><circle cx="24" cy="30" r="4" fill="#FF5252"/>' },
  },
  cyndaquil: {
    baby:   { size: 18, features: '<ellipse cx="32" cy="6" rx="6" ry="8" fill="#FF5722" opacity="0.4"/>' },
    teen:   { size: 24, features: '<ellipse cx="32" cy="4" rx="8" ry="10" fill="#FF5722" opacity="0.4"/><circle cx="26" cy="6" r="2" fill="#FFD54F"/>' },
    adult:  { size: 30, features: '<ellipse cx="32" cy="4" rx="8" ry="10" fill="#FF5722" opacity="0.4"/><circle cx="24" cy="4" r="2" fill="#FFD54F"/><circle cx="40" cy="4" r="2" fill="#FFD54F"/><ellipse cx="32" cy="40" rx="8" ry="3" fill="#FF5722" opacity="0.3"/>' },
  },
  torchic: {
    baby:   { size: 18, features: '<polygon points="26,6 32,0 38,6" fill="#FF9800"/>' },
    teen:   { size: 24, features: '<polygon points="28,4 32,0 36,4" fill="#FF9800"/><ellipse cx="44" cy="20" rx="8" ry="4" fill="#FFE082" opacity="0.4"/>' },
    adult:  { size: 30, features: '<polygon points="28,4 32,0 36,4" fill="#FF9800"/><ellipse cx="48" cy="20" rx="10" ry="5" fill="#FFE082" opacity="0.4"/><circle cx="24" cy="30" r="4" fill="#FF5252"/>' },
  },
  mudkip: {
    baby:   { size: 18, features: '<path d="M22 8 Q32 2 42 8" fill="none" stroke="#0288D1" stroke-width="3"/>' },
    teen:   { size: 24, features: '<path d="M22 8 Q32 0 42 8" fill="none" stroke="#0288D1" stroke-width="3"/><ellipse cx="48" cy="22" rx="8" ry="4" fill="#03A9F4" opacity="0.4"/>' },
    adult:  { size: 30, features: '<path d="M20 6 Q32 -2 44 6" fill="none" stroke="#0288D1" stroke-width="3"/><ellipse cx="50" cy="20" rx="10" ry="5" fill="#03A9F4" opacity="0.4"/><circle cx="24" cy="30" r="4" fill="#FF5252"/>' },
  },
  sprigatito: {
    baby:   { size: 18, features: '<polygon points="22,10 18,4 26,4" fill="#388E3C"/><polygon points="42,10 38,4 46,4" fill="#388E3C"/>' },
    teen:   { size: 24, features: '<polygon points="22,10 18,2 26,2" fill="#388E3C"/><polygon points="42,10 38,2 46,2" fill="#388E3C"/><ellipse cx="32" cy="36" rx="6" ry="3" fill="#388E3C" opacity="0.3"/>' },
    adult:  { size: 30, features: '<polygon points="20,8 16,0 24,0" fill="#388E3C"/><polygon points="44,8 40,0 48,0" fill="#388E3C"/><ellipse cx="32" cy="40" rx="8" ry="4" fill="#388E3C" opacity="0.4"/><circle cx="24" cy="30" r="4" fill="#FF5252"/>' },
  },
};

pokemons.forEach(p => {
  const f = features[p.id] || { baby: { size: 20, features: '' }, teen: { size: 26, features: '' }, adult: { size: 32, features: '' } };
  
  // Baby
  writeSVG(`${p.id}_baby.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="gb-${p.id}" cx="50%" cy="40%"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="32" cy="34" rx="${f.baby.size}" ry="${f.baby.size + 2}" fill="${p.body}"/>
  <ellipse cx="32" cy="34" rx="${f.baby.size}" ry="${f.baby.size + 2}" fill="url(#gb-${p.id})"/>
  <ellipse cx="26" cy="30" rx="2.5" ry="3.5" fill="#333"/>
  <ellipse cx="38" cy="30" rx="2.5" ry="3.5" fill="#333"/>
  <ellipse cx="26.5" cy="29" rx="1" ry="1.5" fill="white"/>
  <ellipse cx="38.5" cy="29" rx="1" ry="1.5" fill="white"/>
  <path d="M28 38 Q32 42 36 38" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  ${f.baby.features}
</svg>`);

  // Teen
  writeSVG(`${p.id}_teen.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="gt-${p.id}" cx="50%" cy="40%"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="32" cy="32" rx="${f.teen.size}" ry="${f.teen.size + 3}" fill="${p.body}"/>
  <ellipse cx="32" cy="32" rx="${f.teen.size}" ry="${f.teen.size + 3}" fill="url(#gt-${p.id})"/>
  <ellipse cx="24" cy="28" rx="3" ry="4" fill="#333"/>
  <ellipse cx="40" cy="28" rx="3" ry="4" fill="#333"/>
  <ellipse cx="24.5" cy="27" rx="1.2" ry="1.8" fill="white"/>
  <ellipse cx="40.5" cy="27" rx="1.2" ry="1.8" fill="white"/>
  <path d="M26 36 Q32 41 38 36" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="20" cy="20" r="3" fill="${p.color}" opacity="0.3"/>
  <circle cx="44" cy="20" r="3" fill="${p.color}" opacity="0.3"/>
  ${f.teen.features}
</svg>`);

  // Adult
  writeSVG(`${p.id}_adult.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="ga-${p.id}" cx="50%" cy="40%"><stop offset="0%" stop-color="white" stop-opacity="0.4"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs>
  <!-- 光环 -->
  <circle cx="32" cy="30" r="${f.adult.size + 8}" fill="${p.color}" opacity="0.08"/>
  <!-- 身体 -->
  <ellipse cx="32" cy="30" rx="${f.adult.size}" ry="${f.adult.size + 4}" fill="${p.body}"/>
  <ellipse cx="32" cy="30" rx="${f.adult.size}" ry="${f.adult.size + 4}" fill="url(#ga-${p.id})"/>
  <!-- 眼睛 -->
  <ellipse cx="24" cy="26" rx="3.5" ry="4.5" fill="#333"/>
  <ellipse cx="40" cy="26" rx="3.5" ry="4.5" fill="#333"/>
  <ellipse cx="24.5" cy="25" rx="1.5" ry="2" fill="white"/>
  <ellipse cx="40.5" cy="25" rx="1.5" ry="2" fill="white"/>
  <!-- 嘴 -->
  <path d="M26 34 Q32 40 38 34" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 腮红 -->
  <circle cx="18" cy="32" r="5" fill="#FF5252" opacity="0.25"/>
  <circle cx="46" cy="32" r="5" fill="#FF5252" opacity="0.25"/>
  ${f.adult.features}
  <!-- 星星 -->
  <circle cx="10" cy="10" r="2" fill="${p.color}" opacity="0.4"/>
  <circle cx="54" cy="14" r="2.5" fill="${p.color}" opacity="0.3"/>
  <circle cx="50" cy="8" r="1.5" fill="${p.color}" opacity="0.3"/>
</svg>`);
});

console.log(`\n🎉 全部 ${12 + 30} 个图片已生成到 public/pokemon/`);
