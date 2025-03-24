
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface UseDebugPanelFilesProps {
  customUrl: string;
  showMode: string;
  position: string;
  refreshInterval: number;
  backgroundColor: string;
  caption: string | null;
  captionPosition: string;
  captionSize: string;
  captionColor: string;
  captionFont: string;
  captionBgColor: string;
  captionBgOpacity: number;
  transition: string;
  setCopied: (copied: boolean) => void;
}

export const useDebugPanelFiles = ({
  customUrl,
  showMode,
  position,
  refreshInterval,
  backgroundColor,
  caption,
  captionPosition,
  captionSize,
  captionColor,
  captionFont,
  captionBgColor,
  captionBgOpacity,
  transition,
  setCopied
}: UseDebugPanelFilesProps) => {
  const navigate = useNavigate();

  const generateUrl = () => {
    let url = customUrl;
    
    const params = new URLSearchParams();
    params.append('showMode', showMode);
    params.append('position', position);
    params.append('refreshInterval', String(refreshInterval));
    params.append('backgroundColor', backgroundColor);
    
    if (caption) {
      params.append('caption', encodeURIComponent(caption));
      params.append('captionPosition', captionPosition);
      params.append('captionSize', captionSize);
      params.append('captionColor', captionColor);
      params.append('captionFont', encodeURIComponent(captionFont));
      params.append('captionBgColor', encodeURIComponent(captionBgColor));
      params.append('captionBgOpacity', String(captionBgOpacity));
    }
    
    params.append('transition', transition);
    
    return `${url}?${params.toString()}`;
  };
  
  const applySettings = () => {
    // For preview purpose only
    console.log('[useDebugPanelFiles] Applying settings...');
  };
  
  const resetDisplay = () => {
    // Reset to base display URL with no parameters
    navigate('/display');
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };
  
  const commitSettings = () => {
    const url = generateUrl();
    
    // Navigate to the main display page with these settings
    navigate(url.replace(/^.*\/display/, '/display'));
    
    toast({
      title: "Settings Applied",
      description: "Display settings have been updated.",
    });
  };
  
  const copyUrl = () => {
    const url = generateUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "URL Copied",
      description: "Display URL has been copied to clipboard.",
    });
  };
  
  const selectFile = (file: string) => {
    // FIX: Return a proper function that actually loads the file in the preview
    return () => {
      // Set the custom URL to the selected file and notify
      console.log('[useDebugPanelFiles] Selected file:', file);
      toast({
        title: "Image Selected",
        description: `Now displaying: ${file.split('/').pop()}`,
      });
      
      // Update the current URL to display the selected file with debug mode enabled
      let outputPath = file;
      if (!outputPath.startsWith('/')) {
        outputPath = `/output/${outputPath}`;
      }
      
      // Use navigate to update the URL with the selected image
      navigate(`/display?output=${encodeURIComponent(outputPath)}&debug=true`);
    };
  };
  
  const formatFileName = (fileName: string) => {
    // Strip path and return just the filename
    return fileName.split('/').pop() || fileName;
  };
  
  const isCurrentFile = (file: string, imageUrl: string | null) => {
    if (!imageUrl) return false;
    
    // Normalize paths for comparison
    const normalizedFile = file.startsWith('/') ? file : `/output/${file}`;
    const normalizedImageUrl = imageUrl.includes('/output/') ? 
      imageUrl : 
      (imageUrl.startsWith('/') ? imageUrl : `/output/${imageUrl}`);
    
    return normalizedImageUrl.includes(normalizedFile);
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };
  
  const resetSettings = () => {
    // For preview purpose only
    console.log('[useDebugPanelFiles] Resetting settings...');
  };

  return {
    generateUrl,
    applySettings,
    resetDisplay,
    commitSettings,
    copyUrl,
    selectFile,
    formatFileName,
    isCurrentFile,
    formatTime,
    resetSettings
  };
};
