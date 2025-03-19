
import React, { useRef, useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConsoleOutputProps {
  logs: string[];
  isVisible: boolean;
  onClose: () => void;
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ logs, isVisible, onClose }) => {
  const [height, setHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<number | null>(null);
  const dragStartHeight = useRef<number | null>(null);
  
  useEffect(() => {
    if (isVisible && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, isVisible]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPosition.current = e.clientY;
    dragStartHeight.current = height;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragStartPosition.current !== null && dragStartHeight.current !== null) {
      const deltaY = dragStartPosition.current - e.clientY;
      const newHeight = Math.max(100, Math.min(window.innerHeight * 0.7, dragStartHeight.current + deltaY));
      setHeight(newHeight);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  const handleSaveLogs = () => {
    try {
      const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Console logs saved successfully');
    } catch (error) {
      console.error('Error saving logs:', error);
      toast.error('Failed to save console logs');
    }
  };
  
  useEffect(() => {
    // Add cursor style to the body when dragging
    if (isDragging) {
      document.body.style.cursor = 'ns-resize';
    } else {
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.cursor = '';
    };
  }, [isDragging]);
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-2xl transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ height: `${height}px` }}
    >
      {/* Drag handle - Improved visual feedback */}
      <div 
        className={`absolute left-0 right-0 top-0 h-4 bg-muted cursor-ns-resize ${isDragging ? 'bg-muted-foreground/30' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-16 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-1.5" />
      </div>
      
      <div className="flex justify-between items-center p-3 border-b mt-4">
        <h3 className="font-semibold">Console Output</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={handleSaveLogs}
          >
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={consoleRef}
        className="p-3 overflow-auto font-mono text-xs bg-black text-white"
        style={{ height: `calc(100% - 55px)` }}
      >
        {logs.length === 0 ? (
          <p className="text-white/60">No console logs yet.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="py-1 border-b border-white/10 last:border-0">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsoleOutput;
