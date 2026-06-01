import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentManagement } from '@/sections/StudentManagement';
import { BatchPoints } from '@/sections/BatchPoints';
import { BatchPetAssignment } from '@/sections/BatchPetAssignment';
import { Leaderboard } from '@/sections/Leaderboard';
import { StudentStatusView } from '@/sections/StudentStatusView';
import { PetCreator } from '@/sections/PetCreator';
import { ClassManagement } from '@/sections/ClassManagement';
import { PkBattle } from '@/sections/PkBattle';
import { useStudents } from '@/hooks/useStudents';
import { useCustomPets } from '@/hooks/useCustomPets';
import { useClasses } from '@/hooks/useClasses';
import { PET_TYPES } from '@/types/pet';
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

const GITHUB_OWNER = '806901330-code';
const GITHUB_REPO = 'pet-learning-system';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const DATA_FILE_PATH = 'docs/data/students.json';
const TOKEN_STORAGE_KEY = 'github-sync-token';

/* ── 导航标签定义 ── */
const NAV_TABS = [
  { id: 'students',    icon: '👥', label: '训练家',   color: '#FFCB05' },
  { id: 'classes',     icon: '🏫', label: '道馆',     color: '#3D7DCA' },
  { id: 'points',      icon: '⚡', label: '经验值',   color: '#FFCB05' },
  { id: 'pets',        icon: '🎒', label: '分配',     color: '#4CAF50' },
  { id: 'status',      icon: '📋', label: '图鉴',     color: '#9C27B0' },
  { id: 'leaderboard', icon: '🏆', label: '排行榜',   color: '#FF9800' },
  { id: 'creator',     icon: '🎨', label: '创作',     color: '#00BCD4' },
  { id: 'pk',          icon: '⚔️', label: '对战',     color: '#EE1515' },
];

