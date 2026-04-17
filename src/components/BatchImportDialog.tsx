import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  onConfirm,
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
    if (!newOpen) {
      setText('');
      setParsedNames([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[150px]"
          />
          {parsedNames.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                已识别 <span className="font-bold text-primary">{parsedNames.length}</span> 个名字：
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                {parsedNames.map((name, index) => (
                  <Badge key={index} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={parsedNames.length === 0}>
            确认导入 ({parsedNames.length}人)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
