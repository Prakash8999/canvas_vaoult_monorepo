import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvasDocumentStore } from '@/stores/canvasDocument';
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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function CanvasListPage() {
  const navigate = useNavigate();
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);

  const {
    canvases,
    createCanvas,
    deleteCanvas,
    updateCanvas
  } = useCanvasDocumentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinned, setFilterPinned] = useState<'all' | 'pinned'>('all');

  const allCanvases = Object.values(canvases).sort((a, b) => b.modifiedAt - a.modifiedAt);

  // Filter canvases based on search query and pinned filter
  const filteredCanvases = allCanvases
    .filter(canvas => filterPinned === 'all' ? true : !!canvas.pinned)
    .filter(canvas => canvas.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateCanvas = () => {
    const canvasId = createCanvas('Untitled Canvas');
    navigate(`/canvas/${canvasId}`);
  };

  const handleOpenCanvas = (canvasId: string) => {
    navigate(`/canvas/${canvasId}`);
  };

  const handleDeleteCanvas = (canvasId: string, canvasName: string) => {
    if (window.confirm(`Are you sure you want to delete "${canvasName}"?`)) {
      deleteCanvas(canvasId);
      toast.success('Canvas deleted successfully');
    }
  };

  const handleRenameCanvas = (canvasId: string, newName: string) => {
    updateCanvas(canvasId, { name: newName });
    toast.success('Canvas renamed successfully');
  };

  const getCanvasPreview = (canvasData: any) => {
    if (!canvasData) return 'Empty canvas';
    if (Array.isArray(canvasData)) {
      return `${canvasData.length} elements`;
    }
    // fallback: try to inspect elements
    if (canvasData.elements && Array.isArray(canvasData.elements)) {
      return `${canvasData.elements.length} elements`;
    }
    return 'Empty canvas';
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
                <h1 className="text-4xl font-bold text-foreground">
                  Your Canvases
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create and manage your visual workspaces
              </p>

              <div className="flex items-center justify-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {filteredCanvases.length} canvases
                </Badge>
                <Button
                  onClick={handleCreateCanvas}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus size={16} className="mr-2" />
                  New Canvas
                </Button>
              </div>
            </div>

            {/* Search Bar */}
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
              {/* Pinned toggle (single button toggles between all and pinned) */}
              <div className="flex items-center gap-2">
                <Button
                  variant={filterPinned === 'pinned' ? 'default' : 'outline'}
                  onClick={() => setFilterPinned(prev => prev === 'pinned' ? 'all' : 'pinned')}
                  className="flex items-center gap-2 border-workspace-border hover:bg-workspace-hover"
                  title={filterPinned === 'pinned' ? 'Showing pinned canvases. Click to show all.' : 'Show only pinned canvases'}
                >
                  <Filter size={16} />
                  Pinned Only
                </Button>
              </div>
            </div>

            {/* Create New Canvas Card */}
            <Card
              className="border-2 border-dashed border-workspace-border hover:border-primary/40 transition-all cursor-pointer group bg-workspace-panel glow-hover"
              onClick={handleCreateCanvas}
            >
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-ai-gradient rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-glow">
                    <Plus size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      Create New Canvas
                    </h3>
                    <p className="text-muted-foreground">
                      Start creating your visual workspace
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvases Grid */}
            <div className="flex-1 overflow-hidden">
              {filteredCanvases.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Card className="bg-workspace-panel border-workspace-border p-8">
                    <div className="text-center text-muted-foreground">
                      <CanvasIcon size={64} className="mx-auto mb-6 opacity-30" />
                      <div className="text-xl font-medium mb-2 text-foreground">
                        {searchQuery ? 'No canvases found' : 'No canvases yet'}
                      </div>
                      <div className="text-sm">
                        {searchQuery
                          ? 'Try adjusting your search terms'
                          : 'Create your first canvas to get started'
                        }
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {filteredCanvases.map((canvas) => (
                      <Card
                        key={canvas.id}
                        className="group bg-workspace-panel border-workspace-border hover:border-primary/40 transition-all cursor-pointer glow-hover"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => handleOpenCanvas(canvas.id)}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <Brush size={16} className="text-primary flex-shrink-0" />
                                {/* Show pin icon like notes when pinned */}
                                {canvas.pinned && (
                                  <Pin size={14} className="text-warning flex-shrink-0" />
                                )}
                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-lg">
                                  {canvas.name}
                                </h3>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {new Date(canvas.modifiedAt).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Canvas Preview - show element count or summary */}
                              <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-3 p-3">
                                <div className="text-sm text-muted-foreground">{getCanvasPreview(canvas.canvasData)}</div>
                              </div>
                            </div>

                            {/* Three dots menu */}
                            <div className="flex items-center gap-2">
                              {/* Quick pin/unpin button (visible on hover) */}
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCanvas(canvas.id, { pinned: !canvas.pinned }); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-workspace-hover rounded"
                                title={canvas.pinned ? 'Unpin canvas' : 'Pin canvas'}
                              >
                                <Pin className={`h-4 w-4 ${canvas.pinned ? 'text-warning' : 'text-gray-400'}`} />
                              </button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-workspace-hover"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-workspace-panel border-workspace-border">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenCanvas(canvas.id)}
                                    className="flex items-center gap-2 hover:bg-workspace-hover"
                                  >
                                    <Palette size={14} />
                                    Open
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => updateCanvas(canvas.id, { pinned: !canvas.pinned })}
                                    className="flex items-center gap-2 hover:bg-workspace-hover"
                                  >
                                    {canvas.pinned ? (
                                      <>
                                        <PinOff size={14} className="text-gray-400" />
                                        Unpin
                                      </>
                                    ) : (
                                      <>
                                        <Pin size={14} className="text-warning" />
                                        Pin
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newName = prompt('Enter new name:', canvas.name);
                                      if (newName && newName !== canvas.name) {
                                        handleRenameCanvas(canvas.id, newName);
                                      }
                                    }}
                                    className="flex items-center gap-2 hover:bg-workspace-hover"
                                  >
                                    <Brush size={14} />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCanvas(canvas.id, canvas.name)}
                                    className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </main>
      </div>
      <AiDrawer />
    </div>
  );
}