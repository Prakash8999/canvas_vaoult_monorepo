import React, { useState } from 'react';
import { EditorSkeleton, SearchResultsSkeleton, PanelSkeleton, NoteCreationSkeleton } from './EditorSkeleton';
import { Button } from '@/components/ui/button';

export function SkeletonDemo() {
  const [activeDemo, setActiveDemo] = useState<'full' | 'light' | 'search' | 'panel' | 'creation'>('full');

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Demo Controls */}
      <div className="p-4 bg-white border-b border-gray-200 flex gap-2">
        <Button
          variant={activeDemo === 'full' ? 'default' : 'outline'}
          onClick={() => setActiveDemo('full')}
        >
          Full Editor
        </Button>
        <Button
          variant={activeDemo === 'light' ? 'default' : 'outline'}
          onClick={() => setActiveDemo('light')}
        >
          Light Mode
        </Button>
        <Button
          variant={activeDemo === 'search' ? 'default' : 'outline'}
          onClick={() => setActiveDemo('search')}
        >
          Search Results
        </Button>
        <Button
          variant={activeDemo === 'panel' ? 'default' : 'outline'}
          onClick={() => setActiveDemo('panel')}
        >
          Panel
        </Button>
        <Button
          variant={activeDemo === 'creation' ? 'default' : 'outline'}
          onClick={() => setActiveDemo('creation')}
        >
          Note Creation
        </Button>
      </div>

      {/* Demo Content */}
      <div className="flex-1 relative">
        {activeDemo === 'full' && <EditorSkeleton mode="full" embedded={false} />}
        {activeDemo === 'light' && <EditorSkeleton mode="light" embedded={false} />}
        {activeDemo === 'search' && (
          <div className="p-4">
            <div className="relative max-w-md">
              <SearchResultsSkeleton />
            </div>
          </div>
        )}
        {activeDemo === 'panel' && <PanelSkeleton title="Test Panel" />}
        {activeDemo === 'creation' && <NoteCreationSkeleton />}
      </div>
    </div>
  );
}