function App() {
  const [activeTab, setActiveTab] = useState('students');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    students, loaded, addStudents, addPoints, batchAddPoints,
    batchAssignPet, deleteStudent, renameStudent, setNickname, clearAll,
  } = useStudents();

  const { customPets, loaded: customPetsLoaded } = useCustomPets();
  const {
    classes, loaded: classesLoaded, createClass, renameClass,
    updateClassColor, importStudentsToClass, removeStudentFromClass, deleteClass,
  } = useClasses();

  const allPetTypes = [...PET_TYPES, ...customPets];

  /* ── 同步逻辑（保持不变）── */
  const [syncing, setSyncing] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const isInitialLoad = useRef(true);

  const isDevServer = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isGitHubPages = typeof window !== 'undefined' &&
    window.location.hostname.endsWith('github.io');

  useEffect(() => {
    if (!loaded || !customPetsLoaded) return;
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (!isGitHubPages) return;
    setHasPendingSync(true);
  }, [students, customPets, loaded, customPetsLoaded, isGitHubPages]);

  useEffect(() => {
    if (!loaded || !customPetsLoaded) return;
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (!isDevServer) return;
    const timer = setTimeout(() => {
      const payload = { students, customPets, exportedAt: new Date().toISOString() };
      fetch('/api/export-query-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json()).then(result => {
        if (result.ok) { setHasPendingSync(true); }
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [students, customPets, loaded, customPetsLoaded, isDevServer]);

  const getToken = (): string | null => {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
  };
  const saveToken = (token: string) => {
    try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch {}
  };

  const githubSync = async () => {
    const token = getToken();
    if (!token) { setShowTokenSetup(true); return; }
    setSyncing(true);
    try {
      const payload = JSON.stringify({ students, customPets, exportedAt: new Date().toISOString() }, null, 2);
      let sha = '';
      try {
        const getRes = await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (getRes.ok) { const data = await getRes.json(); sha = data.sha; }
      } catch {}
      const body: Record<string, string> = {
        message: `sync: ${new Date().toLocaleString('zh-CN')}`,
        content: btoa(unescape(encodeURIComponent(payload))),
      };
      if (sha) body.sha = sha;
      const putRes = await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!putRes.ok) {
        if (putRes.status === 401) {
          try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch {}
          setShowTokenSetup(true);
          throw new Error('Token 无效或已过期');
        }
        throw new Error(`GitHub API 返回 ${putRes.status}`);
      }
      setHasPendingSync(false);
      toast.success('已同步！GitHub Pages 将在 1-2 分钟内更新');
    } catch (e: any) {
      toast.error('同步失败', { description: e?.message || '网络错误' });
    }
    setSyncing(false);
  };

  const handleTokenConfirm = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) { toast.error('请输入 GitHub Token'); return; }
    saveToken(trimmed);
    setTokenInput('');
    setShowTokenSetup(false);
    toast.success('Token 已保存');
    setTimeout(() => githubSync(), 500);
  };

  const handleSync = async () => {
    if (isDevServer) {
      setSyncing(true);
      try {
        const payload = { students, customPets, exportedAt: new Date().toISOString() };
        await fetch('/api/export-query-data', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const syncRes = await fetch('/api/sync-to-github', { method: 'POST' });
        const result = await syncRes.json();
        if (result.ok) {
          setHasPendingSync(false);
          toast.success('已同步！');
        } else {
          toast.error('同步失败', { description: result.error });
        }
      } catch (e: any) {
        toast.error('同步失败', { description: '请确保 dev server 正在运行' });
      }
      setSyncing(false);
    } else if (isGitHubPages) {
      await githubSync();
    } else {
      toast.error('当前环境不支持同步');
    }
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
    toast.success('已清空所有数据');
  };

  /* ── 加载状态 ── */
  if (!loaded || !customPetsLoaded || !classesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center space-y-6">
          <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto animate-pokeball-catch">
            <circle cx="50" cy="50" r="46" fill="white" stroke="#222224" strokeWidth="4"/>
            <path d="M4 50 Q50 75 96 50" fill="#EE1515" stroke="#222224" strokeWidth="4"/>
            <line x1="4" y1="50" x2="96" y2="50" stroke="#222224" strokeWidth="4"/>
            <circle cx="50" cy="50" r="11" fill="white" stroke="#222224" strokeWidth="4"/>
            <circle cx="50" cy="50" r="5" fill="#222224"/>
          </svg>
          <p className="text-sm font-extrabold text-[#003A70] font-display">
            正在加载精灵数据...
          </p>
        </div>
      </div>
    );
  }

  const adultCount = students.filter(s => s.pet.stage === 'adult').length;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Toaster position="top-center" richColors />

      {/* ═══════════════════════════════════════════════════════
          顶部导航 · Nintendo Switch 游戏菜单风格
          ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50">
        {/* 主标题栏：Logo(左) + 导航(中) + 统计(右) */}
        <div className="bg-[#003A70] text-white border-b-2 border-[#FFCB05]">
          <div className="max-w-7xl mx-auto px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <img
                  src={import.meta.env.BASE_URL + 'pokemon-logo.png'}
                  alt="Pokémon"
                  className="h-14 w-auto flex-shrink-0"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
                />
                <p
                  className="text-sm font-black font-display tracking-widest"
                  style={{
                    color: '#FFCB05',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 12px rgba(255,203,5,0.6)',
                  }}
                >
                  学习养成系统
                </p>
              </div>

              {/* 导航标签（居中） */}
              <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-none pt-1.5">
                <div className="flex gap-1">
                  {NAV_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                          text-sm font-extrabold font-display whitespace-nowrap
                          transition-all duration-200
                          ${isActive
                            ? 'bg-white text-[#003A70] shadow-[0_3px_0_0_rgba(255,203,5,0.5)] scale-105'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                        style={isActive ? { borderBottom: `3px solid ${tab.color}` } : {}}
                      >
                        <span className="text-base">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 统计 + 操作 */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-1">
                  <span className="px-2.5 py-1.5 bg-white/10 rounded-lg text-xs font-extrabold font-display whitespace-nowrap">
                    👥 {students.length}
                  </span>
                  <span className="px-2.5 py-1.5 bg-[#FFCB05]/20 rounded-lg text-xs font-extrabold text-[#FFCB05] font-display whitespace-nowrap">
                    👑 {adultCount}
                  </span>
                  {hasPendingSync && (
                    <span className="px-2.5 py-1.5 bg-[#EE1515]/20 rounded-lg text-xs font-extrabold text-[#EE1515] font-display animate-pulse whitespace-nowrap">
                      ⚠ 待同步
                    </span>
                  )}
                </div>

                {students.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className={`game-btn game-btn-yellow text-xs px-4 py-2 ${
                        !(isDevServer || isGitHubPages) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {syncing ? '⏳ 同步中' : '🔄 同步'}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="game-btn game-btn-outline text-xs px-3 py-2"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          主内容区
          ═══════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-5 pt-8 pb-20">
        {activeTab === 'students' && (
          <StudentManagement
            students={students} onAddStudents={addStudents}
            onAddPoints={addPoints} onDeleteStudent={deleteStudent}
            onRenameStudent={renameStudent} onSetNickname={setNickname}
            petTypes={allPetTypes}
          />
        )}
        {activeTab === 'classes' && (
          <ClassManagement
            classes={classes} students={students}
            onCreateClass={createClass} onRenameClass={renameClass}
            onUpdateClassColor={updateClassColor}
            onImportStudentsToClass={importStudentsToClass}
            onRemoveStudentFromClass={removeStudentFromClass}
            onDeleteClass={deleteClass}
          />
        )}
        {activeTab === 'points' && (
          <BatchPoints students={students} onBatchAddPoints={batchAddPoints} />
        )}
        {activeTab === 'pets' && (
          <BatchPetAssignment
            students={students} onBatchAssignPet={batchAssignPet}
            petTypes={allPetTypes}
          />
        )}
        {activeTab === 'status' && (
          <StudentStatusView students={students} petTypes={allPetTypes} classes={classes} />
        )}
        {activeTab === 'leaderboard' && (
          <Leaderboard students={students} petTypes={allPetTypes} />
        )}
        {activeTab === 'creator' && (
          <PetCreator students={students} onBatchAssignPet={batchAssignPet} />
        )}
        {activeTab === 'pk' && (
          <PkBattle students={students} petTypes={allPetTypes} onAddPoints={addPoints} />
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          底部 · 精灵球画廊
          ═══════════════════════════════════════════════════════ */}
      <footer className="bg-[#003A70] text-white/60 py-8">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            {PET_TYPES.slice(0, 10).map((pet) => (
              <span
                key={pet.id}
                className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20
                  flex items-center justify-center text-lg
                  hover:scale-125 hover:border-[#FFCB05] transition-all duration-200 cursor-default"
                title={pet.name}
              >
                {pet.emoji}
              </span>
            ))}
          </div>
          <p className="text-xs font-display tracking-wide">
            宠物养成学习系统 · 用爱心陪伴每一只精灵成长
          </p>
        </div>
      </footer>

      {/* ── 清空确认 ── */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-sm text-[#003A70]">⚠ 确认清空所有数据？</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              此操作将删除所有学生和宠物的数据，包括所有经验值和成长记录。此操作不可撤销！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm">取消</AlertDialogCancel>
            <AlertDialogAction
              className="game-btn game-btn-red text-sm"
              onClick={handleClearAll}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Token 设置 ── */}
      <AlertDialog open={showTokenSetup} onOpenChange={setShowTokenSetup}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-game text-sm text-[#003A70]">🔑 设置 GitHub Token</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 font-medium">
              <p>同步需要 GitHub Personal Access Token 来提交数据文件。</p>
              <div className="bg-[#FFF8F0] border-2 border-[#FFCB05] rounded-xl p-4 text-left text-sm">
                <p className="font-extrabold mb-2">📋 获取 Token 步骤：</p>
                <ol className="list-decimal list-inside space-y-1 text-[#003A70]">
                  <li>打开 <a href="https://github.com/settings/tokens" target="_blank" className="underline text-[#3D7DCA] font-extrabold">github.com/settings/tokens</a></li>
                  <li>点击 Generate new token (classic)</li>
                  <li>Note 填写 <code className="bg-gray-200 px-1 rounded">pet-learning-sync</code></li>
                  <li>勾选 <code className="bg-gray-200 px-1 rounded">repo</code> 权限</li>
                  <li>生成后复制 Token 粘贴到下方</li>
                </ol>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="github-token" className="font-extrabold">Personal Access Token</Label>
            <Input
              id="github-token" type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenConfirm()}
              className="game-input"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="game-btn game-btn-outline text-sm" onClick={() => setTokenInput('')}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction className="game-btn game-btn-yellow text-sm" onClick={handleTokenConfirm}>
              保存并同步
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
