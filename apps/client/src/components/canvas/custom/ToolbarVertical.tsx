import { 
  MousePointer, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Brush, 
  Type, 
  Eraser,
  Frame,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface Tool {
  id: string;
  name: string;
  icon: any;
  shortcut: string;
}

const tools: Tool[] = [
  { id: 'select', name: 'Select', icon: MousePointer, shortcut: 'V' },
  { id: 'rectangle', name: 'Rectangle', icon: Square, shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: Circle, shortcut: 'O' },
  { id: 'line', name: 'Line', icon: Minus, shortcut: 'L' },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight, shortcut: 'A' },
  { id: 'pencil', name: 'Pencil', icon: Brush, shortcut: 'D' },
  { id: 'text', name: 'Text', icon: Type, shortcut: 'T' },
  { id: 'eraser', name: 'Eraser', icon: Eraser, shortcut: 'E' },
  { id: 'frame', name: 'Frame', icon: Frame, shortcut: 'F' },
  { id: 'comment', name: 'Comment', icon: MessageSquare, shortcut: 'C' },
];

interface ToolbarVerticalProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export function ToolbarVertical({ activeTool, onToolChange }: ToolbarVerticalProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-2 space-y-1">
        <TooltipProvider>
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onToolChange(tool.id)}
                    className={`w-10 h-10 transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  <span>{tool.name}</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                    {tool.shortcut}
                  </kbd>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </motion.div>
  );
}