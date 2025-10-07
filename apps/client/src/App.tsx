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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<WorkspaceLayout />} />
            <Route path="/canvas" element={<CanvasPage />} />
            <Route path="/canvas/:id" element={<CanvasPage />} />
            <Route path="/canvases" element={<CanvasListPage />} />
            <Route path="/notes" element={<NotesListPage />} />
            <Route path="/note/:id" element={<NoteEditorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* <Route path="/note" element={<NoteEditorPage />} /> */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {/* Mount QuickCapture at the app root so it can appear on any page */}
        <QuickCapture />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
