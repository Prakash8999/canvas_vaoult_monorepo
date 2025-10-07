import React, { useState, useEffect } from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, RefreshCw } from 'lucide-react';

interface WikiLinkDebugPanelProps {
  noteId?: string;
}

interface WikiLinkInfo {
  element: Element;
  noteName: string;
  noteId: string;
  hasValidId: boolean;
}

export function WikiLinkDebugPanel({ noteId }: WikiLinkDebugPanelProps) {
  const { notes } = useEnhancedNoteStore();
  const [wikiLinks, setWikiLinks] = useState<WikiLinkInfo[]>([]);
  
  const refreshWikiLinks = () => {
    const linkElements = document.querySelectorAll('wiki-link[data-note-name]');
    const linkInfos: WikiLinkInfo[] = [];
    
    linkElements.forEach(element => {
      const noteName = element.getAttribute('data-note-name') || '';
      const linkNoteId = element.getAttribute('data-note-id') || '';
      const hasValidId = linkNoteId && notes[linkNoteId] ? true : false;
      
      linkInfos.push({
        element,
        noteName,
        noteId: linkNoteId,
        hasValidId
      });
    });
    
    setWikiLinks(linkInfos);
  };
  
  const updateAllWikiLinkIds = () => {
    const linkElements = document.querySelectorAll('wiki-link[data-note-name]');
    
    linkElements.forEach(element => {
      const noteName = element.getAttribute('data-note-name');
      const existingNoteId = element.getAttribute('data-note-id');
      
      if (noteName && (!existingNoteId || existingNoteId.trim() === '' || !notes[existingNoteId])) {
        const existingNote = Object.values(notes).find(note => note.name === noteName);
        if (existingNote) {
          element.setAttribute('data-note-id', existingNote.id);
          console.log(`[Debug] Updated ${noteName} with ID ${existingNote.id}`);
        }
      }
    });
    
    refreshWikiLinks();
  };
  
  useEffect(() => {
    refreshWikiLinks();
    
    // Set up observer to refresh when DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(refreshWikiLinks, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-note-id', 'data-note-name']
    });
    
    return () => observer.disconnect();
  }, [notes]);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug size={16} />
          WikiLink Debug ({wikiLinks.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refreshWikiLinks}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button size="sm" onClick={updateAllWikiLinkIds}>
            Update IDs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="p-4 space-y-3">
            {wikiLinks.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No WikiLinks found in the current editor
              </div>
            ) : (
              wikiLinks.map((link, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    link.hasValidId 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="font-medium text-sm">
                    [[{link.noteName}]]
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Note ID: {link.noteId || 'None'}</div>
                    <div>Valid: {link.hasValidId ? '✅' : '❌'}</div>
                    {!link.hasValidId && (
                      <div className="text-red-600">
                        {link.noteId ? 'Invalid ID' : 'No ID set'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}