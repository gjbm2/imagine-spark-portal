
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ReferenceImageData } from '@/types/workflows';

interface PromptInputProps {
  prompt: string;
  isLoading: boolean;
  uploadedImages?: string[];
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearPrompt?: () => void;
  placeholder?: string;
  minHeight?: string;
  multiline?: boolean;
  maxLength?: number;
  onSubmit?: () => void;
  isFirstRun?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  prompt, 
  isLoading,
  uploadedImages = [],
  onPromptChange,
  onClearPrompt,
  placeholder = "Describe the image you want to create...",
  minHeight = "min-h-[120px]",
  multiline = true,
  maxLength,
  onSubmit,
  isFirstRun
}) => {
  const handleClearPrompt = () => {
    if (onClearPrompt) {
      onClearPrompt();
    } else {
      // This will need to be updated if you want to clear the prompt
      // through the parent component's state
      toast.info('Prompt cleared');
    }
  };

  // Handle Enter key if not multiline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!multiline || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (onSubmit && !isLoading && prompt.trim().length > 0) {
          onSubmit();
        }
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        placeholder={placeholder}
        className={`${minHeight} resize-none border-0 bg-transparent p-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0`}
        value={prompt}
        onChange={onPromptChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={multiline ? 3 : 1}
      />
      
      {prompt && (
        <button
          type="button"
          onClick={handleClearPrompt}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
          aria-label="Clear prompt"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {maxLength && (
        <div className="absolute bottom-1 right-3 text-xs text-muted-foreground">
          {prompt.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default PromptInput;
