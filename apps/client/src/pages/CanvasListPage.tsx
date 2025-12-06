import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinned, setFilterPinned] = useState<'all' | 'pinned'>('all');

  // Get initial page from URL (1-based) and convert to 0-based for state
  const getInitialPageIndex = () => {
    const pageParam = searchParams.get('page');
    const pageNum = pageParam ? parseInt(pageParam, 10) : 1;
    return Math.max(0, pageNum - 1); // Convert to 0-based
  };

  // Pagination state
  const [pageIndex, setPageIndex] = useState(getInitialPageIndex);
  const pageSize = 10;
  const isUpdatingUrlRef = useRef(false);

  // Set default page=1 in URL if no page parameter exists
  useEffect(() => {
    if (!searchParams.get('page')) {
      isUpdatingUrlRef.current = true;
      setSearchParams({ page: '1' }, { replace: true });
      setTimeout(() => { isUpdatingUrlRef.current = false; }, 0);
    }
  }, [searchParams, setSearchParams]);

  // Update URL when pageIndex changes
  useEffect(() => {
    if (isUpdatingUrlRef.current) return;

    const currentPageParam = searchParams.get('page');
    const expectedPageNum = (pageIndex + 1).toString();

    if (currentPageParam !== expectedPageNum) {
      isUpdatingUrlRef.current = true;
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', expectedPageNum);
        return newParams;
      }, { replace: true });
      setTimeout(() => { isUpdatingUrlRef.current = false; }, 0);
    }
  }, [pageIndex, searchParams, setSearchParams]);

  // Handle external URL changes
  useEffect(() => {
    if (isUpdatingUrlRef.current) return;

    const urlPageNum = searchParams.get('page');
    if (urlPageNum) {
      const urlPageIndex = Math.max(0, parseInt(urlPageNum, 10) - 1);
      if (urlPageIndex !== pageIndex) {
        setPageIndex(urlPageIndex);
      }
    }
  }, [searchParams, pageIndex]);

  // Custom page setter that updates both state and URL
  const setPageIndexWithUrl = (newPageIndex: number | ((prev: number) => number)) => {
    const resolvedPageIndex = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    setPageIndex(resolvedPageIndex);
  };

  // Fetch canvases with filters
  const { data, isLoading, isError, error } = useCanvasList({
    search: searchQuery || undefined,
    pinned: filterPinned === 'pinned' ? true : undefined,
    page: pageIndex + 1,
    limit: pageSize,
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    // If greater than 24 hours, show date and time
    return date.toLocaleString();
  };

  // Calculate pinned count for badge
  const pinnedCount = data?.canvases.filter(c => c.pinned).length || 0;

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
                <h1 className="text-4xl font-bold text-foreground">
                  Canvas Gallery
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create, organize, and manage your visual canvases. Draw, sketch, and bring your ideas to life.
              </p>

              <div className="flex items-center justify-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {data?.pagination.total || 0} notes
                </Badge>
                {pinnedCount > 0 && (
                  <Badge variant="outline" className="text-sm">
                    <Pin size={12} className="mr-1" />
                    {pinnedCount} pinned
                  </Badge>
                )}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative max-w-md w-full">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search canvases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-workspace-panel border-workspace-border"
                />
              </div>

              <Button
                variant={filterPinned === 'pinned' ? "default" : "outline"}
                onClick={() => setFilterPinned(filterPinned === 'pinned' ? 'all' : 'pinned')}
                className="flex items-center gap-2 border-workspace-border hover:bg-workspace-hover"
              >
                <Filter size={16} />
                Pinned Only
              </Button>
            </div>

            {/* Create New Canvas Card */}
            <Card
              className={`border-2 border-dashed border-workspace-border transition-all group bg-workspace-panel glow-hover ${createMutation.isPending
                ? "opacity-50 pointer-events-none"
                : "hover:border-primary/40 cursor-pointer"
                }`}
              onClick={!createMutation.isPending ? handleCreateCanvas : undefined}
            >
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-ai-gradient rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-glow">
                    {createMutation.isPending ? (
                      <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                      <Plus size={28} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {createMutation.isPending ? 'Creating...' : 'Create New Canvas'}
                    </h3>
                    <p className="text-muted-foreground">
                      Start visualizing your ideas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas Grid */}
            <div className="flex-1 overflow-hidden">
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
                  {/* Empty state handled, but we really just want to show nothing or a specific empty message if no results found via search */}
                  {searchQuery ? (
                    <div className="text-muted-foreground">No canvases match your search</div>
                  ) : (
                    // If no canvases exist at all, the Create Card above is the primary call to action, so we can just show nothing here or a small helper text
                    <div className="text-muted-foreground text-sm">No canvases created yet. Create one above!</div>
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

              {/* Pagination Controls */}
              {data && data.pagination.totalPages > 0 && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPageIndexWithUrl((p) => Math.max(0, p - 1))}
                      disabled={pageIndex === 0}
                      variant="outline"
                      className="border-border hover:bg-accent"
                    >
                      Prev
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: data.pagination.totalPages }).map((_, idx) => (
                        <Button
                          key={idx}
                          onClick={() => setPageIndexWithUrl(idx)}
                          variant={idx === pageIndex ? 'default' : 'outline'}
                          className={`h-8 w-8 p-0 ${idx === pageIndex ? 'bg-primary text-white' : ''}`}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setPageIndexWithUrl((p) => p + 1)}
                      disabled={pageIndex >= data.pagination.totalPages - 1}
                      variant="outline"
                      className="border-border hover:bg-accent"
                    >
                      Next
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {data.canvases.length} canvases
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <AiDrawer />
    </div>
  );
}