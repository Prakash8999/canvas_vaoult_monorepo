import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiDrawer } from '@/components/ai/AiDrawer';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { Dashboard } from '@/components/workspace/Dashboard';
import NoteEditor from '@/components/editor/NoteEditor';
import { useWorkspaceStore } from '@/stores/workspace';
import QuickCapture from '@/components/quick/QuickCapture';

export function WorkspaceLayout() {
  const { 
    currentWorkspace, 
    createWorkspace, 
    workspaces, 
    currentNote,
    sidebarOpen 
  } = useWorkspaceStore();

  useEffect(() => {
    // Initialize with default workspace if none exists
    if (workspaces.length === 0) {
      createWorkspace('My Workspace');
    }
  }, [workspaces.length, createWorkspace]);

  // Global keyboard shortcut: Ctrl/Cmd + Shift + Q for Quick Capture
  // Quick capture global shortcut is handled in App to ensure it's available on all pages

  const renderMainContent = () => {
    if (!currentNote) {
      return <Dashboard />;
    }
    if (currentNote.type === 'canvas') {
      return <CanvasWorkspace />;
    }
    if (currentNote.type === 'note') {
      return <NoteEditor embedded />;
    }
  };

  return (
    <div className="h-screen bg-workspace-bg flex flex-col overflow-hidden">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Area */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex-1 overflow-hidden transition-all duration-300 ${
            sidebarOpen ? 'ml-0' : 'ml-0'
          }`}
        >
          <Dashboard/>
        </motion.main>
      </div>

      {/* AI Drawer */}
      <AiDrawer />
      {/* Quick Capture Modal */}
      <QuickCapture />
    </div>
  );
}