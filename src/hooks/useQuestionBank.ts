import { useState, useEffect, useCallback } from 'react';

// 题目类型
export type QuestionType = 'choice' | 'truefalse' | 'short';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;           // 题目正文
  options?: string[];        // 选择题选项 A/B/C/D
  answer?: string;           // 答案（可选，供老师参考）
  imageUrl?: string;         // 题目图片（base64 或 URL）
  optionImages?: (string | undefined)[];  // 每个选项对应的图片
}

export interface QuestionBank {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
}

const STORAGE_KEY = 'pet-learning-system-question-banks';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useQuestionBank() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 初始加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBanks(JSON.parse(raw));
    } catch {
      console.error('Failed to load question banks');
    }
    setLoaded(true);
  }, []);

  // 持久化
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));
    }
  }, [banks, loaded]);

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
