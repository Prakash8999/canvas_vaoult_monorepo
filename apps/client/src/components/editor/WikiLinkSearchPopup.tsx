import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Pin, Loader2 } from 'lucide-react';

interface SearchResult {
  id: number;
  title: string;
  content: any;
  tags: string[];
  note_uid: string;
  version: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface WikiLinkSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResult[];
  wikiLinkName: string;
  onNavigateToNote: (noteName: string, noteId?: string | null, noteUid?: string | null) => Promise<void>;
  onSelectExisting: (result: SearchResult) => void;
  position: { x: number; y: number };
}

export default function WikiLinkSearchPopup({
  isOpen,
  onClose,
  searchResults,
  wikiLinkName,
  onNavigateToNote,
  onSelectExisting,
  position
}: WikiLinkSearchPopupProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateNew = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      // Close popup immediately to show loading on button
      onClose();
      // Call the proper navigation handler from EnhancedEditorJS
      await onNavigateToNote(wikiLinkName, null, null);
    } catch (error) {
      console.error('Failed to create new note:', error);
      // The error will be handled by the parent component via toast
    } finally {
      // Reset loading state
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-80"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxHeight: '400px'
        }}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Wiki link "{wikiLinkName}" already exists
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose an existing note or create a new one
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectExisting(result)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                  {result.title}
                </h4>
                {result.pinned && (
                  <Pin size={12} className="text-blue-600 ml-2 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={10} />
                <span>Created {formatDate(result.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <Button 
            onClick={handleCreateNew}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create New Note Test'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}