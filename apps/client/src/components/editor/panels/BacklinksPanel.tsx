import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link, Calendar, Hash } from 'lucide-react';

interface BacklinksPanelProps {
  noteId: string;
}

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const navigate = useNavigate();
  const { getBacklinks, getBacklinksWithDOM, setCurrentNote, notes } = useEnhancedNoteStore();
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Force refresh backlinks when notes change or noteId changes
  React.useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [notes, noteId]);
  
  // Get backlinks - force re-computation with refreshKey
  const backlinks = React.useMemo(() => {
    return getBacklinksWithDOM(noteId);
  }, [getBacklinksWithDOM, noteId, refreshKey]);
  
  if (backlinks.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link size={16} />
            Backlinks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-8">
            No notes link to this one yet
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link size={16} />
          Backlinks ({backlinks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="p-4 space-y-3">
            {backlinks.map(note => (
              <div
                key={note.id}
                className="group cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                onClick={() => navigate(`/note/${note.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                      {note.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(note.modifiedAt).toLocaleDateString()}
                      </span>
                      <span>{note.wordCount} words</span>
                    </div>
                  </div>
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Preview of content that contains the link */}
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {getPreviewWithLink(note, notes[noteId]?.name || '')}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper function to find and preview content that contains the link
function getPreviewWithLink(note: any, targetNoteName: string): string {
  if (!note.content?.blocks) return 'No preview available';
  
  for (const block of note.content.blocks) {
    if (block.data?.text) {
      const text = block.data.text;
      
      // Check for plain [[]] syntax
      if (text.includes(`[[${targetNoteName}]]`)) {
        const cleanText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const linkIndex = cleanText.indexOf(`[[${targetNoteName}]]`);
        
        if (linkIndex !== -1) {
          // Get context around the link
          const start = Math.max(0, linkIndex - 50);
          const end = Math.min(cleanText.length, linkIndex + targetNoteName.length + 4 + 50);
          let preview = cleanText.slice(start, end);
          
          if (start > 0) preview = '...' + preview;
          if (end < cleanText.length) preview = preview + '...';
          
          // Highlight the link
          preview = preview.replace(`[[${targetNoteName}]]`, `**[[${targetNoteName}]]**`);
          
          return preview;
        }
      }
      
      // Check for HTML wiki-link elements
      const wikiLinkRegex = new RegExp(`<wiki-link[^>]*data-note-name="${targetNoteName}"[^>]*>.*?</wiki-link>`, 'i');
      if (wikiLinkRegex.test(text)) {
        const htmlCleanText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const linkText = `[[${targetNoteName}]]`;
        const linkIndex = htmlCleanText.indexOf(linkText);
        
        if (linkIndex !== -1) {
          // Get context around the link
          const start = Math.max(0, linkIndex - 50);
          const end = Math.min(htmlCleanText.length, linkIndex + linkText.length + 50);
          let preview = htmlCleanText.slice(start, end);
          
          if (start > 0) preview = '...' + preview;
          if (end < htmlCleanText.length) preview = preview + '...';
          
          // Highlight the link
          preview = preview.replace(linkText, `**${linkText}**`);
          
          return preview;
        }
        
        // Fallback: just show some context
        const fallbackCleanText = text.replace(/<[^>]*>/g, '');
        return fallbackCleanText.slice(0, 100) + (fallbackCleanText.length > 100 ? '...' : '');
      }
    }
  }
  
  return 'Link reference found';
}