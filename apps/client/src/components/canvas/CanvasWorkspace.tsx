import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Brush, 
  LayoutGrid, 
  Sparkles, 
  Share, 
  MoreHorizontal,
  Command,
  Settings,
  Download,
  Upload,
  Users,
  Wifi,
  Grid3X3,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawCanvas } from './ExcalidrawCanvas';
import { EraserToolbar } from './EraserToolbar';
import { EraserCommandPalette } from './EraserCommandPalette';
// import { EraserStatusBar } from './EraserStatusBar';
import { EraserPropertiesPanel } from './EraserPropertiesPanel';
import { EraserHeader } from './EraserHeader';
import { EnhancedEditorJS } from '@/components/editor/EnhancedEditorJS';
import { useWorkspaceStore } from '@/stores/workspace';

// Custom Canvas Components
import { CanvasArea } from './custom/CanvasArea';
import { ToolbarVertical } from './custom/ToolbarVertical';
import { CanvasTopbar } from './custom/CanvasTopbar';
import { RightPanel } from './custom/RightPanel';
import { StatusBar } from './custom/StatusBar';
import { ExportModal } from './custom/ExportModal';
import Canvas from './Canvas';

type CanvasSection = 'document' | 'both' | 'canvas';
// type Tool = 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text' | 'image' | 'eraser' | 'hand';

