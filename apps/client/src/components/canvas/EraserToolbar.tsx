import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Image,
  Eraser,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Settings,
  Grid3X3,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Tool = 
  | 'select' 
  | 'rectangle' 
  | 'ellipse' 
  | 'diamond' 
  | 'arrow' 
  | 'line' 
  | 'freedraw' 
  | 'text' 
  | 'image' 
  | 'icon'
  | 'eraser'
  | 'hand';

interface EraserToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onDelete: () => void;
  zoomLevel: number;
  isGridVisible: boolean;
  onToggleGrid: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

const toolGroups = [
  {
    name: 'Selection',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
      { id: 'hand', icon: Hand, label: 'Hand (H)', shortcut: 'H' },
    ]
  },
  {
    name: 'Shapes',
    tools: [
      { id: 'rectangle', icon: Square, label: 'Rectangle (R)', shortcut: 'R' },
      { id: 'ellipse', icon: Circle, label: 'Ellipse (O)', shortcut: 'O' },
      { id: 'diamond', icon: Triangle, label: 'Diamond (D)', shortcut: 'D' },
    ]
  },
  {
    name: 'Lines',
    tools: [
      { id: 'arrow', icon: ArrowRight, label: 'Arrow (A)', shortcut: 'A' },
      { id: 'line', icon: Minus, label: 'Line (L)', shortcut: 'L' },
      { id: 'freedraw', icon: Pencil, label: 'Draw (P)', shortcut: 'P' },
    ]
  },
  {
    name: 'Content',
    tools: [
      { id: 'text', icon: Type, label: 'Text (T)', shortcut: 'T' },
      { id: 'image', icon: Image, label: 'Image (I)', shortcut: 'I' },
      { id: 'icon', icon: Palette, label: 'Icon (Ctrl+I)', shortcut: 'Ctrl+I' },
      { id: 'eraser', icon: Eraser, label: 'Eraser (E)', shortcut: 'E' },
    ]
  }
];

const colors = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB'
];

export function EraserToolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onCopy,
  onDelete,
  zoomLevel,
  isGridVisible,
  onToggleGrid,
  isLocked,
  onToggleLock
}: EraserToolbarProps) {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3 min-w-[64px]">
          {/* Main Tools */}
          <div className="space-y-2">
            {toolGroups.map((group, groupIndex) => (
              <div key={group.name}>
                <div className="space-y-1">
                  {group.tools.map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={`w-12 h-12 p-0 rounded-xl transition-all duration-200 border-0 ${
                            activeTool === tool.id
                              ? 'bg-blue-600 text-white shadow-md scale-105'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent'
                          }`}
                          onClick={() => onToolChange(tool.id as Tool)}
                        >
                          <tool.icon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-900 text-white">
                        <p>{tool.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {groupIndex < toolGroups.length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-12 h-12 p-0 rounded-xl relative overflow-hidden bg-transparent border-0 hover:bg-gray-100 transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <Palette className="absolute bottom-0 right-0 h-3 w-3 text-gray-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-900 text-white">
                  <p>Colors</p>
                </TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-48 p-3">
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-blue-500 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Stroke Width</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-6">{strokeWidth}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator className="my-3" />

          {/* Zoom Controls */}
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  onClick={onZoomIn}
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Zoom In (+)</p>
              </TooltipContent>
            </Tooltip>

            <div className="text-center py-1">
              <span className="text-xs text-gray-500 font-medium">
                {formatZoom(zoomLevel)}
              </span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  onClick={onZoomOut}
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Zoom Out (-)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator className="my-3" />

          {/* Action Controls */}
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  onClick={onUndo}
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  onClick={onRedo}
                >
                  <RotateCw className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  onClick={onCopy}
                >
                  <Copy className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Copy (Ctrl+C)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-12 h-12 p-0 rounded-xl bg-transparent border-0 hover:bg-red-50 transition-colors text-red-500 hover:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Delete (Del)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator className="my-3" />

          {/* View Controls */}
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`w-12 h-12 p-0 rounded-xl border-0 transition-colors ${
                    isGridVisible 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={onToggleGrid}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>Toggle Grid (Ctrl+G)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`w-12 h-12 p-0 rounded-xl border-0 transition-colors ${
                    isLocked 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={onToggleLock}
                >
                  {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>{isLocked ? 'Unlock' : 'Lock'} Canvas</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}