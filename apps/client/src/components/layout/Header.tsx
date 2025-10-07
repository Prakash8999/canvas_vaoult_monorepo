import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Search, 
  Share, 
  MoreHorizontal,
  Command,
  Sparkles,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    currentNote, 
    aiDrawerOpen,
    toggleAiDrawer,
    toggleCommandPalette
  } = useWorkspaceStore();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <motion.header 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="h-14 bg-workspace-panel border-b border-workspace-border flex items-center justify-between px-4 pr-10"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4 ">
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-foreground hover:bg-workspace-hover"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-ai-gradient rounded-md flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-foreground">CanvasVault</span>
          </div>
          
          {currentNote && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium">{currentNote.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCommandPalette}
          className="text-muted-foreground hover:text-foreground hover:bg-workspace-hover transition-all duration-200 hover:scale-105"
        >
          <Command className="mr-2 h-3 w-3" />
          <span className="hidden sm:inline">Command Palette</span>
          <kbd className="ml-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3 text-warning" />
          )}
          <span className="hidden sm:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Collaboration */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-workspace-hover"
        >
          <Users className="h-4 w-4" />
        </Button>

        {/* AI Assistant Toggle */}
        <Button
          variant={aiDrawerOpen ? "default" : "ghost"}
          size="icon"
          onClick={toggleAiDrawer}
          className={aiDrawerOpen 
            ? "bg-ai-gradient hover:bg-ai-gradient/90 text-white shadow-glow" 
            : "text-muted-foreground hover:text-foreground hover:bg-workspace-hover"
          }
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-workspace-hover"
        >
          <Share className="h-4 w-4" />
        </Button>

        {/* More Options */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-workspace-hover"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.header>
  );
}