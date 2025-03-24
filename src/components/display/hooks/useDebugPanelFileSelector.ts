
import { useCallback } from 'react';

interface UseDebugPanelFileSelectorProps {
  selectFile: (file: string) => void;
  isCurrentFile: (file: string, imageUrl: string | null) => boolean;
  imageUrl: string | null;
}

export const useDebugPanelFileSelector = ({
  selectFile,
  isCurrentFile,
  imageUrl
}: UseDebugPanelFileSelectorProps) => {
  
  // Create a callback that returns a function to match the expected type
  const selectFileHandler = useCallback((file: string) => {
    return () => {
      console.log('[useDebugPanelFileSelector] Selecting file:', file);
      selectFile(file);
    };
  }, [selectFile]);
  
  // Create a callback to check if a file is currently selected
  const isCurrentFileHandler = useCallback((file: string) => {
    return isCurrentFile(file, imageUrl);
  }, [isCurrentFile, imageUrl]);
  
  return {
    selectFileHandler,
    isCurrentFileHandler
  };
};
