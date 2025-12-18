import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, Trash2, Check, ShieldCheck, ShieldAlert, Settings2, Sparkles } from 'lucide-react';
import { useSupportedModels, useUserAIConfigs, useUserAIConfigMutations } from '@/hooks/useAI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModelSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ModelSettingsDialog({ open, onOpenChange }: ModelSettingsDialogProps) {
    const { data: models, isLoading: modelsLoading } = useSupportedModels();
    const { data: configs, isLoading: configsLoading } = useUserAIConfigs();
    const { setConfig, removeConfig } = useUserAIConfigMutations();

    const [editingKey, setEditingKey] = useState<{ provider: string, model: string } | null>(null);
    const [keyInput, setKeyInput] = useState('');
    const [activeTab, setActiveTab] = useState('gemini'); // Default tab

    const providers = Array.from(new Set(models?.map(m => m.provider) || []));

    const getConfig = (provider: string, model: string) =>
        configs?.find(c => c.provider === provider && c.model === model);

    const handleEditKey = (provider: string, model: string) => {
        setEditingKey({ provider, model });
        setKeyInput('');
    }

    const handleSaveKey = async (provider: string, model: string) => {
        if (!keyInput.trim()) return;
        await setConfig.mutateAsync({ provider, model, apiKey: keyInput });
        setEditingKey(null);
        setKeyInput('');
    };

    const handleSetDefault = (provider: string, model: string) => {
        // Toggle default: if already default, do nothing or explain. 
        // Backend handles "setting this as default unsets others".
        setConfig.mutate({ provider, model, isDefault: true });
    };

    const handleRemoveKey = (provider: string, model: string) => {
        removeConfig.mutate({ provider, model });
    };

    if (modelsLoading || configsLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl h-[300px] flex flex-col justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Loading model settings...</p>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        AI Model Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage API keys and set your preferred default models.
                        Using your own key (BYOK) may bypass system credit limits.
                    </DialogDescription>
                </DialogHeader>

                {providers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 border rounded-md m-4 bg-muted/20 border-dashed">
                        <ShieldAlert className="h-10 w-10 mb-2 opacity-50" />
                        <p className="font-medium">No supported models found</p>
                        <p className="text-xs mt-1 text-center max-w-xs opacity-70">
                            The database appears to be empty. Please ensure the backend migrations have been run to populate supported models.
                        </p>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <div className="border-b px-4 shrink-0">
                            <TabsList className="bg-transparent border-b-0">
                                {providers.map(provider => (
                                    <TabsTrigger
                                        key={provider}
                                        value={provider}
                                        className="capitalize data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                                    >
                                        {provider}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-4 h-full">
                            {providers.map(provider => (
                                <TabsContent key={provider} value={provider} className="mt-0 space-y-4">
                                    {models?.filter(m => m.provider === provider).map(model => {
                                        const config = getConfig(model.provider, model.name);
                                        const isDefault = config?.is_default;
                                        const hasKey = config?.has_key;
                                        const isEditing = editingKey?.provider === model.provider && editingKey?.model === model.name;

                                        return (
                                            <div key={model.name} className={`p-4 rounded-lg border ${isDefault ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold">{model.name}</h4>
                                                            {isDefault && <Badge variant="default" className="text-[10px] h-5">Default</Badge>}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!isDefault && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSetDefault(model.provider, model.name)}
                                                                disabled={setConfig.isPending || !hasKey}
                                                                title={!hasKey ? "Add a key first to set as default" : "Set as default model"}
                                                            >
                                                                Make Default
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Key Management Area */}
                                                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {hasKey ? (
                                                            <>
                                                                <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-50 dark:bg-green-900/20 gap-1 pl-1 pr-2">
                                                                    <ShieldCheck className="h-3 w-3" />
                                                                    Custom Key Active
                                                                </Badge>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground flex items-center gap-1">
                                                                <Sparkles className="h-3 w-3" />
                                                                Using System Key (Credits Apply)
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                                                <Input
                                                                    placeholder="sk-..."
                                                                    className="h-8 w-48 text-xs font-mono"
                                                                    value={keyInput}
                                                                    onChange={(e) => setKeyInput(e.target.value)}
                                                                    type="password"
                                                                />
                                                                <Button size="sm" className="h-8" onClick={() => handleSaveKey(model.provider, model.name)} disabled={!keyInput.trim() || setConfig.isPending}>
                                                                    Save
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingKey(null)}>Cancel</Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => handleEditKey(model.provider, model.name)}>
                                                                    <Key className="h-3 w-3" />
                                                                    {hasKey ? 'Update Key' : 'Add Key'}
                                                                </Button>
                                                                {hasKey && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleRemoveKey(model.provider, model.name)}
                                                                        disabled={removeConfig.isPending}
                                                                        title="Remove Custom Key"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </TabsContent>
                            ))}
                        </ScrollArea>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
