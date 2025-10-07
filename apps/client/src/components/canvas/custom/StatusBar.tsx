import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
}

interface StatusBarProps {
  zoom: number;
  mousePosition: { x: number; y: number };
  collaborators: Collaborator[];
  selectedTool: string;
  onZoomChange: (zoom: number) => void;
}

export function StatusBar({
  zoom,
  mousePosition,
  collaborators,
  selectedTool,
  onZoomChange
}: StatusBarProps) {
  const activeCollaborators = collaborators.filter(c => c.isActive);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 z-40"
    >
      <div className="flex items-center justify-between h-full">
        {/* Left side - Tool and mouse position */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant="outline" className="capitalize">
            {selectedTool}
          </Badge>
          <span>
            x: {mousePosition.x}, y: {mousePosition.y}
          </span>
        </div>

        {/* Center - Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange(zoom * 0.9)}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(zoom * 1.1)}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            +
          </button>
        </div>

        {/* Right side - Collaborators */}
        <div className="flex items-center gap-2">
          {activeCollaborators.length > 0 ? (
            <>
              <span className="text-sm text-gray-600 mr-2">
                {activeCollaborators.length} online
              </span>
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map((collaborator) => (
                  <Avatar
                    key={collaborator.id}
                    className="w-6 h-6 border-2 border-white"
                    style={{ borderColor: collaborator.color }}
                  >
                    <AvatarImage src={collaborator.avatar} />
                    <AvatarFallback 
                      className="text-xs font-medium text-white"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {activeCollaborators.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      +{activeCollaborators.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">No one else here</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}