import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  MoreHorizontal,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';

interface Shape {
  id: string;
  type: string;
  name?: string;
  visible: boolean;
  locked: boolean;
}

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onShapeUpdate: (id: string, updates: Partial<Shape>) => void;
  onShapeDelete: (id: string) => void;
}

export function RightPanel({
  isOpen,
  onClose,
  shapes,
  selectedShapeIds,
  onSelectionChange,
  onShapeUpdate,
  onShapeDelete
}: RightPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['shapes']));

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'rectangle': return '▢';
      case 'circle': return '○';
      case 'line': return '─';
      case 'arrow': return '→';
      case 'text': return 'T';
      case 'pencil': return '✏';
      case 'frame': return '⬚';
      case 'comment': return '💬';
      default: return '●';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-lg z-40"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">Layers</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-6 h-6 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* Shapes Group */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup('shapes')}
              className="flex items-center gap-2 w-full p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <ChevronRight 
                className={`h-3 w-3 transition-transform ${
                  expandedGroups.has('shapes') ? 'rotate-90' : ''
                }`} 
              />
              Shapes ({shapes.length})
            </button>

            {expandedGroups.has('shapes') && (
              <div className="space-y-1 ml-4">
                {shapes.length === 0 ? (
                  <div className="text-sm text-gray-400 p-2">No shapes yet</div>
                ) : (
                  shapes.map((shape) => {
                    const isSelected = selectedShapeIds.includes(shape.id);
                    
                    return (
                      <div
                        key={shape.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onSelectionChange([shape.id])}
                      >
                        <span className="text-sm">{getShapeIcon(shape.type)}</span>
                        <span className="text-sm flex-1 truncate">
                          {shape.name || `${shape.type} ${shape.id.slice(-4)}`}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShapeUpdate(shape.id, { visible: !shape.visible });
                            }}
                            className="w-5 h-5 p-0 text-gray-400 hover:text-gray-600"
                          >
                            {shape.visible ? 
                              <Eye className="h-3 w-3" /> : 
                              <EyeOff className="h-3 w-3" />
                            }
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShapeUpdate(shape.id, { locked: !shape.locked });
                            }}
                            className="w-5 h-5 p-0 text-gray-400 hover:text-gray-600"
                          >
                            {shape.locked ? 
                              <Lock className="h-3 w-3" /> : 
                              <Unlock className="h-3 w-3" />
                            }
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Rename</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem>Bring to Front</DropdownMenuItem>
                              <DropdownMenuItem>Send to Back</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => onShapeDelete(shape.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}