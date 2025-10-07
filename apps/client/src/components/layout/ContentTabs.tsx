import { motion } from 'framer-motion';
import { FileText, Book, Palette, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace';
import { cn } from '@/lib/utils';

export function ContentTabs() {
  const { 
    activeContentType, 
    setActiveContentType, 
    currentWorkspace 
  } = useWorkspaceStore();

  const tabs = [
    {
      key: 'all' as const,
      label: 'All',
      icon: Archive,
      count: currentWorkspace?.notes.length || 0,
    },
    {
      key: 'notes' as const,
      label: 'Notes',
      icon: FileText,
      count: currentWorkspace?.notes.filter(note => note.type === 'note').length || 0,
    },
    {
      key: 'documents' as const,
      label: 'Documents',
      icon: Book,
      count: currentWorkspace?.notes.filter(note => note.type === 'document').length || 0,
    },
    {
      key: 'canvas' as const,
      label: 'Canvas',
      icon: Palette,
      count: currentWorkspace?.notes.filter(note => note.type === 'canvas').length || 0,
    },
  ];

  return (
    <div className="p-4 border-b border-workspace-border">
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeContentType === tab.key;
          
          return (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => setActiveContentType(tab.key)}
              className={cn(
                "relative flex items-center space-x-2 px-3 py-2 text-sm transition-colors",
                isActive 
                  ? "bg-workspace-hover text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-workspace-hover/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </Badge>
              )}
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-workspace-hover rounded-md"
                  style={{ zIndex: -1 }}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}