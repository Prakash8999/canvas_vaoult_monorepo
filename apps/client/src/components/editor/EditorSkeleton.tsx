import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface EditorSkeletonProps {
  mode?: 'full' | 'light';
  embedded?: boolean;
}

// Enhanced shimmer effect
const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${className} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded-md`} />
);

// Add shimmer keyframe animation to global styles if needed
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

export function EditorSkeleton({ mode = 'full', embedded = false }: EditorSkeletonProps) {
  if (mode === 'light') {
    return (
      <div className="w-full h-full max-w-none bg-white rounded-none shadow-none p-6 border border-none">
        {/* Simple title skeleton */}
        <div className="mb-4">
          <div className="h-8 skeleton-shimmer w-64 mb-2"></div>
        </div>

        <div className="w-full max-w-2xl mx-auto space-y-4">
          {/* Editor content skeleton */}
          <div className="h-4 skeleton-shimmer w-full skeleton-stagger-1"></div>
          <div className="h-4 skeleton-shimmer w-3/4 skeleton-stagger-2"></div>
          <div className="h-4 skeleton-shimmer w-5/6 skeleton-stagger-3"></div>
          <div className="space-y-2 mt-4">
            <div className="h-3 skeleton-shimmer w-full skeleton-stagger-4"></div>
            <div className="h-3 skeleton-shimmer w-2/3 skeleton-stagger-5"></div>
          </div>
          {/* Additional content blocks */}
          <div className="space-y-2 mt-6">
            <div className="h-20 skeleton-shimmer w-full skeleton-stagger-6"></div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-3 skeleton-shimmer w-full skeleton-stagger-1"></div>
            <div className="h-3 skeleton-shimmer w-4/5 skeleton-stagger-2"></div>
            <div className="h-3 skeleton-shimmer w-3/4 skeleton-stagger-3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Notes list toggle skeleton */}
          <div className="h-8 skeleton-shimmer w-28 flex items-center px-3 skeleton-stagger-1">
            <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
            <div className="h-3 bg-gray-300 rounded flex-1"></div>
          </div>
          
          {/* Search skeleton */}
          <div className="h-8 skeleton-shimmer w-64 flex items-center px-3 skeleton-stagger-2">
            <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
            <div className="h-3 bg-gray-300 rounded flex-1"></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Panel toggles skeleton */}
          <div className="h-8 w-8 skeleton-shimmer skeleton-stagger-3"></div>
          <div className="h-8 w-8 skeleton-shimmer skeleton-stagger-4"></div>
          <div className="h-8 w-8 skeleton-shimmer skeleton-stagger-5"></div>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          {/* Action buttons skeleton */}
          <div className="h-8 w-8 skeleton-shimmer skeleton-stagger-6"></div>
          <div className="h-8 w-24 skeleton-shimmer skeleton-stagger-1"></div>
          <div className="h-8 w-20 skeleton-shimmer skeleton-stagger-2"></div>
          <div className="h-8 w-16 skeleton-shimmer skeleton-stagger-3"></div>
        </div>
      </div>

      {/* Main Editor Area Skeleton */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full space-y-6">
          {/* Title area skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 skeleton-shimmer w-80 skeleton-stagger-1"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 skeleton-shimmer w-24 skeleton-stagger-2"></div>
              <div className="h-4 skeleton-shimmer w-20 skeleton-stagger-3"></div>
              <div className="flex gap-1">
                <div className="h-6 w-12 skeleton-shimmer rounded-full skeleton-stagger-4"></div>
                <div className="h-6 w-16 skeleton-shimmer rounded-full skeleton-stagger-5"></div>
              </div>
            </div>
          </div>

          {/* Content skeleton - Simulating EditorJS blocks */}
          <div className="space-y-6">
            {/* Paragraph block */}
            <div className="space-y-2">
              <div className="h-4 skeleton-shimmer w-full skeleton-stagger-1"></div>
              <div className="h-4 skeleton-shimmer w-5/6 skeleton-stagger-2"></div>
              <div className="h-4 skeleton-shimmer w-4/5 skeleton-stagger-3"></div>
            </div>

            {/* Header block */}
            <div className="space-y-3 mt-8">
              <div className="h-6 skeleton-shimmer w-48 skeleton-stagger-4"></div>
            </div>

            {/* List block */}
            <div className="space-y-2 ml-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-3 skeleton-shimmer w-3/4 skeleton-stagger-5"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-3 skeleton-shimmer w-2/3 skeleton-stagger-6"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-3 skeleton-shimmer w-5/6 skeleton-stagger-1"></div>
              </div>
            </div>

            {/* Code block */}
            <div className="space-y-3 mt-8">
              <div className="h-24 skeleton-shimmer rounded-lg p-4 skeleton-stagger-2">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                </div>
              </div>
            </div>

            {/* More paragraph blocks */}
            <div className="space-y-2 mt-8">
              <div className="h-4 skeleton-shimmer w-full skeleton-stagger-3"></div>
              <div className="h-4 skeleton-shimmer w-2/3 skeleton-stagger-4"></div>
              <div className="h-4 skeleton-shimmer w-4/5 skeleton-stagger-5"></div>
            </div>

            {/* Image placeholder */}
            <div className="mt-8">
              <div className="h-48 skeleton-shimmer rounded-lg flex items-center justify-center skeleton-stagger-6">
                <div className="text-gray-400 text-sm font-medium">Loading content...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            {/* Title and pin */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Tags */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-4 w-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Loading message */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin w-4 h-4 border border-gray-300 border-t-blue-500 rounded-full"></div>
          <div className="text-gray-600 text-sm font-medium">Searching notes...</div>
        </div>
      </div>
    </div>
  );
}

export function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="h-full animate-pulse">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4 ml-5"></div>
            {index % 2 === 0 && (
              <div className="flex gap-1 ml-5">
                <div className="h-4 w-10 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
              </div>
            )}
          </div>
        ))}

        {/* Empty state placeholder */}
        <div className="text-center py-8">
          <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for when a note is being created
export function NoteCreationSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full mx-auto mb-4"></div>
        <div className="text-lg font-medium text-foreground mb-2">Creating your note...</div>
        <div className="text-sm text-muted-foreground">Just a moment while we set things up</div>
      </div>
    </div>
  );
}