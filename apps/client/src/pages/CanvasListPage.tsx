import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AiDrawer } from '@/components/ai/AiDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/stores/workspace';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Palette,
  Calendar,
  Brush,
  Layers as CanvasIcon,
  Pin,
  PinOff,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useCanvasList, useCreateCanvas, useDeleteCanvas, useUpdateCanvas } from '@/hooks/useCanvas';
import { Skeleton } from '@/components/ui/skeleton';

export default function CanvasListPage() {
  const navigate = useNavigate();
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinned, setFilterPinned] = useState<'all' | 'pinned'>('all');

  // Fetch canvases with filters
  const { data, isLoading, isError, error } = useCanvasList({
    search: searchQuery || undefined,
    isPinned: filterPinned === 'pinned' ? true : undefined,
  });

  // Mutations
  const createMutation = useCreateCanvas({
    onSuccess: (newCanvas) => {
      toast.success('Canvas created successfully');
      navigate(`/canvas/${newCanvas.canvas_uid}`);
    },
    onError: (error) => {
      toast.error(`Failed to create canvas: ${error.message}`);
    },
  });

  const deleteMutation = useDeleteCanvas({
    onSuccess: () => {
      toast.success('Canvas deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete canvas: ${error.message}`);
    },
  });

  const updateMutation = useUpdateCanvas({
    onSuccess: () => {
      toast.success('Canvas updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update canvas: ${error.message}`);
    },
  });

  const handleCreateCanvas = () => {
    createMutation.mutate({
      title: 'Untitled Canvas',
      pinned: false,
    });
  };

  const handleOpenCanvas = (canvasUid: string) => {
    navigate(`/canvas/${canvasUid}`);
  };

  const handleDeleteCanvas = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePin = (id: number, currentPinned: boolean) => {
    updateMutation.mutate({
      id,
      data: { pinned: !currentPinned },
    });
  };

  const getCanvasPreview = (canvasData: unknown) => {
    if (!canvasData) return 'Empty canvas';
    if (Array.isArray(canvasData)) {
      return `${canvasData.length} elements`;
    }
    // fallback: try to inspect elements
    if (typeof canvasData === 'object' && canvasData !== null && 'elements' in canvasData) {
      const elements = (canvasData as { elements?: unknown[] }).elements;
      if (Array.isArray(elements)) {
        return `${elements.length} elements`;
      }
    }
    return 'Empty canvas';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen bg-workspace-bg flex flex-col overflow-hidden w-full">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto" style={{ paddingRight: sidebarOpen ? undefined : 0 }}>
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-ai-gradient rounded-2xl flex items-center justify-center shadow-glow">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Canvas Gallery
                </h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create, organize, and manage your visual canvases. Draw, sketch, and bring your ideas to life.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search canvases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {filterPinned === 'all' ? 'All' : 'Pinned'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterPinned('all')}>
                      All Canvases
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterPinned('pinned')}>
                      Pinned Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleCreateCanvas}
                  disabled={createMutation.isPending}
                  className="gap-2 bg-ai-gradient hover:opacity-90 transition-opacity"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  New Canvas
                </Button>
              </div>
            </div>

            {/* Canvas Grid */}
            <ScrollArea className="h-[calc(100vh-20rem)]">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                    <Trash2 className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Failed to load canvases</h3>
                  <p className="text-muted-foreground mb-4">{error?.message || 'An error occurred'}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : !data?.canvases.length ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <CanvasIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No canvases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'No canvases match your search'
                      : 'Create your first canvas to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreateCanvas} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Canvas
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.canvases.map((canvas) => (
                    <Card
                      key={canvas.id}
                      className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border bg-card"
                      onClick={() => handleOpenCanvas(canvas.canvas_uid)}
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {canvas.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            {canvas.pinned && (
                              <Badge variant="secondary" className="gap-1">
                                <Pin className="h-3 w-3" />
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePin(canvas.id, canvas.pinned);
                                  }}
                                >
                                  {canvas.pinned ? (
                                    <>
                                      <PinOff className="h-4 w-4 mr-2" />
                                      Unpin
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="h-4 w-4 mr-2" />
                                      Pin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCanvas(canvas.id, canvas.title);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Brush className="h-4 w-4" />
                          <span>{getCanvasPreview(canvas.canvas_data)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Modified {formatDate(canvas.updated_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </main>
      </div>
      <AiDrawer />
    </div>
  );
}