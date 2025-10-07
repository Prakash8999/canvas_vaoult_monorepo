import { Excalidraw } from "@excalidraw/excalidraw";
import { useRef, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface ExcalidrawCanvasProps {
  initialData?: {
    elements: readonly any[];
    appState: any;
  };
  onChange?: (elements: readonly any[], appState: any) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function ExcalidrawCanvas({ 
  initialData, 
  onChange, 
  theme = 'light',
  readOnly = false,
  height = "100%",
  className = ""
}: ExcalidrawCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const excalidrawRef = useRef<any>(null);

  // Memoize the onChange handler to prevent infinite re-renders
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    // Only call onChange if we actually have new data to avoid infinite loops
    if (onChange && elements && appState) {
      onChange(elements, appState);
    }
  }, [onChange]);

  // Memoize excalidraw props to prevent unnecessary re-renders
  const excalidrawProps = useMemo(() => ({
    initialData,
    onChange: handleChange,
    theme,
    viewModeEnabled: readOnly,
    zenModeEnabled: false,
    gridModeEnabled: false,
    excalidrawAPI: (api: any) => setExcalidrawAPI(api),
  }), [initialData, handleChange, theme, readOnly]);

  return (
    <motion.div 
      className={`w-full ${className}`}
      style={{ height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Excalidraw {...excalidrawProps} />
    </motion.div>
  );
}