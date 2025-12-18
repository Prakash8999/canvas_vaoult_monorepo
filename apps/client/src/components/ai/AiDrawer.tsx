import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageSquarePlus, Clock, History, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspace';
import { ChatList } from './chat/ChatList';
import { ChatView } from './chat/ChatView';
import { useChats, useChatMutations, useLatestChat } from '@/hooks/useAIChat';
import { Loader2 } from 'lucide-react';
import { ModelSettingsDialog } from './settings/ModelSettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AiDrawer() {
  const { aiDrawerOpen, toggleAiDrawer, currentNote } = useWorkspaceStore();
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Data & Mutations
  const { data: latestChat } = useLatestChat();
  const { data: chats } = useChats({ enabled: showHistory });
  const { create, remove } = useChatMutations();

  // Resolve active chat object
  const activeChat = (activeChatId && latestChat && latestChat.id === activeChatId)
    ? latestChat
    : chats?.find(c => c.id === activeChatId);

  // Handle active chat selection logic (Load latest on mount if empty)
  useEffect(() => {
    if (!activeChatId && latestChat) {
      setActiveChatId(latestChat.id);
    }
  }, [latestChat, activeChatId]);

  const handleCreateChat = () => {
    create.mutate(undefined, {
      onSuccess: (newChat) => {
        setActiveChatId(newChat.id);
        setShowHistory(false);
      }
    });
  };

  const handleDeleteChat = (chatId: number) => {
    remove.mutate(chatId);
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const handleSelectChat = (chatId: number) => {
    setActiveChatId(chatId);
    setShowHistory(false);
  };

  return (
    <AnimatePresence>
      {aiDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleAiDrawer}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 h-screen w-[450px] bg-workspace-card border-l border-workspace-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-14 border-b border-workspace-border flex items-center justify-between px-4 bg-workspace-panel select-none">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-ai-gradient flex items-center justify-center text-white shadow-glow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {currentNote ? `Working on: ${currentNote.title}` : 'Ready to help'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* New Chat Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="New Chat"
                  onClick={handleCreateChat}
                  disabled={create.isPending}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                {/* History Modal Trigger */}
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      title="Chat History"
                    >
                      <History className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-4 border-b border-border">
                      <DialogTitle>Chat History</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <ChatList
                        chats={chats || []}
                        activeChatId={activeChatId}
                        onSelectChat={handleSelectChat}
                        onCreateChat={handleCreateChat}
                        onDeleteChat={handleDeleteChat}
                        className="w-full border-none bg-background"
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Settings"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAiDrawer}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Area: Chat View */}
            <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
              {activeChatId ? (
                <ChatView
                  chatId={activeChatId}
                  initialTitle={activeChat?.title}
                  onOpenSettings={() => setShowSettings(true)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-workspace-panel p-6 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquarePlus className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-lg">New Conversation</h3>
                      <p className="text-sm">Start a new chat to get help with your writing, coding, or brainstorming.</p>
                    </div>
                    <Button onClick={handleCreateChat} className="bg-ai-gradient text-white shadow-glow" disabled={create.isPending}>
                      {create.isPending ? 'Creating...' : 'Start New Chat'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </>
      )}
      <ModelSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </AnimatePresence>
  );
}
