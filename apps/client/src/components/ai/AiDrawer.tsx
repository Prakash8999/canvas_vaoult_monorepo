import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  FileText,
  Image,
  Brain,
  Wand2,
  MessageCircle,
  ChevronDown,
  Loader2,
  Coins,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/stores/workspace';
import { useAICredits, useAIConstraints, useGenerateAI } from '@/hooks/useAI';
import { toast } from 'sonner';

interface AiMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AI_PROMPTS = [
  {
    title: "Summarize this note",
    description: "Create a concise summary of the current note",
    icon: FileText,
    prompt: "Please summarize the main points of this note in 2-3 bullet points."
  },
  {
    title: "Create a mind map",
    description: "Generate a visual mind map structure",
    icon: Brain,
    prompt: "Create a mind map structure for the concepts in this note. Show the main topic and branching subtopics."
  },
  {
    title: "Generate diagram",
    description: "Convert text into a visual diagram",
    icon: Image,
    prompt: "Convert the information in this note into a visual diagram or flowchart."
  },
  {
    title: "Improve writing",
    description: "Enhance clarity and readability",
    icon: Wand2,
    prompt: "Help me improve the writing in this note. Make it clearer, more concise, and better structured."
  }
];

export function AiDrawer() {
  const { aiDrawerOpen, toggleAiDrawer, currentNote } = useWorkspaceStore();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'perplexity'>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-exp');

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI data
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const { data: constraints } = useAIConstraints();
  const generateAI = useGenerateAI();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generateAI.isPending]);

  // Update model when provider changes
  useEffect(() => {
    if (constraints?.supportedModels) {
      const models = constraints.supportedModels[selectedProvider];
      if (models && models.length > 0) {
        setSelectedModel(models[0]);
      }
    }
  }, [selectedProvider, constraints]);

  // Refetch credits when drawer opens
  useEffect(() => {
    if (aiDrawerOpen) {
      refetchCredits();
    }
  }, [aiDrawerOpen, refetchCredits]);

  const handleSendMessage = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim()) return;

    // Validate input length
    if (constraints && messageContent.length > constraints.maxInputLength) {
      toast.error('Input too long', {
        description: `Maximum ${constraints.maxInputLength} characters allowed. Current: ${messageContent.length}`,
      });
      return;
    }

    // Check credits
    if (credits !== undefined && credits <= 0) {
      toast.error('No AI credits remaining', {
        description: 'You have run out of AI credits. Please contact support to get more.',
      });
      return;
    }

    const userMessage: AiMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowPrompts(false);

    try {
      // Call AI API with selected provider and model
      const response = await generateAI.mutateAsync({
        provider: selectedProvider,
        model: selectedModel,
        input: messageContent,
      });




      const aiMessage: AiMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('AI generation error:', error);
    }
  };

  const handlePromptClick = (prompt: typeof AI_PROMPTS[0]) => {
    handleSendMessage(prompt.prompt);
  };

  const inputLength = input.length;
  const maxLength = constraints?.maxInputLength || 300;
  const isInputTooLong = inputLength > maxLength;
  const hasNoCredits = credits !== undefined && credits <= 0;

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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-workspace-panel border-l border-workspace-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-workspace-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-ai-gradient rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentNote ? `Working on: ${currentNote.title}` : 'Ready to help'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAiDrawer}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Credits Display */}
              <div className="mt-3 flex items-center justify-between p-2 bg-workspace-hover rounded-lg">
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Credits</span>
                </div>
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant={hasNoCredits ? 'destructive' : 'secondary'} className="font-mono">
                    {credits ?? 0}
                  </Badge>
                )}
              </div>

              {/* Provider & Model Selection */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Settings2 className="h-3 w-3" />
                  <span>AI Configuration</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Provider Selection */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Provider</label>
                    <Select
                      value={selectedProvider}
                      onValueChange={(value: 'gemini' | 'perplexity') => setSelectedProvider(value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-workspace-hover border-workspace-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {constraints?.supportedProviders.map((provider) => (
                          <SelectItem key={provider} value={provider} className="text-xs">
                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Model</label>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger className="h-8 text-xs bg-workspace-hover border-workspace-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {constraints?.supportedModels[selectedProvider]?.map((model) => (
                          <SelectItem key={model} value={model} className="text-xs">
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-4">
                  {/* Quick Prompts */}
                  {showPrompts && messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Quick Actions</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPrompts(!showPrompts)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div> */}

                      {/* <div className="grid gap-2">
                        {AI_PROMPTS.map((prompt) => (
                          <Button
                            key={prompt.title}
                            variant="ghost"
                            onClick={() => handlePromptClick(prompt)}
                            className="h-auto p-3 flex flex-col items-start space-y-1 text-left hover:bg-workspace-hover border border-workspace-border"
                            disabled={!currentNote || hasNoCredits}
                          >
                            <div className="flex items-center space-x-2">
                              <prompt.icon className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{prompt.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {prompt.description}
                            </span>
                          </Button>
                        ))}
                      </div> */}

                      {!currentNote && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Open a note to get AI assistance
                        </div>
                      )}

                      {hasNoCredits && (
                        <div className="text-center text-sm text-destructive py-4">
                          No AI credits remaining
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Messages */}
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-lg p-3 ${message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-workspace-hover border border-workspace-border'
                          }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </motion.div>
                    ))}

                    {generateAI.isPending && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-ai-thinking rounded-lg p-3 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-workspace-border">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ask AI anything about your note..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] resize-none bg-workspace-hover border-workspace-border text-foreground placeholder:text-muted-foreground"
                    disabled={generateAI.isPending || hasNoCredits}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || generateAI.isPending || isInputTooLong || hasNoCredits}
                    className="self-end bg-ai-gradient hover:bg-ai-gradient/90 text-white shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span className={isInputTooLong ? 'text-destructive' : ''}>
                    {inputLength}/{maxLength}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
