import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

interface CanvasProps {
  data?: ExcalidrawElement[];
  onChange?: (elements: readonly ExcalidrawElement[], appState: any) => void;
  viewport?: { scrollX: number; scrollY: number; zoom: number } | null;
  onViewportChange?: (viewport: { scrollX: number; scrollY: number; zoom: number }) => void;
}

const Canvas = ({ data, onChange, viewport, onViewportChange }: CanvasProps) => {
  const [api, setApi] = useState<any>(null);

  // 1. Ref to block 'onChange' when we are programmatically updating the scene
  const isProgrammaticUpdate = useRef(false);

  const initialDataRef = useRef<{ elements: ExcalidrawElement[], appState?: any } | null>(null);
  const isInitializedRef = useRef(false);

  // Prepare initial data only once
  if (!initialDataRef.current && data) {
    initialDataRef.current = {
      elements: data,
      appState: viewport ? {
        scrollX: viewport.scrollX,
        scrollY: viewport.scrollY,
        zoom: { value: viewport.zoom }
      } : undefined
    };
  }

  const handleApi = useCallback((instance: any) => {
    setApi(instance);
  }, []);

  // Handle Viewport restoration
  useEffect(() => {
    if (!api || isInitializedRef.current) return;

    setTimeout(() => {
      if (viewport && (viewport.scrollX !== 0 || viewport.scrollY !== 0)) {
        api.updateScene({
          appState: {
            scrollX: viewport.scrollX,
            scrollY: viewport.scrollY,
            zoom: { value: viewport.zoom }
          }
        });
      } else if (data && data.length > 0) {
        api.scrollToContent(data, { fitToViewport: false, viewportZoomFactor: 0.1 });
      }
      isInitializedRef.current = true;
    }, 100);
  }, [api, data, viewport]);

  // Handle External Data Changes
  const lastPushedElementsRef = useRef<ExcalidrawElement[] | null>(data || null);

  useEffect(() => {
    if (!api || !data) return;
    if (data === lastPushedElementsRef.current) return;

    if (JSON.stringify(data.map(d => d.id)) !== JSON.stringify(lastPushedElementsRef.current?.map(d => d.id))) {
      // ✅ BLOCK onChange during this update
      isProgrammaticUpdate.current = true;

      api.updateScene({ elements: data });
      lastPushedElementsRef.current = data;

      // ✅ RELEASE block after short delay
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 50);
    }
  }, [api, data]);

  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    // ✅ IGNORE updates that we triggered ourselves
    if (isProgrammaticUpdate.current) return;

    lastPushedElementsRef.current = elements as ExcalidrawElement[];
    if (onChange) onChange(elements, appState);
  }, [onChange]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        theme='light'
        initialData={initialDataRef.current || undefined}
        onChange={handleChange}
        excalidrawAPI={handleApi}
      />
    </div>
  );
};

export default Canvas;