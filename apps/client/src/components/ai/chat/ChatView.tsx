import { useState, useRef, useEffect, useMemo } from 'react';
import { useChatMessages, useSendMessage, useChats, useChatMutations } from '@/hooks/useAIChat';
import { useAICredits, useAIConstraints, useSupportedModels, useUserAIConfigs } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Loader2, Send, Settings2, Coins, Pencil, Check, X as XIcon, ShieldCheck, Sparkles } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface ChatViewProps {
    chatId: number;
    initialTitle?: string;
    onOpenSettings?: () => void;
}

export function ChatView({ chatId, initialTitle, onOpenSettings }: ChatViewProps) {
    const [input, setInput] = useState('');

    // Core State
    const [mode, setMode] = useState<'system' | 'byok'>('system');
    const [selectedModel, setSelectedModel] = useState('');

    // Chat Title State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { data: messages, isLoading: messagesLoading } = useChatMessages(chatId);
    const sendMessageMutation = useSendMessage();
    const { data: credits } = useAICredits();
    const { data: constraints } = useAIConstraints();
    const { data: supportedModelsDB } = useSupportedModels();
    const { data: userConfigs } = useUserAIConfigs();

    const { update } = useChatMutations();

    // Derived State
    const allModels = useMemo(() => {
        return supportedModelsDB || [];
    }, [supportedModelsDB]);

    // Helpers
    const getProviderForModel = (modelName: string): 'gemini' | 'perplexity' => {
        const found = allModels.find(m => m.name === modelName);
        return (found?.provider as 'gemini' | 'perplexity') || 'gemini';
    };

    const isModelEnabled = (modelName: string, provider: string) => {
        if (mode === 'system') return true;
        // BYOK mode: check if has key
        const config = userConfigs?.find(c => c.provider === provider && c.model === modelName);
        return !!config?.has_key;
    };

    // Initialize Default Model logic
    useEffect(() => {
        if (userConfigs && userConfigs.length > 0) {
            const defaultMethod = userConfigs.find(c => c.is_default);
            // If user has a default BYOK, use it
            if (defaultMethod) {
                // If it has a key, prefer BYOK mode
                if (defaultMethod.has_key) {
                    setMode('byok');
                }
                setSelectedModel(defaultMethod.model);
            }
        }
    }, [userConfigs]);

    // Handle mode changes - auto-select appropriate model
    useEffect(() => {
        if (mode === 'byok' && userConfigs && userConfigs.length > 0) {
            // In BYOK mode, select default model with key, or first model with key
            const defaultWithKey = userConfigs.find(c => c.is_default && c.has_key);
            const firstWithKey = userConfigs.find(c => c.has_key);

            if (defaultWithKey) {
                setSelectedModel(defaultWithKey.model);
            } else if (firstWithKey) {
                setSelectedModel(firstWithKey.model);
            }
        } else if (mode === 'system' && allModels.length > 0) {
            // In system mode, select first available model if current selection has no key
            const currentProvider = getProviderForModel(selectedModel);
            const currentConfig = userConfigs?.find(c => c.provider === currentProvider && c.model === selectedModel);

            // If current model doesn't have a key in BYOK but we're switching to system, that's fine
            // Just ensure we have a valid model selected
            if (!selectedModel) {
                setSelectedModel(allModels[0].name);
            }
        }
    }, [mode, userConfigs, allModels]);

    // Fallback selection if nothing selected
    useEffect(() => {
        if (!selectedModel && allModels.length > 0) {
            setSelectedModel(allModels[0].name);
        }
    }, [selectedModel, allModels]);

    // Initialize/Sync title input
    useEffect(() => {
        if (initialTitle) {
            setTitleInput(initialTitle);
        }
    }, [initialTitle, chatId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sendMessageMutation.isPending, chatId]);


    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // Validation based on mode
        const provider = getProviderForModel(selectedModel);

        if (mode === 'byok') {
            const enabled = isModelEnabled(selectedModel, provider);
            if (!enabled) {
                toast.error(`Missing API Key for ${selectedModel}. Please configure in settings.`);
                onOpenSettings?.();
                return;
            }
        } else {
            // System mode credits check
            if (credits !== undefined && credits <= 0) {
                toast.error('No AI credits remaining');
                return;
            }
        }

        if (constraints && input.length > constraints.maxInputLength) {
            toast.error('Input too long');
            return;
        }

        setInput('');

        sendMessageMutation.mutate({
            chatId,
            input,
            provider: provider,
            model: selectedModel,
            forceSystemKey: mode === 'system', // Tell backend to use system key even if custom key exists
        });
    };

    const handleSaveTitle = () => {
        if (initialTitle && titleInput.trim() && titleInput.trim() !== initialTitle) {
            update.mutate({ id: chatId, title: titleInput.trim() });
        }
        setIsEditingTitle(false);
    };

    const hasNoCredits = mode === 'system' && credits !== undefined && credits <= 0;

    return (
        <div className="flex flex-col h-full flex-1">
            {/* Header / Config */}
            <div className="p-4 border-b border-workspace-border space-y-3">
                {/* Credits & Title Display */}
                <div className="flex items-center justify-between p-2 bg-workspace-hover rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Credits:</span>
                        <Badge variant={hasNoCredits ? 'destructive' : 'secondary'} className="font-mono">
                            {credits ?? 0}
                        </Badge>
                    </div>

                    {/* Chat Title / Edit */}
                    <div className="flex items-center justify-end flex-1 ml-4 overflow-hidden">
                        {isEditingTitle ? (
                            <div className="flex items-center space-x-1 w-full max-w-[200px]">
                                <Input
                                    className="h-7 text-xs bg-background border-workspace-border"
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                    autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={handleSaveTitle}>
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingTitle(false)}>
                                    <XIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 group overflow-hidden pl-4">
                                <span
                                    className="text-sm font-medium truncate cursor-text"
                                    title={initialTitle}
                                    onDoubleClick={() => setIsEditingTitle(true)}
                                >
                                    {initialTitle || 'New Chat'}
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Config Link (BYOK) */}
                <div className="pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenSettings}
                        className="w-full h-8 text-xs border-dashed gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        Configure Models & Keys (BYOK)
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages?.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-workspace-hover border border-workspace-border'
                                            }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </div>
                            ))}

                            {/* Optimistic User Message */}
                            {sendMessageMutation.isPending && sendMessageMutation.variables && (
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] rounded-lg p-3 bg-primary text-primary-foreground opacity-70">
                                        <div className="text-sm whitespace-pre-wrap">{sendMessageMutation.variables.input}</div>
                                    </div>
                                </div>
                            )}

                            {sendMessageMutation.isPending && (
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
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-workspace-border bg-workspace-panel/30">
                <div className="flex flex-col space-y-3">
                    <div className="flex space-x-2">
                        <Textarea
                            placeholder={`Ask AI (${mode === 'byok' ? 'Custom Key' : 'System Credits'})...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="min-h-[60px] resize-none bg-background border-workspace-border text-foreground placeholder:text-muted-foreground shadow-sm focus-visible:ring-1"
                            disabled={sendMessageMutation.isPending || hasNoCredits}
                            spellCheck={true}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || sendMessageMutation.isPending || hasNoCredits}
                            className="self-end bg-ai-gradient hover:bg-ai-gradient/90 text-white shadow-glow h-10 w-10 p-0 rounded-xl"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Footer Controls (Mode & Model Selection) */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex items-center space-x-2">
                            {/* Mode Selection */}
                            <Select
                                value={mode}
                                onValueChange={(value: 'system' | 'byok') => setMode(value)}
                            >
                                <SelectTrigger className="h-7 min-w-[120px] flex-1 text-[11px] bg-background border-workspace-border rounded-md px-2 gap-1 icon-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system" className="text-xs flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 mr-1 inline" />
                                        System Defaults
                                    </SelectItem>
                                    <SelectItem value="byok" className="text-xs flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3 mr-1 inline" />
                                        My Custom Keys
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Unified Model Selection */}
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                            >
                                <SelectTrigger className="h-7 min-w-[180px] flex-[2] text-[11px] bg-background border-workspace-border rounded-md px-2 gap-1 icon-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {allModels.map((model) => {
                                        const enabled = isModelEnabled(model.name, model.provider);
                                        return (
                                            <SelectItem
                                                key={model.name}
                                                value={model.name}
                                                disabled={!enabled}
                                                className="text-xs truncate relative"
                                            >
                                                <span className={!enabled ? 'opacity-50' : ''}>{model.name}</span>
                                                {!enabled && mode === 'byok' && (
                                                    <span className="ml-2 text-[9px] text-destructive/80">(No Key)</span>
                                                )}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
