// Helper for relative time
function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

import { Chat } from '@/api/aiApi';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

interface ChatListProps {
    chats: Chat[];
    activeChatId: number | null;
    onSelectChat: (chatId: number) => void;
    onCreateChat: () => void;
    onDeleteChat: (chatId: number) => void;
}

export function ChatList({
    chats,
    activeChatId,
    onSelectChat,
    onCreateChat,
    onDeleteChat,
    className
}: ChatListProps & { className?: string }) {
    return (
        <div className={`flex flex-col h-full bg-workspace-panel ${className}`}>
            <div className="p-4 border-b border-workspace-border flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Chat History</h3>
                <Button variant="ghost" size="icon" onClick={onCreateChat}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {chats?.map((chat) => (
                        <div
                            key={chat.id}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${activeChatId === chat.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-workspace-hover text-muted-foreground hover:text-foreground'
                                }`}
                            onClick={() => onSelectChat(chat.id)}
                        >
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                <div className="flex flex-col truncate">
                                    <span className="truncate font-medium">{chat.title}</span>
                                    <span className="text-xs opacity-70">
                                        {getRelativeTime(chat.last_message_at)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                }}
                            >
                                <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    {chats?.length === 0 && (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                            No recent chats
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
