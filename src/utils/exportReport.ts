import type { Student, PetType } from '@/types/pet';
import { STAGE_CONFIG } from '@/types/pet';

/** 格式化时间戳为 YYYY-MM-DD */
function formatDate(ts: number | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 获取某阶段的升级日期 */
function getUpgradeDate(
  student: Student,
  stage: 'baby' | 'teen' | 'adult',
): string {
  const record = student.pet.stageHistory?.find(r => r.stage === stage);
  return formatDate(record?.upgradedAt);
}

/** 生成 CSV 内容（含 BOM，Excel 可直接双击打开） */
export function buildCSV(students: Student[], petTypes: PetType[]): string {
  const getPetName = (petTypeId: string): string => {
    const pt = petTypes.find(p => p.id === petTypeId);
    return pt?.name ?? '未知';
  };

  const getStageName = (experience: number): string => {
    if (experience >= 600) return STAGE_CONFIG.adult.name;
    if (experience >= 300) return STAGE_CONFIG.teen.name;
    if (experience >= 100) return STAGE_CONFIG.baby.name;
    return STAGE_CONFIG.egg.name;
  };

  const header = [
    '学生姓名',
    '宠物名称',
    '当前阶段',
    '经验值',
    '幼年体达成日期',
    '成长体达成日期',
    '完全体达成日期',
    '加入日期',
  ].join(',');

  const rows = students.map(s => {
    const cols = [
      `"${s.name}"`,
      `"${getPetName(s.pet.petTypeId)}"`,
      `"${getStageName(s.pet.experience)}"`,
      s.pet.experience,
      `"${getUpgradeDate(s, 'baby')}"`,
      `"${getUpgradeDate(s, 'teen')}"`,
      `"${getUpgradeDate(s, 'adult')}"`,
      `"${formatDate(s.createdAt)}"`,
    ];
    return cols.join(',');
  });

  // UTF-8 BOM 确保 Excel 正确显示中文
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

/** 触发 CSV 文件下载 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 一键导出入口 */
export function exportStudentReport(students: Student[], petTypes: PetType[]): void {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `宠物成长报告_${dateStr}.csv`;
  const csv = buildCSV(students, petTypes);
  downloadCSV(csv, filename);
}
