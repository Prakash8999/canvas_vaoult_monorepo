import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

/**
 * NOTE: Passing a fresh `initialData` object on every render causes Excalidraw to reinitialize
 * which can trigger its internal state listeners repeatedly and produce a "Maximum update depth" error.
 * We capture the initial data once, then for subsequent external data changes we update the scene via the API.
 */
interface CanvasProps {
  // Replace 'any[]' with 'ExcalidrawElement[]'
  data?: ExcalidrawElement[];
  onChange?: (elements: readonly ExcalidrawElement[], appState: any) => void;
  viewport?: { scrollX?: number; scrollY?: number; zoom?: number } | null;
  onViewportChange?: (viewport: { scrollX?: number; scrollY?: number; zoom?: number }) => void;
}

const Canvas = ({ data, onChange, viewport, onViewportChange }: CanvasProps) => {
  const initialElementsRef = useRef<ExcalidrawElement[] | null>(null);
  const [api, setApi] = useState<any>(null);
  const lastPushedElementsRef = useRef<ExcalidrawElement[] | null>(null);
  // Flag to indicate an update originated from inside Excalidraw (user action)
  const internalChangeRef = useRef(false);

  // Capture initial elements once (first mount only)
  if (initialElementsRef.current === null && data && Array.isArray(data)) {
    initialElementsRef.current = data;
    lastPushedElementsRef.current = data;
  }

  // When external `data` changes (e.g., loaded from store) update the scene without reinitializing
  useEffect(() => {
    if (!api) return;
    if (!data || !Array.isArray(data)) return;

    // If this render is immediately following an internal change (onChange from Excalidraw),
    // skip pushing data back into the scene to avoid a feedback loop.
    if (internalChangeRef.current) {
      internalChangeRef.current = false; // reset flag
      return;
    }

    // If the incoming array reference matches what we already pushed, skip.
    if (data === lastPushedElementsRef.current) return;

    const prev = lastPushedElementsRef.current;
    let shouldUpdate = false;
    if (!prev) shouldUpdate = true;
    else if (prev.length !== data.length) shouldUpdate = true;
    else {
      // cheap shallow compare on ids & version if present
      for (let i = 0; i < data.length; i++) {
        const a = (prev as any)[i];
        const b = (data as any)[i];
        if (a !== b && (a?.id !== b?.id || a?.version !== b?.version)) { shouldUpdate = true; break; }
      }
    }
    if (shouldUpdate) {
      api.updateScene({ elements: data });
      lastPushedElementsRef.current = data;
    }
  }, [data, api]);

  // Stable onChange wrapper to reduce parent re-renders / feedback loops
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    // Mark that this update came from inside Excalidraw so effect won't echo it back
    internalChangeRef.current = true;
    lastPushedElementsRef.current = elements as any[];
    onChange?.(elements, appState);
  }, [onChange]);

  const handleApi = useCallback((instance: any) => {
    setApi(instance);
    // apply initial viewport if provided
    if (instance && initialElementsRef.current && initialElementsRef.current.length) {
      // nothing to do here for elements - initialData handles it
    }
    if (instance && typeof instance.updateScene === 'function' && viewport) {
      try {
        instance.updateScene({ appState: { scrollX: viewport.scrollX ?? 0, scrollY: viewport.scrollY ?? 0, zoom: viewport.zoom ?? 1 } });
      } catch (e) {
        // ignore if updateScene doesn't accept appState in this version
      }
    }
  }, [viewport]);

  // watch for API and app state changes to notify parent about viewport updates
  useEffect(() => {
    if (!api) return;
    // some Excalidraw versions expose `getSceneElements` and `getAppState` via the api
    const handleSync = () => {
      try {
        const appState = api.getAppState?.() || api.getSceneState?.();
        if (appState && typeof onViewportChange === 'function') {
          const vp = { scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom };
          onViewportChange(vp);
        }
      } catch (e) {
        // ignore
      }
    };

    // Polling as fallback because Excalidraw's API doesn't always provide events
    const id = window.setInterval(handleSync, 500);
    return () => window.clearInterval(id);
  }, [api, onViewportChange]);
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        theme='light'
        initialData={initialElementsRef.current ? { elements: initialElementsRef.current } : undefined}
        onChange={handleChange}
        excalidrawAPI={handleApi}
      />
    </div>
  );
};

export default Canvas;
