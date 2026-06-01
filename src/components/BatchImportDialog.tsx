import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  onConfirm: (names: string[]) => void;
}

export function BatchImportDialog({
  open, onOpenChange, title, description, placeholder, onConfirm,
}: BatchImportDialogProps) {
  const [text, setText] = useState('');
  const [parsedNames, setParsedNames] = useState<string[]>([]);

  const parseNames = (input: string): string[] => {
    return input
      .split(/[\n,，;；、\t]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setParsedNames(parseNames(value));
  };

  const handleConfirm = () => {
    if (parsedNames.length > 0) {
      onConfirm(parsedNames);
      setText('');
      setParsedNames([]);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) { setText(''); setParsedNames([]); }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md game-dialog">
        <DialogHeader>
          <DialogTitle className="font-game text-xs text-[#003A70]">{title}</DialogTitle>
          <DialogDescription className="font-semibold">{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[150px] game-input !py-3"
          />
          {parsedNames.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold text-[#003A70] font-display">
                已识别 <span className="text-[#EE1515]">{parsedNames.length}</span> 个名字：
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {parsedNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="font-bold text-sm px-3 py-1">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            className="game-btn game-btn-outline text-sm px-4 py-2"
            onClick={() => handleOpenChange(false)}
          >
            取消
          </button>
          <button
            className="game-btn game-btn-yellow text-sm px-4 py-2"
            onClick={handleConfirm}
            disabled={parsedNames.length === 0}
          >
            确认导入 ({parsedNames.length}人)
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
