import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// GitHub 仓库信息
const GITHUB_OWNER = '806901330-code';
const GITHUB_REPO = 'pet-learning-system';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const DATA_FILE_PATH = 'docs/data/students.json';
const TOKEN_STORAGE_KEY = 'github-sync-token';

function App() {
  const [activeTab, setActiveTab] = useState('students');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    students,
    loaded,
    addStudents,
    addPoints,
    batchAddPoints,
    batchAssignPet,
    deleteStudent,
    renameStudent,
    setNickname,
    clearAll,
  } = useStudents();

  const { customPets, loaded: customPetsLoaded } = useCustomPets();

  const {
    classes,
    loaded: classesLoaded,
    createClass,
    renameClass,
    updateClassColor,
    importStudentsToClass,
    removeStudentFromClass,
    deleteClass,
  } = useClasses();

  // 合并系统宠物和自定义宠物
  const allPetTypes = [...PET_TYPES, ...customPets];

  // === 数据同步相关状态 ===
  const [syncing, setSyncing] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const isInitialLoad = useRef(true);

  // 检测运行环境
  const isDevServer =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isGitHubPages =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('github.io');

  // GitHub Pages 上数据变更时标记待同步
  useEffect(() => {
    if (!loaded || !customPetsLoaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (!isGitHubPages) return;
    // GitHub Pages 无法自动导出，只标记"待同步"
    setHasPendingSync(true);
  }, [students, customPets, loaded, customPetsLoaded, isGitHubPages]);

  // 自动导出：数据变更后 2 秒自动写入 public/data/students.json（仅 dev server）
  useEffect(() => {
    if (!loaded || !customPetsLoaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (!isDevServer) return;

    const timer = setTimeout(() => {
      const payload = {
        students,
        customPets,
        exportedAt: new Date().toISOString(),
      };
      fetch('/api/export-query-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json()).then(result => {
        if (result.ok) {
          setHasPendingSync(true);
          console.log('📤 自动导出:', result.count, '名学生');
        }
      }).catch((e) => {
        console.warn('自动导出失败（dev server 不可用）:', e.message);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [students, customPets, loaded, customPetsLoaded, isDevServer]);

  // 获取/保存 GitHub Token
  const getToken = (): string | null => {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
  };
  const saveToken = (token: string) => {
    try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* ignore */ }
  };

  // GitHub API 同步：通过 Contents API 直接提交数据文件
  const githubSync = async () => {
    const token = getToken();
    if (!token) {
      setShowTokenSetup(true);
      return;
    }

    setSyncing(true);
    try {
      const payload = JSON.stringify({
        students,
        customPets,
        exportedAt: new Date().toISOString(),
      }, null, 2);

      // Step 1：获取当前文件的 SHA（更新需要）
      let sha = '';
      try {
        const getRes = await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      } catch { /* 文件可能不存在，首次创建 */ }

      // Step 2：提交文件
      const body: Record<string, string> = {
        message: `sync: ${new Date().toLocaleString('zh-CN')}`,
        content: btoa(unescape(encodeURIComponent(payload))),
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        if (putRes.status === 401) {
          // Token 无效，清除并让用户重新输入
          try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
          setShowTokenSetup(true);
          throw new Error('Token 无效或已过期，请重新设置');
        }
        throw new Error(err.message || `GitHub API 返回 ${putRes.status}`);
      }

      setHasPendingSync(false);
      toast.success('已同步！GitHub Pages 将在 1-2 分钟内更新', {
        description: `${students.length} 名学生数据已提交到仓库`,
        duration: 5000,
      });
    } catch (e: any) {
      toast.error('同步失败', {
        description: e?.message || '网络错误，请重试',
        duration: 6000,
      });
    }
    setSyncing(false);
  };

  // Token 设置确认
  const handleTokenConfirm = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      toast.error('请输入有效的 GitHub Token');
      return;
    }
    saveToken(trimmed);
    setTokenInput('');
    setShowTokenSetup(false);
    toast.success('Token 已保存', {
      description: '正在尝试同步...',
      duration: 2000,
    });
    // 自动触发同步
    setTimeout(() => githubSync(), 500);
  };

  // 一键同步：dev server 走本地 API，GitHub Pages 走 GitHub API
  const handleSync = async () => {
    if (isDevServer) {
      setSyncing(true);
      try {
        const payload = { students, customPets, exportedAt: new Date().toISOString() };
        const exportRes = await fetch('/api/export-query-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!exportRes.ok) throw new Error('导出接口返回 ' + exportRes.status);

        const syncRes = await fetch('/api/sync-to-github', { method: 'POST' });
        const result = await syncRes.json();

        if (result.ok) {
          setHasPendingSync(false);
          toast.success('已同步！GitHub Pages 将在 1-2 分钟内更新', {
            description: result.logs?.join(' → ') || '',
            duration: 5000,
          });
        } else {
          toast.error('同步失败', { description: result.error || '未知错误' });
        }
      } catch (e: any) {
        toast.error('同步失败', {
          description: e?.message || '请确保 dev server 正在运行：npm run dev',
          duration: 6000,
        });
      }
      setSyncing(false);
    } else if (isGitHubPages) {
      await githubSync();
    } else {
      toast.error('请在 GitHub Pages 或本地开发服务器中操作', {
        description: '当前环境不支持同步功能',
        duration: 5000,
      });
    }
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
    toast.success('已清空所有数据');
  };

  if (!loaded || !customPetsLoaded || !classesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🥚</div>
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-center" richColors />

      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg">
                🐾
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  宠物养成学习系统
                </h1>
                <p className="text-xs text-muted-foreground">
                  学习 → 积分 → 进化 → 成长
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>👥 {students.length} 名学生</span>
                <span>•</span>
                <span>🐉 {students.filter(s => s.pet.stage === 'adult').length} 只完全体</span>
              </div>
              {students.length > 0 && (
                <>
                  {hasPendingSync && (
                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      待同步
                    </span>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className={`text-white shadow-md transition-all ${
                      (isDevServer || isGitHubPages)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {syncing ? (
                      <span className="flex items-center gap-1.5">
                        <span className="animate-spin">⏳</span> 同步中...
                      </span>
                    ) : (
                      '🔁 一键同步到学生端'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    🗑️ 清空数据
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="students" className="gap-1.5">
              👥 学生管理
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-1.5">
              🏫 分班管理
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-1.5">
              ➕ 批量加分
            </TabsTrigger>
            <TabsTrigger value="pets" className="gap-1.5">
              🎨 分配宠物
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-1.5">
              📋 状态浏览
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5">
              🏆 排行榜
            </TabsTrigger>
            <TabsTrigger value="creator" className="gap-1.5">
              🎨 创作栏
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentManagement
              students={students}
              onAddStudents={addStudents}
              onAddPoints={addPoints}
              onDeleteStudent={deleteStudent}
              onRenameStudent={renameStudent}
              onSetNickname={setNickname}
              petTypes={allPetTypes}
            />
          </TabsContent>

          <TabsContent value="classes">
            <ClassManagement
              classes={classes}
              students={students}
              onCreateClass={createClass}
              onRenameClass={renameClass}
              onUpdateClassColor={updateClassColor}
              onImportStudentsToClass={importStudentsToClass}
              onRemoveStudentFromClass={removeStudentFromClass}
              onDeleteClass={deleteClass}
            />
          </TabsContent>

          <TabsContent value="points">
            <BatchPoints
              students={students}
              onBatchAddPoints={batchAddPoints}
            />
          </TabsContent>

          <TabsContent value="pets">
            <BatchPetAssignment
              students={students}
              onBatchAssignPet={batchAssignPet}
              petTypes={allPetTypes}
            />
          </TabsContent>

          <TabsContent value="status">
            <StudentStatusView students={students} petTypes={allPetTypes} classes={classes} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard students={students} petTypes={allPetTypes} />
          </TabsContent>

          <TabsContent value="creator">
            <PetCreator students={students} onBatchAssignPet={batchAssignPet} />
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部 */}
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <div className="flex justify-center gap-4 mb-2">
          {PET_TYPES.map(pet => (
            <span key={pet.id} title={pet.name}>{pet.emoji}</span>
          ))}
        </div>
        宠物养成学习系统 · 用爱心陪伴成长
      </footer>

      {/* 清空确认 */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ 确认清空所有数据？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有学生和宠物的数据，包括所有经验值和成长记录。此操作不可撤销！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GitHub Token 设置 */}
      <AlertDialog open={showTokenSetup} onOpenChange={setShowTokenSetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔑 设置 GitHub Token</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>同步需要 GitHub Personal Access Token 来提交数据文件。</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left text-sm">
                <p className="font-medium mb-1">📋 获取 Token 步骤：</p>
                <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
                  <li>打开 <a href="https://github.com/settings/tokens" target="_blank" className="underline text-blue-600">github.com/settings/tokens</a></li>
                  <li>点击「Generate new token (classic)」</li>
                  <li>Note 填写 <code>pet-learning-sync</code></li>
                  <li>勾选 <code>repo</code> 权限</li>
                  <li>生成后复制 Token 粘贴到下方</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Token 仅保存在你的浏览器中，不会上传到任何服务器。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="github-token">Personal Access Token</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenConfirm()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setTokenInput(''); }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleTokenConfirm}>
              保存并同步
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
