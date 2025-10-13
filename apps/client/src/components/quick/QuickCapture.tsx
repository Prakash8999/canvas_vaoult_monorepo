import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaceStore } from '@/stores/workspace';
import { useNoteMutations } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import { Mic, Image, Pin } from 'lucide-react';

export default function QuickCapture() {
  const quickOpen = useWorkspaceStore((s) => s.quickCaptureOpen);
  const toggleQuick = useWorkspaceStore((s) => s.toggleQuickCapture);
  const { createNote, updateNote } = useNoteMutations();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (quickOpen) {
      setTimeout(() => titleRef.current?.focus(), 50);
    } else {
      // clear temporary state when closed
      setTitle('');
      setContent('');
      setPinned(false);
      setSaving(false);
    }
  }, [quickOpen]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const apiNote = await createNote({
        name: title || 'Quick Note',
        content: {
          blocks: [
            {
              type: 'paragraph',
              data: { text: content || '' },
            },
          ],
          version: '2.28.2',
        }
      });
      
      const localNote = convertApiNoteToLocal(apiNote);
      
      if (pinned) {
        // Update the note to be pinned
        await updateNote({
          id: localNote.id,
          updates: { isPinned: 1 }
        });
      }
    } catch (error) {
      console.error('Failed to save quick note:', error);
    }

    setSaving(false);
    toggleQuick();
  };

  const handleDiscard = () => {
    toggleQuick();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now attach a placeholder text to content. Real upload handled later.
    setContent((c) => c + `\n[Image attached: ${file.name}]`);
    // clear selection
    e.currentTarget.value = '';
  };

  return (
    <Dialog open={quickOpen} onOpenChange={() => toggleQuick()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick Capture</DialogTitle>
          <DialogDescription>
            Capture a quick note. Saved to Notes and available in the sidebar.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            ref={titleRef}
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3"
          />

          <Textarea
            placeholder="Write something quick..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-28 resize-none"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`inline-flex items-center px-2 py-1 rounded-md text-sm border ${pinned ? 'bg-accent text-accent-foreground' : 'bg-transparent'}`}
                aria-pressed={pinned}
                title="Pin"
              >
                <Pin className="mr-1 h-4 w-4" />
                <span className="sr-only">Pin</span>
              </button>

              <button type="button" onClick={() => { /* placeholder for voice */ }} className="inline-flex items-center px-2 py-1 rounded-md text-sm border">
                <Mic className="mr-1 h-4 w-4" />
                Voice
              </button>

              <button type="button" onClick={handleImageClick} className="inline-flex items-center px-2 py-1 rounded-md text-sm border">
                <Image className="mr-1 h-4 w-4" />
                Image
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>

            <div className="text-sm text-muted-foreground">{new Date().toLocaleString()}</div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex w-full justify-end space-x-2">
            <Button variant="ghost" onClick={handleDiscard}>Discard</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save to Notes'}</Button>
          </div>
        </DialogFooter>

        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
