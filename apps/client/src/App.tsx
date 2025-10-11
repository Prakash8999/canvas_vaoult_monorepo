import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CanvasPage from "./pages/CanvasPage";
import CanvasListPage from "./pages/CanvasListPage";
import NoteEditorPage from "./pages/NoteEditorPage";
import NotesListPage from "./pages/NotesListPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import QuickCapture from '@/components/quick/QuickCapture';
import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CommandPalette } from '@/components/ui/command-palette';
import { useDexieHydration } from './hooks/useDexieHydration';
import { useSyncManager } from './hooks/useSyncManager';
import { SyncStatusBadge, SyncDebugPanel } from './components/SyncStatusBadge';

const queryClient = new QueryClient();

const App = () => {
  // Dexie hydration
  const { hydrationComplete, migrationError } = useDexieHydration();

  // Sync manager
  const { startSyncManager, stopSyncManager } = useSyncManager();

  // Start sync manager after hydration
  useEffect(() => {
    if (hydrationComplete) {
      startSyncManager();
    }

    return () => {
      stopSyncManager();
    };
  }, [hydrationComplete, startSyncManager, stopSyncManager]);

  // Register global keyboard shortcut for Quick Capture so it's available on every page
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        useWorkspaceStore.getState().toggleQuickCapture();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Show loading during hydration
  if (!hydrationComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
          {migrationError && (
            <p className="text-red-600 text-sm mt-2">Migration error: {migrationError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Sync Status Badge */}
            <div className="fixed top-4 right-4 z-50">
              <SyncStatusBadge />
            </div>

            {/* Debug Panel in development */}
            <SyncDebugPanel />

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>} />
              <Route path="/canvas" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
              <Route path="/canvas/:id" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
              <Route path="/canvases" element={<ProtectedRoute><CanvasListPage /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><NotesListPage /></ProtectedRoute>} />
              <Route path="/note/:id" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              {/* <Route path="/note" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} /> */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {/* Mount QuickCapture at the app root so it can appear on any page */}
          <QuickCapture />
          <CommandPalette />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
