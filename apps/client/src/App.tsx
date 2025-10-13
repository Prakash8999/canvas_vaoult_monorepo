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


const queryClient = new QueryClient();

const App = () => {
  
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
  // (If you want to show a loading UI, implement it with state and conditional rendering)

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>} />
              <Route path="/canvas" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
              <Route path="/canvas/:id" element={<ProtectedRoute><CanvasPage /></ProtectedRoute>} />
              <Route path="/canvases" element={<ProtectedRoute><CanvasListPage /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><NotesListPage /></ProtectedRoute>} />
              <Route path="/note/:uid" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
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
