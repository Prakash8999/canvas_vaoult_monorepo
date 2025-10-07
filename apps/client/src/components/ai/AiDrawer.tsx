import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWorkspaceStore } from '@/stores/workspace';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  const handleSendMessage = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim()) return;

    const userMessage: AiMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowPrompts(false);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: AiMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: getSimulatedResponse(messageContent),
        timestamp: new Date(),
        suggestions: [
          "Expand on this idea",
          "Create a visual diagram",
          "Add more examples"
        ]
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getSimulatedResponse = (prompt: string): string => {
    if (prompt.toLowerCase().includes('summarize')) {
      return `Here's a summary of your note:\n\n• **Main concept**: The core idea revolves around the key themes you've outlined\n• **Supporting details**: Several important points that reinforce the main argument\n• **Next steps**: Consider expanding on the practical applications\n\nWould you like me to help you develop any of these points further?`;
    }
    
    if (prompt.toLowerCase().includes('mind map')) {
      return `I can help you create a mind map structure:\n\n**Central Topic**: [Your main theme]\n├── Branch 1: Core concepts\n│   ├── Sub-concept A\n│   └── Sub-concept B\n├── Branch 2: Applications\n│   ├── Practical use\n│   └── Real-world examples\n└── Branch 3: Future considerations\n\nWould you like me to convert this into an actual canvas diagram?`;
    }

    return `I understand you'd like help with: "${prompt}"\n\nBased on your current note, here are some suggestions:\n\n• I can help you restructure the content for better clarity\n• We could explore different perspectives on this topic\n• I can suggest additional resources or examples\n\nWhat specific aspect would you like to focus on?`;
  };

  const handlePromptClick = (prompt: typeof AI_PROMPTS[0]) => {
    handleSendMessage(prompt.prompt);
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
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Quick Prompts */}
                  {showPrompts && messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Quick Actions</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPrompts(!showPrompts)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-2">
                        {AI_PROMPTS.map((prompt) => (
                          <Button
                            key={prompt.title}
                            variant="ghost"
                            onClick={() => handlePromptClick(prompt)}
                            className="h-auto p-3 flex flex-col items-start space-y-1 text-left hover:bg-workspace-hover border border-workspace-border"
                            disabled={!currentNote}
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
                      </div>
                      
                      {!currentNote && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Open a note to get AI assistance
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
                        <div className={`max-w-[85%] rounded-lg p-3 ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-workspace-hover border border-workspace-border'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          
                          {message.suggestions && (
                            <div className="mt-3 space-y-2">
                              <Separator />
                              <div className="text-xs text-muted-foreground">Suggestions:</div>
                              <div className="flex flex-wrap gap-1">
                                {message.suggestions.map((suggestion, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                                    onClick={() => handleSendMessage(suggestion)}
                                  >
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
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
                  </div>
                </div>
              </ScrollArea>

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
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="self-end bg-ai-gradient hover:bg-ai-gradient/90 text-white shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="mr-1 h-3 w-3" />
                    Mock AI
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}