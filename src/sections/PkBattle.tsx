import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Pet } from '@/components/Pet';
import { useQuestionBank, type Question, type QuestionBank, type QuestionType } from '@/hooks/useQuestionBank';
import type { Student, PetType } from '@/types/pet';
import { getStageByExperience } from '@/types/pet';

interface PkBattleProps {
  students: Student[];
  petTypes: PetType[];
  onAddPoints?: (studentId: string, points: number) => void;
}

// ─────────────── 图片上传工具 ───────────────
function imageFileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// 从粘贴事件提取图片
function extractImageFromClipboard(e: React.ClipboardEvent): Promise<string | null> {
  return new Promise(res => {
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(it => it.type.startsWith('image/'));
    if (!imgItem) return res(null);
    const file = imgItem.getAsFile();
    if (!file) return res(null);
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => res(null);
    reader.readAsDataURL(file);
  });
}

// ─────────────── 图片上传组件 ───────────────
function ImageUploader({
  value,
  onChange,
  label = '添加图片',
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const b64 = await imageFileToBase64(file);
    onChange(b64);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const url = await extractImageFromClipboard(e);
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="题目图片"
            className="max-w-full max-h-48 rounded-lg border object-contain"
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center shadow"
            onClick={() => onChange(undefined)}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-all"
          onClick={() => inputRef.current?.click()}
          onPaste={handlePaste}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <div className="text-2xl mb-1">🖼️</div>
          <p>{label}</p>
          <p className="text-xs mt-0.5 text-muted-foreground/70">点击上传 或 Ctrl+V 粘贴</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─────────────── 题目编辑弹窗 ───────────────
function QuestionEditor({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean;
  initial?: Partial<Question>;
  onSave: (q: Omit<Question, 'id'>) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? 'short');
  const [content, setContent] = useState(initial?.content ?? '');
  const [options, setOptions] = useState<string[]>(
    initial?.options ?? ['A. ', 'B. ', 'C. ', 'D. ']
  );
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [optionImages, setOptionImages] = useState<(string | undefined)[]>(
    initial?.optionImages ?? [undefined, undefined, undefined, undefined]
  );

  // 重置表单当 initial 变化
  useEffect(() => {
    if (open) {
      setType(initial?.type ?? 'short');
      setContent(initial?.content ?? '');
      setOptions(initial?.options ?? ['A. ', 'B. ', 'C. ', 'D. ']);
      setAnswer(initial?.answer ?? '');
      setImageUrl(initial?.imageUrl);
      setOptionImages(initial?.optionImages ?? [undefined, undefined, undefined, undefined]);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!content.trim()) return;
    const q: Omit<Question, 'id'> = {
      type,
      content: content.trim(),
      answer: answer.trim() || undefined,
      imageUrl: imageUrl || undefined,
    };
    if (type === 'choice') {
      const validOptions = options.filter(o => o.trim().length > 2);
      q.options = validOptions.length >= 2 ? validOptions : undefined;
      const validOptionImages = optionImages.slice(0, options.length);
      if (validOptionImages.some(img => img)) q.optionImages = validOptionImages;
    }
    onSave(q);
    onClose();
  };

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {initial?.id ? '✏️ 编辑题目' : '➕ 新建题目'}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* 题型 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">题目类型</Label>
            <div className="flex gap-2">
              {(['short', 'choice', 'truefalse'] as QuestionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {t === 'short' ? '💬 简答题' : t === 'choice' ? '📝 选择题' : '✅ 判断题'}
                </button>
              ))}
            </div>
          </div>

          {/* 题目正文 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">题目正文 *</Label>
            <textarea
              className="w-full h-24 text-sm border rounded-lg p-3 resize-y bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="请输入题目内容..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          {/* 题目图片 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">题目图片（可选）</Label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="为题目添加图片"
            />
          </div>

          {/* 选择题选项 */}
          {type === 'choice' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">选项</Label>
              {options.map((opt, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex gap-2 items-center">
                    <span className="w-6 text-sm text-muted-foreground font-mono shrink-0">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <Input
                      className="text-sm h-9 flex-1"
                      value={opt.replace(/^[ABCD][.、．]\s*/i, '')}
                      placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                      onChange={e => {
                        const newOpts = [...options];
                        newOpts[i] = `${String.fromCharCode(65 + i)}. ${e.target.value}`;
                        setOptions(newOpts);
                      }}
                    />
                    <div className="shrink-0">
                      <ImageUploader
                        value={optionImages[i]}
                        onChange={url => {
                          const newImgs = [...optionImages];
                          newImgs[i] = url;
                          setOptionImages(newImgs);
                        }}
                        label=""
                      />
                    </div>
                  </div>
                  {optionImages[i] && (
                    <div className="ml-8">
                      <img
                        src={optionImages[i]}
                        alt={`选项${String.fromCharCode(65 + i)}图片`}
                        className="max-h-24 rounded-lg border object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOptions(prev => [...prev, `${String.fromCharCode(65 + prev.length)}. `]);
                  setOptionImages(prev => [...prev, undefined]);
                }}
                disabled={options.length >= 6}
                className="text-xs"
              >
                + 添加选项
              </Button>
            </div>
          )}

          {/* 标准答案 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">标准答案（可选）</Label>
            <Input
              placeholder={
                type === 'choice' ? '如：A 或 B' :
                type === 'truefalse' ? '对 / 错' :
                '填写参考答案...'
              }
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={!content.trim()}
          >
            {initial?.id ? '保存修改' : '添加题目'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────── 题库管理面板 ───────────────
function QuestionBankPanel({
  banks,
  onCreateBank,
  onDeleteBank,
  onRenameBank,
  onImport,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: {
  banks: QuestionBank[];
  onCreateBank: (name: string) => void;
  onDeleteBank: (id: string) => void;
  onRenameBank: (id: string, name: string) => void;
  onImport: (bankId: string, text: string) => number;
  onAddQuestion: (bankId: string, q: Omit<Question, 'id'>) => void;
  onUpdateQuestion: (bankId: string, qId: string, updates: Partial<Omit<Question, 'id'>>) => void;
  onDeleteQuestion: (bankId: string, qId: string) => void;
}) {
  const [newBankName, setNewBankName] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showImportText, setShowImportText] = useState(false);
  const [wordImporting, setWordImporting] = useState(false);
  const [wordMsg, setWordMsg] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  const bank = banks.find(b => b.id === selectedBank);

  const handleCreate = () => {
    if (!newBankName.trim()) return;
    onCreateBank(newBankName.trim());
    setNewBankName('');
  };

  const handleImportText = () => {
    if (!selectedBank || !importText.trim()) return;
    const count = onImport(selectedBank, importText);
    setImportMsg(`✅ 成功导入 ${count} 道题`);
    setImportText('');
    setShowImportText(false);
    setTimeout(() => setImportMsg(''), 3000);
  };

  // Word 文档导入
  const handleWordImport = async (file: File) => {
    if (!selectedBank) return;
    setWordImporting(true);
    setWordMsg('');
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      if (!text.trim()) {
        setWordMsg('⚠️ 未能从文档中提取文字');
        return;
      }
      const count = onImport(selectedBank, text);
      setWordMsg(`✅ 从 Word 导入 ${count} 道题`);
      setTimeout(() => setWordMsg(''), 4000);
    } catch (err) {
      setWordMsg('❌ Word 解析失败，请检查文件格式');
    } finally {
      setWordImporting(false);
    }
  };

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setEditorOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setEditorOpen(true);
  };

  const handleSaveQuestion = (q: Omit<Question, 'id'>) => {
    if (!selectedBank) return;
    if (editingQuestion) {
      onUpdateQuestion(selectedBank, editingQuestion.id, q);
    } else {
      onAddQuestion(selectedBank, q);
    }
  };

  return (
    <div className="space-y-4">
      {/* 新建题库 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📚 新建题库</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="题库名称，如：语文期末复习"
              value={newBankName}
              onChange={e => setNewBankName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={!newBankName.trim()}>
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 题库列表 */}
      {banks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🗂️ 题库列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {banks.map(b => (
              <div
                key={b.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedBank === b.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
                onClick={() => setSelectedBank(selectedBank === b.id ? null : b.id)}
              >
                {editingName?.id === b.id ? (
                  <Input
                    className="h-7 text-sm flex-1"
                    value={editingName.value}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    onChange={e => setEditingName({ id: b.id, value: e.target.value })}
                    onBlur={() => {
                      if (editingName.value.trim()) onRenameBank(b.id, editingName.value);
                      setEditingName(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingName.value.trim()) onRenameBank(b.id, editingName.value);
                        setEditingName(null);
                      }
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                  />
                ) : (
                  <span className="font-medium text-sm flex-1 truncate">{b.name}</span>
                )}
                <Badge variant="secondary" className="text-xs shrink-0">{b.questions.length} 题</Badge>
                <Button
                  size="sm" variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={e => { e.stopPropagation(); setEditingName({ id: b.id, value: b.name }); }}
                >✏️</Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive shrink-0"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(b.id); }}
                >🗑️</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 选中题库的操作区 */}
      {selectedBank && bank && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                📝「{bank.name}」题目管理
              </CardTitle>
              <div className="flex items-center gap-2">
                {importMsg && (
                  <span className="text-sm text-green-600 font-medium">{importMsg}</span>
                )}
                {wordMsg && (
                  <span className={`text-sm font-medium ${wordMsg.startsWith('✅') ? 'text-green-600' : 'text-destructive'}`}>
                    {wordMsg}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 操作按钮行 */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openNewQuestion} className="gap-1.5">
                ➕ 新建题目
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => setShowImportText(!showImportText)}
                className="gap-1.5"
              >
                📋 文字导入
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => wordInputRef.current?.click()}
                disabled={wordImporting}
                className="gap-1.5"
              >
                📄 {wordImporting ? '解析中...' : 'Word 导入'}
              </Button>
              <input
                ref={wordInputRef}
                type="file"
                accept=".docx,.doc"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleWordImport(f);
                  e.target.value = '';
                }}
              />
            </div>

            {/* 文字导入区 */}
            {showImportText && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">📋 格式说明（每道题之间空一行）：</p>
                  <p>• <b>简答题</b>：直接输入题目即可</p>
                  <p>• <b>选择题</b>：题目正文后，每行 A. B. C. D. 开头</p>
                  <p>• <b>判断题</b>：题目正文含"对还是错"或"是否正确"</p>
                  <p>• 可在最后一行加 <b>答案：X</b></p>
                </div>
                <textarea
                  className="w-full h-36 text-sm border rounded-lg p-3 resize-y font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={`光合作用的原料是什么？\n答案：水和二氧化碳\n\n下列哪项是植物光合作用的产物？\nA. 水\nB. 二氧化碳\nC. 氧气\nD. 氮气\n答案：C`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleImportText} disabled={!importText.trim()}>
                    📥 导入
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowImportText(false); setImportText(''); }}>
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 题目列表 */}
            {bank.questions.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  共 {bank.questions.length} 道题：
                </p>
                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {bank.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-sm group"
                    >
                      <span className="text-muted-foreground shrink-0 w-6 text-right mt-0.5">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                            {q.type === 'choice' ? '选择' : q.type === 'truefalse' ? '判断' : '简答'}
                          </Badge>
                          <span className="line-clamp-2 flex-1">{q.content}</span>
                          {q.imageUrl && <span className="text-xs text-primary shrink-0">🖼️</span>}
                        </div>
                        {q.answer && (
                          <span className="text-xs text-amber-600 mt-0.5 block">
                            答：{q.answer}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 w-6 p-0 text-primary/70 hover:text-primary"
                          onClick={() => openEditQuestion(q)}
                        >✏️</Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive"
                          onClick={() => onDeleteQuestion(bank.id, q.id)}
                        >×</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <div className="text-3xl mb-2">📭</div>
                暂无题目，点击上方按钮添加
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 题目编辑弹窗 */}
      <QuestionEditor
        open={editorOpen}
        initial={editingQuestion ?? undefined}
        onSave={handleSaveQuestion}
        onClose={() => setEditorOpen(false)}
      />

      {/* 删除题库确认 */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除题库？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后题库中的所有题目将一并删除，不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) {
                  if (selectedBank === confirmDelete) setSelectedBank(null);
                  onDeleteBank(confirmDelete);
                }
                setConfirmDelete(null);
              }}
            >确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────── 战斗者选择器 ───────────────
function FighterSelector({
  label,
  side,
  students,
  petTypes,
  selected,
  onSelect,
}: {
  label: string;
  side: 'left' | 'right';
  students: Student[];
  petTypes: PetType[];
  selected: Student | null;
  onSelect: (s: Student | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.nickname && s.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  const petType = selected
    ? petTypes.find(p => p.id === selected.pet.petTypeId) || petTypes[0]
    : null;
  const stage = selected ? getStageByExperience(selected.pet.experience) : null;

  const borderColor = side === 'left' ? '#3B82F6' : '#EF4444';
  const gradient = side === 'left' ? 'from-blue-50 to-indigo-50' : 'from-red-50 to-orange-50';
  const labelColor = side === 'left' ? 'text-blue-600' : 'text-red-500';

  return (
    <div
      className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-b ${gradient} border-2`}
      style={{ borderColor }}
    >
      <div className={`text-sm font-bold ${labelColor} tracking-wider`}>{label}</div>

      {selected && petType && stage ? (
        <div className="flex flex-col items-center gap-1">
          <div className="font-bold text-lg">{selected.name}</div>
          <Pet petType={petType} stage={stage} experience={selected.pet.experience} size="lg" />
        </div>
      ) : (
        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
          <span className="text-3xl">❓</span>
          <span>选择学生</span>
        </div>
      )}

      <Button
        variant="outline" size="sm" className="w-full"
        style={{ borderColor, color: borderColor }}
        onClick={() => setOpen(true)}
      >
        {selected ? '换一个' : '选择学生'}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>选择{label}的学生</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="🔍 搜索姓名或昵称..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {selected && (
                <button
                  className="w-full text-left p-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => { onSelect(null); setSearch(''); setOpen(false); }}
                >✖ 取消选择</button>
              )}
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">没有找到匹配的学生</p>
              ) : (
                filtered.map(s => {
                  const pt = petTypes.find(p => p.id === s.pet.petTypeId) || petTypes[0];
                  const st = getStageByExperience(s.pet.experience);
                  return (
                    <button
                      key={s.id}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all border ${
                        selected?.id === s.id
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-transparent hover:border-border hover:bg-muted/30'
                      }`}
                      onClick={() => { onSelect(s); setSearch(''); setOpen(false); }}
                    >
                      <span className="text-xl">{pt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pt.stages[st]} · 经验 {s.pet.experience}
                        </div>
                      </div>
                      {selected?.id === s.id && <span className="text-primary">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSearch('')}>关闭</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────── 题目展示区 ───────────────
function QuestionDisplay({ question }: { question: Question | null }) {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setShowAnswer(false);
  }, [question]);

  if (!question) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-48">
        <div className="text-6xl opacity-30">⚔️</div>
        <p className="text-muted-foreground text-center text-sm">
          选好对战双方并选择题库<br />点击「出招」按钮开始随机抽题
        </p>
      </div>
    );
  }

  const typeLabel = {
    choice: '📝 选择题',
    truefalse: '✅ 判断题',
    short: '💬 简答题',
  }[question.type];

  return (
    <div className="flex-1 flex flex-col justify-center gap-3">
      <div className="flex justify-center">
        <Badge variant="secondary" className="text-xs px-3 py-1">{typeLabel}</Badge>
      </div>

      <div className="bg-white rounded-2xl shadow-md border p-5 text-center">
        <p className="text-lg font-medium leading-relaxed">{question.content}</p>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="题目图片"
            className="mt-3 max-w-full max-h-48 rounded-lg border object-contain mx-auto"
          />
        )}

        {question.options && question.options.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 text-left">
            {question.options.map((opt, i) => (
              <div key={i} className="px-4 py-2 rounded-lg bg-muted/40 border border-border/50 text-sm hover:bg-muted/70 transition-colors">
                <div>{opt}</div>
                {question.optionImages?.[i] && (
                  <img
                    src={question.optionImages[i]}
                    alt={`选项${i}图片`}
                    className="mt-1.5 max-h-20 rounded object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {question.type === 'truefalse' && !question.options && (
          <div className="mt-4 flex justify-center gap-4">
            <span className="px-6 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium">✓ 对</span>
            <span className="px-6 py-2 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-medium">✗ 错</span>
          </div>
        )}
      </div>

      {question.answer && (
        <div className="flex flex-col items-center gap-2">
          {showAnswer ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-center">
              <span className="text-xs text-amber-600 font-medium block mb-1">参考答案</span>
              <span className="text-amber-800 font-bold">{question.answer}</span>
            </div>
          ) : (
            <Button
              variant="outline" size="sm"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => setShowAnswer(true)}
            >👁️ 显示答案</Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────── 出招按钮 ───────────────
function AttackButton({
  label, disabled, color, onAttack,
}: {
  label: string;
  disabled: boolean;
  color: string;
  onAttack: () => void;
}) {
  const [shaking, setShaking] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
    onAttack();
  };

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={`w-full py-3 rounded-xl font-bold text-white text-base shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${shaking ? 'animate-bounce' : ''}`}
      style={{
        background: disabled ? '#9CA3AF' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        boxShadow: disabled ? 'none' : `0 4px 16px ${color}50`,
      }}
    >
      ⚡ {label}出招！
    </button>
  );
}

// ─────────────── 获胜按钮 ───────────────
function WinButton({
  label, disabled, color, onWin,
}: {
  label: string;
  disabled: boolean;
  color: string;
  onWin: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onWin}
      className="w-full py-2.5 rounded-xl font-bold text-base shadow transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border-2"
      style={{
        borderColor: disabled ? '#D1D5DB' : color,
        color: disabled ? '#9CA3AF' : color,
        background: disabled ? 'transparent' : `${color}15`,
      }}
    >
      🏆 {label}获胜！
    </button>
  );
}

// ─────────────── 胜利界面 ───────────────
function VictoryScreen({
  winner,
  petType,
  onDismiss,
}: {
  winner: Student;
  petType: PetType;
  onDismiss: () => void;
}) {
  const stage = getStageByExperience(winner.pet.experience);

  // 烟花粒子
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 1.5,
    size: 8 + Math.random() * 16,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* 烟花粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full animate-ping"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: '1.5s',
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* 胜利卡片 */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4"
        style={{
          border: '4px solid #FFD700',
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.6), 0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* 皇冠 */}
        <div className="text-7xl animate-bounce">👑</div>

        {/* 标题 */}
        <div className="text-center space-y-1">
          <div
            className="text-4xl font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FF6B6B, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            胜利！
          </div>
          <div className="text-xl font-bold text-foreground">{winner.name}</div>
        </div>

        {/* 宠物 */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40"
            style={{ background: petType.color }}
          />
          <Pet
            petType={petType}
            stage={stage}
            experience={winner.pet.experience}
            size="lg"
          />
        </div>

        {/* +10 经验提示 */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <span className="text-2xl">⭐</span>
          <div className="text-center">
            <div className="font-bold text-amber-700 text-lg">+10 经验值</div>
            <div className="text-xs text-amber-600">已获得奖励</div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full text-base font-bold rounded-xl"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FF9500)', color: '#7C4700' }}
          onClick={onDismiss}
        >
          继续对战 →
        </Button>
      </div>
    </div>
  );
}

// ─────────────── 主页面 ───────────────
export function PkBattle({ students, petTypes, onAddPoints }: PkBattleProps) {
  const {
    banks,
    createBank,
    deleteBank,
    renameBank,
    importQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    pickRandom,
  } = useQuestionBank();

  const [tab, setTab] = useState<'battle' | 'banks'>('battle');
  const [leftStudent, setLeftStudent] = useState<Student | null>(null);
  const [rightStudent, setRightStudent] = useState<Student | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [winner, setWinner] = useState<Student | null>(null);

  const bankExists = banks.some(b => b.id === selectedBankId);

  const handleAttack = useCallback(() => {
    if (!selectedBankId || !bankExists) return;
    const q = pickRandom(selectedBankId);
    setCurrentQuestion(q);
    setQuestionKey(k => k + 1);
  }, [selectedBankId, bankExists, pickRandom]);

  const handleWin = useCallback((side: 'left' | 'right') => {
    const winnerStudent = side === 'left' ? leftStudent : rightStudent;
    if (!winnerStudent) return;
    // 加 10 经验
    if (onAddPoints) {
      onAddPoints(winnerStudent.id, 10);
    }
    // 清空题目，展示胜利界面
    setCurrentQuestion(null);
    setWinner(winnerStudent);
  }, [leftStudent, rightStudent, onAddPoints]);

  const handleDismissVictory = () => {
    setWinner(null);
  };

  const canAttack = !!selectedBankId && bankExists
    && (banks.find(b => b.id === selectedBankId)?.questions.length ?? 0) > 0;

  const leftPetType = leftStudent
    ? petTypes.find(p => p.id === leftStudent.pet.petTypeId) || petTypes[0]
    : null;
  const rightPetType = rightStudent
    ? petTypes.find(p => p.id === rightStudent.pet.petTypeId) || petTypes[0]
    : null;

  const winnerPetType = winner
    ? petTypes.find(p => p.id === winner.pet.petTypeId) || petTypes[0]
    : null;

  return (
    <div className="space-y-4">
      {/* 胜利界面 */}
      {winner && winnerPetType && (
        <VictoryScreen
          winner={winner}
          petType={winnerPetType}
          onDismiss={handleDismissVictory}
        />
      )}

      {/* 顶部 Tab */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-fit">
        <button
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'battle' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('battle')}
        >⚔️ PK 对战</button>
        <button
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'banks' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('banks')}
        >📚 题库管理</button>
        {banks.length > 0 && (
          <Badge variant="secondary" className="self-center text-xs">
            {banks.length} 个题库
          </Badge>
        )}
      </div>

      {/* 题库管理 */}
      {tab === 'banks' && (
        <QuestionBankPanel
          banks={banks}
          onCreateBank={createBank}
          onDeleteBank={deleteBank}
          onRenameBank={renameBank}
          onImport={importQuestions}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
        />
      )}

      {/* PK 对战页面 */}
      {tab === 'battle' && (
        <div className="space-y-4">
          {/* 题库选择 */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground shrink-0">📚 选择题库：</span>
                {banks.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">还没有题库，</span>
                    <button className="text-sm text-primary underline hover:no-underline" onClick={() => setTab('banks')}>
                      去创建一个
                    </button>
                  </div>
                ) : (
                  <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="请选择题库..." />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          <span className="text-muted-foreground ml-2 text-xs">({b.questions.length} 题)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedBankId && bankExists && (
                  <Badge variant="outline" className="text-xs">
                    {banks.find(b => b.id === selectedBankId)?.questions.length ?? 0} 道题
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 主对战区域 */}
          <div className="flex gap-4 items-stretch min-h-[500px]">
            {/* 左侧选手 */}
            <div className="w-56 shrink-0 flex flex-col gap-3">
              <FighterSelector
                label="🔵 左方选手"
                side="left"
                students={students}
                petTypes={petTypes}
                selected={leftStudent}
                onSelect={setLeftStudent}
              />
              <AttackButton
                label={leftStudent ? leftStudent.name : '左方'}
                disabled={!canAttack || !leftStudent}
                color="#3B82F6"
                onAttack={handleAttack}
              />
              <WinButton
                label={leftStudent ? leftStudent.name : '左方'}
                disabled={!leftStudent}
                color="#3B82F6"
                onWin={() => handleWin('left')}
              />
            </div>

            {/* 中间题目区 */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-center mb-3">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent tracking-widest">VS</div>
              </div>
              <div className="flex-1 bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 flex flex-col">
                <QuestionDisplay key={questionKey} question={currentQuestion} />
              </div>
              {canAttack && (leftStudent || rightStudent) && !currentQuestion && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  点击下方「出招」按钮随机抽题
                </p>
              )}
            </div>

            {/* 右侧选手 */}
            <div className="w-56 shrink-0 flex flex-col gap-3">
              <FighterSelector
                label="🔴 右方选手"
                side="right"
                students={students}
                petTypes={petTypes}
                selected={rightStudent}
                onSelect={setRightStudent}
              />
              <AttackButton
                label={rightStudent ? rightStudent.name : '右方'}
                disabled={!canAttack || !rightStudent}
                color="#EF4444"
                onAttack={handleAttack}
              />
              <WinButton
                label={rightStudent ? rightStudent.name : '右方'}
                disabled={!rightStudent}
                color="#EF4444"
                onWin={() => handleWin('right')}
              />
            </div>
          </div>

          {students.length === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4 text-center text-amber-700 text-sm">
                💡 还没有学生数据，请先在「学生管理」页面导入学生
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
