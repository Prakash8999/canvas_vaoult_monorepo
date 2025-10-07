import { 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  Share2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface CanvasTopbarProps {
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomToFit: () => void;
  onExport: (format: string) => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasTopbar({
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onZoomToFit,
  onExport,
  onShare,
  canUndo,
  canRedo
}: CanvasTopbarProps) {
  const zoomOptions = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-2 flex items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.max(zoom * 0.8, 0.1))}
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                {Math.round(zoom * 100)}%
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {zoomOptions.map((zoomOption) => (
                <DropdownMenuItem
                  key={zoomOption}
                  onClick={() => onZoomChange(zoomOption / 100)}
                  className="text-sm"
                >
                  {zoomOption}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.min(zoom * 1.25, 5))}
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomToFit}
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Export/Share */}
        <div className="flex items-center gap-1 pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-600 hover:text-gray-900">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('png')}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('svg')}>
                Export as SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}