import React from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, X } from 'lucide-react';

export function TagsPanel() {
  const { 
    getAllTags, 
    tagFilter, 
    setTagFilter, 
    notes, 
    setCurrentNote 
  } = useEnhancedNoteStore();
  
  const allTags = getAllTags();
  const filteredNotes = tagFilter 
    ? Object.values(notes).filter(note => note.tags.includes(tagFilter))
    : [];
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash size={16} />
          Tags ({allTags.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4">
            {/* Tag filter indicator */}
            {tagFilter && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Filtering by: #{tagFilter}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTagFilter(null)}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    <X size={12} />
                  </Button>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            
            {/* All tags list */}
            {!tagFilter && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  All Tags
                </h4>
                <div className="space-y-1">
                  {allTags.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      No tags found. Add #tag to your notes to see them here.
                    </div>
                  ) : (
                    allTags.map(tag => {
                      const taggedNotes = Object.values(notes).filter(note => 
                        note.tags.includes(tag)
                      );
                      
                      return (
                        <div
                          key={tag}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                          onClick={() => setTagFilter(tag)}
                        >
                          <div className="flex items-center gap-2">
                            <Hash size={12} className="text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium group-hover:text-blue-600">
                              {tag}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {taggedNotes.length}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
            {/* Filtered notes list */}
            {tagFilter && filteredNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Notes with #{tagFilter}
                </h4>
                <div className="space-y-2">
                  {filteredNotes.map(note => (
                    <div
                      key={note.id}
                      className="group cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                      onClick={() => {
                        setCurrentNote(note.id);
                        setTagFilter(null); // Clear filter when navigating to note
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                            {note.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{note.wordCount} words</span>
                            <span>
                              {new Date(note.modifiedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* All tags for this note */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map(noteTag => (
                          <Badge 
                            key={noteTag} 
                            variant={noteTag === tagFilter ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            #{noteTag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}