export function CanvasWorkspace() {
  const [activeSection, setActiveSection] = useState<CanvasSection>('canvas');
  // const [activeTool, setActiveTool] = useState<Tool>('select');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [elementCount, setElementCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const { toggleAiDrawer } = useWorkspaceStore();

  // Custom Canvas State
  const [shapes, setShapes] = useState<any[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Mock collaborators data
  const collaborators = [
    { id: '1', name: 'John Doe', color: '#3B82F6', isActive: true },
    { id: '2', name: 'Jane Smith', color: '#EF4444', isActive: false },
    { id: '3', name: 'Mike Johnson', color: '#22C55E', isActive: true },
  ];

  const sections = [
    { key: 'document', label: 'Document', icon: FileText },
    { key: 'both', label: 'Both', icon: LayoutGrid },
    { key: 'canvas', label: 'Canvas', icon: Brush },
  ] as const;

  // Keyboard shortcuts
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Command Palette
  //     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
  //       e.preventDefault();
  //       setIsCommandPaletteOpen(true);
  //     }
      
  //     // Tool shortcuts
  //     if (!e.metaKey && !e.ctrlKey && !e.altKey) {
  //       switch (e.key.toLowerCase()) {
  //         case 'v':
  //           setActiveTool('select');
  //           break;
  //         case 'r':
  //           setActiveTool('rectangle');
  //           break;
  //         case 'o':
  //           setActiveTool('ellipse');
  //           break;
  //         case 'd':
  //           setActiveTool('diamond');
  //           break;
  //         case 'a':
  //           setActiveTool('arrow');
  //           break;
  //         case 'l':
  //           setActiveTool('line');
  //           break;
  //         case 'p':
  //           setActiveTool('freedraw');
  //           break;
  //         case 't':
  //           setActiveTool('text');
  //           break;
  //         case 'i':
  //           setActiveTool('image');
  //           break;
  //         case 'e':
  //           setActiveTool('eraser');
  //           break;
  //         case 'h':
  //           setActiveTool('hand');
  //           break;
  //       }
  //     }

  //     // Toggle properties panel
  //     if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
  //       e.preventDefault();
  //       setIsPropertiesPanelOpen(!isPropertiesPanelOpen);
  //     }

  //     // Toggle grid
  //     if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
  //       e.preventDefault();
  //       setIsGridVisible(!isGridVisible);
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [isPropertiesPanelOpen, isGridVisible]);

  const handleCanvasChange = useCallback((elements: readonly any[], appState: any) => {
    // Only update if elements actually changed to prevent infinite loops
    if (elements && Array.isArray(elements)) {
      setElementCount(elements.length);
      const selected = elements.filter(el => el?.isSelected === true);
      setSelectedElements(selected);
    }
    
    if (appState?.zoom?.value && appState.zoom.value !== zoomLevel) {
      setZoomLevel(appState.zoom.value);
    }
  }, [zoomLevel]);

  // const handleToolChange = useCallback((tool: Tool) => {
  //   setActiveTool(tool);
  // }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const handleUndo = useCallback(() => {
    // Implementation would depend on canvas API
    console.log('Undo');
  }, []);

  const handleRedo = useCallback(() => {
    // Implementation would depend on canvas API
    console.log('Redo');
  }, []);

  const handleCopy = useCallback(() => {
    console.log('Copy');
  }, []);

  const handleDelete = useCallback(() => {
    console.log('Delete');
  }, []);

  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case 'new':
        console.log('New document');
        break;
      case 'save':
        setLastSaved(new Date());
        break;
      case 'export-png':
        console.log('Export PNG');
        break;
      case 'share':
        console.log('Share document');
        break;
      case 'toggle-grid':
        setIsGridVisible(!isGridVisible);
        break;
      case 'zoom-in':
        handleZoomIn();
        break;
      case 'zoom-out':
        handleZoomOut();
        break;
      default:
        console.log('Action:', action);
    }
  }, [isGridVisible, handleZoomIn, handleZoomOut]);

  const handleUpdateElement = useCallback((elementId: string, properties: any) => {
    console.log('Update element:', elementId, properties);
    // Implementation would update the canvas element
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'document':
        return (
          <div className="h-full w-full bg-white rounded-2xl shadow-lg p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto">
              <EnhancedEditorJS placeholder="Start writing your document..." mode="light" />
            </div>
          </div>
        );
      case 'canvas':
        return (
          <div className="h-full w-full bg-gray-50 relative overflow-hidden">
            {/* <CanvasArea
              tool={activeTool}
              showGrid={isGridVisible}
              zoom={zoomLevel}
              onZoomChange={setZoomLevel}
              onMousePosition={(x, y) => setMousePosition({ x, y })}
              shapes={shapes}
              onShapesChange={setShapes}
              selectedShapeIds={selectedShapeIds}
              onSelectionChange={setSelectedShapeIds}
            />
            
            <ToolbarVertical
              activeTool={activeTool}
              onToolChange={(tool) => setActiveTool(tool as Tool)}
            />
            
            <CanvasTopbar
              onUndo={() => {
                if (historyIndex > 0) {
                  setHistoryIndex(historyIndex - 1);
                  setShapes(history[historyIndex - 1]);
                }
              }}
              onRedo={() => {
                if (historyIndex < history.length - 1) {
                  setHistoryIndex(historyIndex + 1);
                  setShapes(history[historyIndex + 1]);
                }
              }}
              zoom={zoomLevel}
              onZoomChange={setZoomLevel}
              onZoomToFit={() => setZoomLevel(1)}
              onExport={(format) => setIsExportModalOpen(true)}
              onShare={() => console.log('Share')}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
            />
            
            <StatusBar
              zoom={zoomLevel}
              mousePosition={mousePosition}
              collaborators={collaborators}
              selectedTool={activeTool}
              onZoomChange={setZoomLevel}
            /> */}


            <Canvas />
          </div>
        );
      case 'both':
      default:
        return (
          <div className="h-full w-full flex bg-gray-100 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* Document Section */}
            <div className="flex-1 bg-white flex flex-col justify-center items-center p-6 border-r border-gray-200 min-w-[350px]">
              <div className="w-full max-w-xl">
                <EnhancedEditorJS placeholder="Start writing your document..." mode="light" />
              </div>
            </div>
            {/* Divider */}
            <div className="w-[2px] bg-gray-100" />
            {/* Canvas Section */}
            <div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-4 min-w-[350px] relative">
              <div className="w-full h-[500px] max-w-3xl">
                {/* <ExcalidrawCanvas 
                  height="100%"
                  className="w-full h-full"
                  onChange={handleCanvasChange}
                /> */}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Main Header */}
      <EraserHeader
        onNewDocument={() => handleCommandAction('new')}
        onOpenDocument={() => handleCommandAction('open')}
        onSearch={(query) => console.log('Search:', query)}
      />

      {/* Document Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-3 shadow-sm z-30 relative"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left side - File info */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow animate-pulse" />
            <span className="text-base font-semibold text-gray-800 tracking-tight">Untitled Diagram</span>
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </div>

          {/* Center - Tabs */}
          <div className="flex-1 flex justify-center">
            <div className="flex bg-gray-100 rounded-full shadow-inner px-1 py-1 gap-1">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as CanvasSection)}
                  className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2
                    ${activeSection === section.key
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="text-gray-500 hover:text-gray-900 px-3 rounded-full"
            >
              <Command className="h-4 w-4 mr-1" />
              <span className="text-xs">⌘K</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGridVisible(!isGridVisible)}
              className={`text-gray-500 hover:text-gray-900 rounded-full ${
                isGridVisible ? 'bg-blue-100 text-blue-600' : ''
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)}
              className={`text-gray-500 hover:text-gray-900 rounded-full ${
                isPropertiesPanelOpen ? 'bg-blue-100 text-blue-600' : ''
              }`}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full shadow"
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAiDrawer}
              className="text-gray-500 hover:text-blue-600 rounded-full"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 relative"
        style={{ 
          paddingRight: isPropertiesPanelOpen ? '320px' : '0',
          paddingBottom: '60px'
        }}
      >
        {renderContent()}
      </motion.div>

      {/* Toolbar */}
      {/* {activeSection !== 'document' && (
        <EraserToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={handleCopy}
          onDelete={handleDelete}
          zoomLevel={zoomLevel}
          isGridVisible={isGridVisible}
          onToggleGrid={() => setIsGridVisible(!isGridVisible)}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
        />
      )} */}

      {/* Command Palette */}
      {/* <EraserCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToolChange={handleToolChange}
        onAction={handleCommandAction}
      /> */}

      {/* Right Panel (Layers) */}
      {/* <RightPanel
        isOpen={isPropertiesPanelOpen}
        onClose={() => setIsPropertiesPanelOpen(false)}
        shapes={shapes.map(shape => ({
          ...shape,
          visible: true,
          locked: false
        }))}
        selectedShapeIds={selectedShapeIds}
        onSelectionChange={setSelectedShapeIds}
        onShapeUpdate={(id, updates) => {
          setShapes(shapes.map(shape => 
            shape.id === id ? { ...shape, ...updates } : shape
          ));
        }}
        onShapeDelete={(id) => {
          setShapes(shapes.filter(shape => shape.id !== id));
          setSelectedShapeIds(selectedShapeIds.filter(sid => sid !== id));
        }}
      /> */}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(format, options) => {
          console.log('Export:', format, options);
          // Implement export logic here
        }}
      />
    </div>
  );
}
