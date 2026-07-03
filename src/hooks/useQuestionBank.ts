import { useState, useEffect, useCallback, useRef } from 'react';
import { idbGet, idbSet, migrateFromLocalStorage, STORES } from '@/utils/idb';

// 题目类型
export type QuestionType = 'choice' | 'truefalse' | 'short';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;           // 题目正文
  options?: string[];        // 选择题选项 A/B/C/D
  answer?: string;           // 答案（可选，供老师参考）
  imageUrls?: string[];      // 题目图片（支持多张，base64 或 URL）
  optionImages?: (string[] | undefined)[];  // 每个选项对应的多张图片
}

export interface QuestionBank {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
}

const OLD_STORAGE_KEY = 'pet-learning-system-question-banks';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/** 旧格式数据迁移：imageUrl → imageUrls，optionImages string → string[] */
function migrateQuestionFormat(data: any[]): QuestionBank[] {
  return data.map((bank: any) => ({
    ...bank,
    questions: bank.questions.map((q: any) => {
      const migrated = { ...q };
      if (q.imageUrl && !q.imageUrls) {
        migrated.imageUrls = [q.imageUrl];
        delete migrated.imageUrl;
      }
      if (q.optionImages) {
        migrated.optionImages = q.optionImages.map((img: any) =>
          img === undefined || img === null ? undefined :
          Array.isArray(img) ? img : [img]
        );
      }
      return migrated;
    }),
  }));
}

export function useQuestionBank() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestBanks = useRef<QuestionBank[]>([]);
  const mountedRef = useRef(true);

  // 初始加载（IndexedDB + localStorage 迁移）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. 先尝试从 IndexedDB 读取
        let data = await idbGet<QuestionBank[]>(STORES.QUESTION_BANKS);

        // 2. 如果 IndexedDB 为空，尝试从 localStorage 迁移
        if (!data) {
          data = await migrateFromLocalStorage<QuestionBank[]>(
            STORES.QUESTION_BANKS,
            OLD_STORAGE_KEY,
          );
          // 迁移的旧数据可能需要格式迁移
          if (data) {
            data = migrateQuestionFormat(data);
          }
        }

        if (data && !cancelled) {
          // 确保格式一致
          setBanks(migrateQuestionFormat(data));
        }
      } catch {
        console.error('Failed to load question banks from IndexedDB');
      }

      if (!cancelled) setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // 持久化到 IndexedDB（防抖 500ms，避免频繁写入）
  useEffect(() => {
    if (!loaded) return;
    latestBanks.current = banks;

    // 防抖：连续修改时只写最后一次
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null;
      try {
        await idbSet(STORES.QUESTION_BANKS, latestBanks.current);
        if (mountedRef.current) setSaveError(null);
      } catch (e: any) {
        if (mountedRef.current) {
          const msg = '⚠️ 题库保存失败：存储空间不足，请删除部分题目图片后重试';
          console.error(msg, e);
          setSaveError(msg);
        }
      }
    }, 500);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [banks, loaded]);

  // 组件卸载时 flush 未写入的数据（防止切 tab 丢失最后 500ms 的修改）
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      // 有未写入的数据时立即 flush
      if (loaded && latestBanks.current.length > 0) {
        idbSet(STORES.QUESTION_BANKS, latestBanks.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // 创建题库
  const createBank = useCallback((name: string): QuestionBank => {
    const bank: QuestionBank = {
      id: generateId(),
      name: name.trim(),
      questions: [],
      createdAt: Date.now(),
    };
    setBanks(prev => [...prev, bank]);
    return bank;
  }, []);

  // 删除题库
  const deleteBank = useCallback((bankId: string) => {
    setBanks(prev => prev.filter(b => b.id !== bankId));
  }, []);

  // 重命名题库
  const renameBank = useCallback((bankId: string, newName: string) => {
    setBanks(prev => prev.map(b =>
      b.id === bankId ? { ...b, name: newName.trim() } : b
    ));
  }, []);

  // 添加单道题目
  const addQuestion = useCallback((bankId: string, q: Omit<Question, 'id'>) => {
    const question: Question = { ...q, id: generateId() };
    setBanks(prev => prev.map(b =>
      b.id === bankId
        ? { ...b, questions: [...b.questions, question] }
        : b
    ));
    return question;
  }, []);

  // 更新题目
  const updateQuestion = useCallback((bankId: string, questionId: string, updates: Partial<Omit<Question, 'id'>>) => {
    setBanks(prev => prev.map(b =>
      b.id === bankId
        ? {
            ...b,
            questions: b.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          }
        : b
    ));
  }, []);

  // 批量导入题目（纯文本解析）
  const importQuestions = useCallback((bankId: string, text: string): number => {
    const blocks = text.trim().split(/\n{2,}/);
    const newQuestions: Question[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      let content = '';
      let options: string[] = [];
      let answer = '';
      let type: QuestionType = 'short';

      for (const line of lines) {
        if (/^[ABCD][.、．]\s*/i.test(line)) {
          type = 'choice';
          options.push(line);
        } else if (/^(答案|answer)[：:]\s*/i.test(line)) {
          answer = line.replace(/^(答案|answer)[：:]\s*/i, '');
        } else if (/^判断[：:]/.test(line) || /^(对|错|true|false)[。.！!]?$/i.test(line)) {
          type = 'truefalse';
          if (!content) content = line.replace(/^判断[：:]/, '').trim();
          else answer = line;
        } else if (!content) {
          content = line;
          if (/对还是错|正确.*错误|是否正确/.test(content)) {
            type = 'truefalse';
          }
        }
      }

      if (!content) continue;

      newQuestions.push({
        id: generateId(),
        type,
        content,
        options: options.length ? options : undefined,
        answer: answer || undefined,
      });
    }

    if (newQuestions.length > 0) {
      setBanks(prev => prev.map(b =>
        b.id === bankId
          ? { ...b, questions: [...b.questions, ...newQuestions] }
          : b
      ));
    }

    return newQuestions.length;
  }, []);

  // 删除题目
  const deleteQuestion = useCallback((bankId: string, questionId: string) => {
    setBanks(prev => prev.map(b =>
      b.id === bankId
        ? { ...b, questions: b.questions.filter(q => q.id !== questionId) }
        : b
    ));
  }, []);

  // 从指定题库随机抽一道题
  const pickRandom = useCallback((bankId: string): Question | null => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank || bank.questions.length === 0) return null;
    const idx = Math.floor(Math.random() * bank.questions.length);
    return bank.questions[idx];
  }, [banks]);

  return {
    banks,
    loaded,
    saveError,
    createBank,
    deleteBank,
    renameBank,
    addQuestion,
    updateQuestion,
    importQuestions,
    deleteQuestion,
    pickRandom,
  };
}
