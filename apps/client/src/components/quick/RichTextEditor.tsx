import React, { useEffect, useRef, useState } from 'react';
import {
    Bold,
    Underline as UnderlineIcon,
    Minus,
    Plus,
    Palette,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    actions?: React.ReactNode;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    actions
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Track active states for toolbar
    const [isBold, setIsBold] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [currentFont, setCurrentFont] = useState('Sans Serif');
    const [currentSize, setCurrentSize] = useState<number>(3); // 1-7

    // Sync internal ref content with external value prop
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            } else if (value === '' && editorRef.current.innerHTML !== '') {
                editorRef.current.innerHTML = '';
            }
        }
    }, [value]);

    const updateState = () => {
        setIsBold(document.queryCommandState('bold'));
        setIsUnderline(document.queryCommandState('underline'));

        const font = document.queryCommandValue('fontName');
        // Normalize font name for display
        if (font.includes('sans-serif') || font.includes('Arial')) setCurrentFont('Sans');
        else if (font.includes('serif') || font.includes('Times')) setCurrentFont('Serif');
        else if (font.includes('monospace') || font.includes('Courier')) setCurrentFont('Mono');
        else setCurrentFont('Sans');

        const size = document.queryCommandValue('fontSize');
        setCurrentSize(parseInt(size) || 3);

        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        updateState();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Enter'].includes(e.key)) {
            setTimeout(updateState, 0);
        }
    };

    const changeFontSize = (delta: number) => {
        const newSize = Math.min(7, Math.max(1, currentSize + delta));
        exec('fontSize', newSize.toString());
    };

    const fonts = [
        { name: 'Sans', value: 'Arial, Helvetica, sans-serif' },
        { name: 'Serif', value: '"Times New Roman", Times, serif' },
        { name: 'Mono', value: '"Courier New", Courier, monospace' },
    ];

    return (
        <div className={cn("flex flex-col border rounded-md overflow-hidden bg-background", className)}>
            <div
                ref={editorRef}
                className="flex-1 p-4 min-h-[150px] outline-none overflow-y-auto prose dark:prose-invert max-w-none text-foreground empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none"
                contentEditable
                onInput={updateState}
                onMouseUp={updateState}
                onKeyDown={handleKeyDown}
                onBlur={updateState}
                data-placeholder={placeholder}
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 flex-wrap text-muted-foreground border-t border-border/40 bg-muted/10">
                <ToolbarButton
                    isActive={isBold}
                    onClick={() => exec('bold')}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    isActive={isUnderline}
                    onClick={() => exec('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-4 bg-border/50 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal text-muted-foreground hover:text-foreground">
                            <span className="text-xs">{currentFont}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {fonts.map((f) => (
                            <DropdownMenuItem
                                key={f.name}
                                onClick={() => exec('fontName', f.value)}
                                className="text-sm"
                            >
                                <span style={{ fontFamily: f.value }}>{f.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center h-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-l-md text-muted-foreground hover:text-foreground"
                        onClick={() => changeFontSize(-1)}
                        disabled={currentSize <= 1}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-8 text-center text-xs tabular-nums text-muted-foreground">{currentSize}</div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-r-md text-muted-foreground hover:text-foreground"
                        onClick={() => changeFontSize(1)}
                        disabled={currentSize >= 7}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                <div className="w-px h-4 bg-border/50 mx-1" />

                <div className="relative">
                    <ToolbarButton
                        isActive={false}
                        onClick={() => colorInputRef.current?.click()}
                        title="Text Color"
                    >
                        <Palette className="h-4 w-4" />
                    </ToolbarButton>
                    <input
                        ref={colorInputRef}
                        type="color"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        onChange={(e) => exec('foreColor', e.target.value)}
                    />
                </div>

                {actions && (
                    <>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 pl-2 ml-1">
                            {actions}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

function ToolbarButton({
    isActive,
    onClick,
    children,
    title
}: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
                isActive && "bg-accent text-accent-foreground"
            )}
            title={title}
        >
            {children}
        </Button>
    );
}
