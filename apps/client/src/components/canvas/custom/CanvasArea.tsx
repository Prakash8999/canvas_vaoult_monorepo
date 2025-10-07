import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CanvasAreaProps {
  tool: string;
  showGrid: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onMousePosition: (x: number, y: number) => void;
  shapes: any[];
  onShapesChange: (shapes: any[]) => void;
  selectedShapeIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CanvasArea({
  tool,
  showGrid,
  zoom,
  onZoomChange,
  onMousePosition,
  shapes,
  onShapesChange,
  selectedShapeIds,
  onSelectionChange
}: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      return;
    }

    if (tool === 'select') {
      // Handle selection logic here
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });

    const newShape = {
      id: Date.now().toString(),
      type: tool,
      x,
      y,
      width: 0,
      height: 0,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
    };

    setCurrentShape(newShape);
  }, [tool, zoom, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    onMousePosition(Math.round(x), Math.round(y));

    if (isPanning) {
      setPanOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }

    if (isDrawing && currentShape) {
      const width = x - startPoint.x;
      const height = y - startPoint.y;

      setCurrentShape({
        ...currentShape,
        width,
        height
      });
    }
  }, [isDrawing, currentShape, startPoint, zoom, panOffset, onMousePosition, isPanning]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentShape) {
      if (Math.abs(currentShape.width) > 5 || Math.abs(currentShape.height) > 5) {
        onShapesChange([...shapes, currentShape]);
      }
      setIsDrawing(false);
      setCurrentShape(null);
    }
  }, [isDrawing, currentShape, shapes, onShapesChange, isPanning]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = 'default';
    };
  }, []);

  const renderShape = (shape: any) => {
    const isSelected = selectedShapeIds.includes(shape.id);
    
    switch (shape.type) {
      case 'rectangle':
        return (
          <rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            className={isSelected ? 'selected' : ''}
          />
        );
      case 'circle':
        const radius = Math.sqrt(shape.width ** 2 + shape.height ** 2) / 2;
        return (
          <circle
            key={shape.id}
            cx={shape.x + shape.width / 2}
            cy={shape.y + shape.height / 2}
            r={radius}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            className={isSelected ? 'selected' : ''}
          />
        );
      case 'line':
        return (
          <line
            key={shape.id}
            x1={shape.x}
            y1={shape.y}
            x2={shape.x + shape.width}
            y2={shape.y + shape.height}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            className={isSelected ? 'selected' : ''}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-white cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair' }}
    >
      {/* Grid */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        />
      )}

      {/* Canvas content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '100vw', height: '100vh' }}
        >
          {shapes.map(renderShape)}
          {currentShape && renderShape(currentShape)}
        </svg>
      </div>

      {/* Center guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-px bg-blue-400/30 transform -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 w-px h-full bg-blue-400/30 transform -translate-x-1/2" />
      </div>
    </div>
  );
}