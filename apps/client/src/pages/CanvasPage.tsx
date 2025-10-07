import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import '../styles/editorjs-custom.css';
import {
	Command,
	Settings,
	Share,
	Sparkles,
	ArrowLeft,
	Download,
	Upload,
	Users,
	Wifi,
	MoreHorizontal,
	FileText,
	Brush,
	LayoutGrid,
	Grid3X3,
	Layers,
	Pin,
	Minimize,
	Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawCanvas } from '@/components/canvas/ExcalidrawCanvas';
import { EraserToolbar } from '@/components/canvas/EraserToolbar';
import { EraserCommandPalette } from '@/components/canvas/EraserCommandPalette';
import { EraserPropertiesPanel } from '@/components/canvas/EraserPropertiesPanel';
import { EraserHeader } from '@/components/canvas/EraserHeader';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiDrawer } from '@/components/ai/AiDrawer';
import Canvas from '@/components/canvas/Canvas';
import { IconSearchModal } from '@/components/canvas/IconSearchModal';
import { EditorJSEditor } from '@/components/editor/EditorJSEditor';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCanvasDocumentStore } from '@/stores/canvasDocument';

type CanvasSection = 'document' | 'both' | 'canvas';


const CanvasPage = () => {
	const navigate = useNavigate();
	const { id: canvasId } = useParams<{ id: string }>();
	const { sidebarOpen, toggleAiDrawer } = useWorkspaceStore();
	const [activeSection, setActiveSection] = useState<CanvasSection>('canvas');
	const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [isGridVisible, setIsGridVisible] = useState(false);
	const [isLocked, setIsLocked] = useState(false);
	const [selectedElements, setSelectedElements] = useState<any[]>([]);
	const [elementCount, setElementCount] = useState(0);
	const [lastSaved, setLastSaved] = useState<Date>(new Date());
	const [fullscreen, setFullscreen] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [showIconModal, setShowIconModal] = useState(false);
	// Zustand store
	const { 
		canvasData, 
		setCanvasData, 
		documentData, 
		setDocumentData, 
		docName, 
		setDocName,
		canvases,
		createCanvas,
		updateCanvas,
		setCurrentCanvas,
		getCurrentCanvas
	} = useCanvasDocumentStore();
	
	// Get current canvas or create new one
	const currentCanvas = canvasId ? canvases[canvasId] : null;

	// When currentCanvas changes, restore zoomLevel from stored viewport if present
	useEffect(() => {
		if (currentCanvas?.viewport?.zoom) {
			setZoomLevel(currentCanvas.viewport.zoom);
		}
	}, [currentCanvas?.viewport?.zoom]);
	
	// Initialize canvas if not found
	useEffect(() => {
		if (!canvasId) {
			// Create new canvas and redirect
			const newCanvasId = createCanvas();
			navigate(`/canvas/${newCanvasId}`, { replace: true });
			return;
		}
		
		if (canvasId && !currentCanvas) {
			// Canvas not found, redirect to canvas list
			navigate('/canvases');
			return;
		}
		
		if (canvasId && currentCanvas) {
			// Set as current canvas
			setCurrentCanvas(canvasId);
		}
	}, [canvasId, createCanvas, navigate, setCurrentCanvas]);

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
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Command Palette
			//   if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			//     e.preventDefault();
			//     setIsCommandPaletteOpen(true);
			//   }



			// Toggle properties panel
			if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
				e.preventDefault();
				setIsPropertiesPanelOpen(!isPropertiesPanelOpen);
			}

			// Toggle grid
			if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
				e.preventDefault();
				setIsGridVisible(!isGridVisible);
			}

			// Open icon modal
			if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
				e.preventDefault();
				setShowIconModal(true);
			}

			// Back to home
			if (e.key === 'Escape') {
				navigate('/');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isPropertiesPanelOpen, isGridVisible, navigate]);

	// Refs for debounced persistence & change detection
	const lastElementsSigRef = useRef<string>('');
	const saveTimeoutRef = useRef<number | null>(null);
	const viewportSaveTimeoutRef = useRef<number | null>(null);
	const unmountedRef = useRef(false);

	useEffect(() => () => { // cleanup on unmount
		unmountedRef.current = true;
		if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
	}, []);

	const handleCanvasChange = useCallback((elements: readonly any[], appState: any) => {
		if (elements && Array.isArray(elements)) {
			// UI-only immediate state updates (cheap)
			setElementCount(elements.length);
			const selected = elements.filter(el => el?.isSelected === true);
			setSelectedElements(selected);

			// Build a lightweight signature (ids + version) to detect real changes
			const sig = elements.map((el: any) => `${el?.id}:${el?.version ?? 0}`).join('|');
					if (sig !== lastElementsSigRef.current) {
				lastElementsSigRef.current = sig; // optimistic update to collapse bursts
				// Debounce persistence to reduce render/update storms from Excalidraw's high-frequency onChange
				if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = window.setTimeout(() => {
					if (unmountedRef.current) return;
						// Persist to per-canvas storage when available, otherwise fall back
						// to legacy global canvasData for backward compatibility.
						if (canvasId && currentCanvas) {
							updateCanvas(canvasId, { canvasData: elements });
						} else {
							setCanvasData(elements);
						}
				}, 250); // 250ms debounce window
			}
		}
		// Zoom updates (guard to prevent loop)
		if (appState?.zoom?.value && appState.zoom.value !== zoomLevel) {
			setZoomLevel(appState.zoom.value);
		}
	}, [zoomLevel, setCanvasData, canvasId, currentCanvas, updateCanvas]);

	// Persist viewport when Excalidraw reports changes (debounced)
	const handleViewportChange = useCallback((vp: { scrollX?: number; scrollY?: number; zoom?: number }) => {
		if (!vp) return;
		// debounce saves
		if (viewportSaveTimeoutRef.current) window.clearTimeout(viewportSaveTimeoutRef.current);
		viewportSaveTimeoutRef.current = window.setTimeout(() => {
			if (unmountedRef.current) return;
			if (canvasId && currentCanvas) {
				updateCanvas(canvasId, { viewport: vp });
			} else {
				// legacy case - store zoom to top-level state if needed
				// keep backward compat by writing into the legacy canvasData container as metadata? skip for now
			}
		}, 200);
	}, [canvasId, currentCanvas, updateCanvas]);



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
		console.log('Undo');
	}, []);

	const handleRedo = useCallback(() => {
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
	}, []);

	const handleIconSelect = useCallback((iconName: string, IconComponent: any) => {
		// For now, we'll just show a toast. In a real implementation, 
		// you'd add the icon to the canvas using Excalidraw's API
		toast.success(`Icon "${iconName}" selected! Click on the canvas to place it.`);
		console.log('Selected icon:', iconName, IconComponent);
		
		// Note: To actually add icons to Excalidraw, you'd need to:
		// 1. Convert the icon to SVG data
		// 2. Create an Excalidraw element with the SVG
		// 3. Add it to the canvas elements
	}, []);

	const renderContent = () => {
			switch (activeSection) {
				case 'document':
					return (
						<div className="h-full w-full bg-white rounded-2xl shadow-lg p-4 flex items-start justify-start">
							<div className="w-full max-w-2xl mx-auto">
												<EditorJSEditor
													width={800}
													// Prefer per-canvas document data when present
													data={currentCanvas?.documentData ?? documentData}
													onChange={(data) => {
														// Persist into per-canvas document when active
														if (canvasId && currentCanvas) {
															updateCanvas(canvasId, { documentData: data });
														} else {
															setDocumentData(data);
														}
													}}
									placeholder="Start writing your document..."
									alignLeft
									noBorder
									onImageError={msg => toast.error(msg)}
								/>
							</div>
						</div>
					);
				case 'canvas':
					return (
						<div className="h-full w-full bg-gray-50 relative overflow-hidden flex flex-col">
							<div className="flex-1 flex">
								<Canvas data={currentCanvas?.canvasData ?? canvasData} onChange={handleCanvasChange} viewport={currentCanvas?.viewport ?? null} onViewportChange={handleViewportChange} />
							</div>
						</div>
					);
				case 'both':
				default:
					return (
						<div className="h-full w-full flex bg-gray-100 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
							{/* Document Section */}
							<div className="flex-1 bg-white flex flex-col items-start p-4 border-r border-gray-200 min-w-[350px]">
								<div className="w-full max-w-xl">
									<EditorJSEditor
										data={documentData}
										onChange={(data) => {
											setDocumentData(data);
										}}
										placeholder="Start writing your document..."
										alignLeft
										noBorder
										onImageError={msg => toast.error(msg)}
									/>
								</div>
							</div>
							{/* Divider */}
							<div className="w-[2px] bg-gray-100" />
							{/* Canvas Section */}
							<div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-4 min-w-[350px] relative">
								<div className="w-full h-full max-w-3xl flex">
									<Canvas data={currentCanvas?.canvasData ?? canvasData} onChange={handleCanvasChange} viewport={currentCanvas?.viewport ?? null} onViewportChange={handleViewportChange} />
								</div>
							</div>
						</div>
					);
			}
		};

	return (
		<div className={`h-screen bg-workspace-bg flex flex-col overflow-hidden ${fullscreen ? 'z-[9999]' : ''}`}>
			{!fullscreen && <Header />}
			<div className={`flex-1 flex overflow-hidden ${fullscreen ? 'h-screen' : ''}`}>
				{!fullscreen && <Sidebar />}
				<div className="flex-1 flex flex-col relative">
					{/* Document Header - always visible, compact */}
					<motion.div
						initial={{ y: -10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 shadow-sm z-30 relative"
					>
						<div className="flex items-center justify-between gap-2">
							{/* Left side - Document info */}
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-500 rounded-full shadow animate-pulse" />
									{editingName ? (
										<input
											className="text-base font-semibold text-gray-800 tracking-tight bg-transparent border-b border-gray-300 focus:outline-none px-1"
											value={currentCanvas?.name || docName}
											autoFocus
											onChange={e => {
												if (canvasId && currentCanvas) {
													updateCanvas(canvasId, { name: e.target.value });
												} else {
													setDocName(e.target.value);
												}
											}}
											onBlur={() => setEditingName(false)}
											onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
										/>
									) : (
										<span
											className="text-base font-semibold text-gray-800 tracking-tight cursor-pointer"
											onDoubleClick={() => setEditingName(true)}
										>
											{currentCanvas?.name || docName}
										</span>
									)}
									<div className="relative">
										{/* Pin/Unpin Button */}
										{canvasId && currentCanvas && (
											<button
												className="ml-2 p-1 rounded hover:bg-gray-100"
												onClick={() => updateCanvas(canvasId, { pinned: !currentCanvas.pinned })}
												title={currentCanvas.pinned ? 'Unpin canvas' : 'Pin canvas'}
											>
												<Pin className={`h-5 w-5 ${currentCanvas.pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
											</button>
										)}

										<button
											className="ml-2 p-1 rounded hover:bg-gray-100"
											onClick={() => setShowMenu(v => !v)}
										>
											<MoreHorizontal className="h-5 w-5 text-gray-400" />
										</button>
										{showMenu && (
											<div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
												<button
													className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
													onClick={() => { setEditingName(true); setShowMenu(false); }}
												>Edit Name</button>
												<button
													className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
													onClick={() => { setDocName('Untitled Document'); setShowMenu(false); }}
												>Delete</button>
											</div>
										)}
									</div>
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
									onClick={() => setIsGridVisible(!isGridVisible)}
									className={`text-gray-500 hover:text-gray-900 rounded-full ${isGridVisible ? 'bg-blue-100 text-blue-600' : ''
										}`}
								>
									<Grid3X3 className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowIconModal(true)}
									className="text-gray-500 hover:text-gray-900 rounded-full"
									title="Add Icon (Ctrl+I)"
								>
									<Brush className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)}
									className={`text-gray-500 hover:text-gray-900 rounded-full ${isPropertiesPanelOpen ? 'bg-blue-100 text-blue-600' : ''
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
								{/* Maximize/Minimize Button in Document Header */}
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setFullscreen(f => !f)}
									className="text-gray-500 hover:text-blue-600 rounded-full"
								>
									{fullscreen ? <Minimize className="h-5 w-5 text-blue-600" /> : <Maximize className="h-5 w-5 text-gray-600" />}
								</Button>
							</div>
						</div>
					</motion.div>
					{/* Content Area */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className={`flex-1 relative ${fullscreen ? 'h-full' : ''} ${isPropertiesPanelOpen && !fullscreen ? 'pr-[320px]' : ''}`}
						style={{}}
					>
						{renderContent()}
					</motion.div>
				</div>
			</div>
			{/* AI Drawer */}
			{!fullscreen && <AiDrawer />}
			{/* Properties Panel */}
			<EraserPropertiesPanel
				isOpen={isPropertiesPanelOpen}
				onClose={() => setIsPropertiesPanelOpen(false)}
				selectedElements={selectedElements}
				onUpdateElement={handleUpdateElement}
			/>
			{/* Icon Search Modal */}
			<IconSearchModal
				isOpen={showIconModal}
				onClose={() => setShowIconModal(false)}
				onSelectIcon={handleIconSelect}
			/>
		</div>
	);
};

export default CanvasPage;