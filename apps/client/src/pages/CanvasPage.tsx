import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OutputData } from '@editorjs/editorjs';
// Make sure you have this CSS file or remove the import if not needed
import '../styles/editorjs-custom.css';
import { startTransition } from "react";

import {
	Share, Sparkles, FileText, Brush, LayoutGrid,
	Grid3X3, Layers, Pin, Minimize, Maximize, Loader2, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EraserPropertiesPanel } from '@/components/canvas/EraserPropertiesPanel';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiDrawer } from '@/components/ai/AiDrawer';
import Canvas from '@/components/canvas/Canvas';
import { IconSearchModal } from '@/components/canvas/IconSearchModal';
import { EditorJSEditor } from '@/components/editor/EditorJSEditor';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCanvas, useUpdateCanvas, useDeleteCanvas } from '@/hooks/useCanvas';
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

type CanvasSection = 'document' | 'both' | 'canvas';

// Memoize Sidebar to prevent it from causing layout shifts/loops during canvas updates
const MemoizedSidebar = memo(Sidebar);

const CanvasPage = () => {
	const navigate = useNavigate();
	const { id: canvasUid } = useParams<{ id: string }>();
	const { toggleAiDrawer } = useWorkspaceStore();

	// 1. Fetch Data
	const { data: canvas, isLoading, isError, error } = useCanvas(canvasUid || '');

	// 2. Local State for "Initial Load"
	// We store data here to pass it to components ONLY ONCE when the canvas ID changes.
	// This prevents the "Echo Loop" where the DB update triggers a re-render which triggers Excalidraw update.
	const [initialCanvasData, setInitialCanvasData] = useState<ExcalidrawElement[] | null>(null);
	const [initialViewport, setInitialViewport] = useState<any>(null);

	// Track the last loaded ID to know when to reset the initial data
	const lastLoadedIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!canvas) return;

		// Only load ON FIRST MOUNT
		if (lastLoadedIdRef.current === canvas.id) return;

		lastLoadedIdRef.current = canvas.id;
		setInitialCanvasData(canvas.canvas_data ?? []);
		setInitialViewport(canvas.viewport);
	}, [canvas?.id]);
	// 3. Create a Ref to hold the latest canvas data for event handlers
	// This allows us to read the latest ID inside timeouts without adding 'canvas' to dependency arrays
	const canvasRef = useRef(canvas);
	useEffect(() => {
		canvasRef.current = canvas;
	}, [canvas]);

	// Mutations
	const updateMutation = useUpdateCanvas({
		onError: (error) => {
			console.error("Mutation failed:", error);
		},
	});

	const deleteMutation = useDeleteCanvas({
		onSuccess: () => {
			toast.success('Canvas deleted successfully');
			navigate('/canvases');
		},
		onError: (error) => {
			toast.error(`Failed to delete canvas: ${error.message}`);
		},
	});

	// UI State
	const [activeSection, setActiveSection] = useState<CanvasSection>('canvas');
	const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [isGridVisible, setIsGridVisible] = useState(false);
	const [selectedElements, setSelectedElements] = useState<unknown[]>([]);
	const [elementCount, setElementCount] = useState(0);
	const [fullscreen, setFullscreen] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [showIconModal, setShowIconModal] = useState(false);
	const [localTitle, setLocalTitle] = useState('');

	// Sync title only if it's not being edited
	useEffect(() => {
		if (canvas?.title && !editingName) setLocalTitle(canvas.title);
	}, [canvas?.title, editingName]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setIsPropertiesPanelOpen(v => !v); }
			if ((e.metaKey || e.ctrlKey) && e.key === 'g') { e.preventDefault(); setIsGridVisible(v => !v); }
			if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); setShowIconModal(true); }
			if (e.key === 'Escape') navigate('/canvases');
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [navigate]);

	// Refs for debouncing
	const saveTimeoutRef = useRef<number | null>(null);
	const viewportSaveTimeoutRef = useRef<number | null>(null);
	const docSaveTimeoutRef = useRef<number | null>(null);

	// ============================================================================
	// HANDLERS (Stable Refs)
	// ============================================================================

	const handleCanvasChange = useCallback((elements: readonly unknown[], appState: unknown) => {
		// UI Updates are cheap, do them immediately
		if (elements && Array.isArray(elements)) {
			const selected = elements.filter((el: any) => el?.isSelected === true);
			startTransition(() => {
				setElementCount(elements.length);
				setSelectedElements(selected);
			});
			// DB Updates: Debounce and use Ref
			if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = window.setTimeout(() => {
				const currentCanvas = canvasRef.current;
				if (!currentCanvas?.id) return; // Safety Check

				updateMutation.mutate({
					id: currentCanvas.id,
					data: { canvas_data: elements as ExcalidrawElement[] },
				});
			}, 1000);
		}

		// Update Zoom safe state
		if (appState && typeof appState === 'object' && 'zoom' in appState) {
			const newZoom = (appState as any).zoom?.value;
			if (newZoom) {
				setZoomLevel(prev => (prev !== newZoom ? newZoom : prev));
			}
		}
	}, [updateMutation]);

	const handleViewportChange = useCallback((vp: { scrollX?: number; scrollY?: number; zoom?: number }) => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas || !vp) return;

		// Loop Prevention Check
		const currentVp = currentCanvas.viewport;
		if (currentVp) {
			const isSame =
				Math.abs((currentVp.scrollX || 0) - (vp.scrollX || 0)) < 1 &&
				Math.abs((currentVp.scrollY || 0) - (vp.scrollY || 0)) < 1 &&
				Math.abs((currentVp.zoom || 1) - (vp.zoom || 1)) < 0.01;
			if (isSame) return;
		}

		if (viewportSaveTimeoutRef.current) window.clearTimeout(viewportSaveTimeoutRef.current);
		viewportSaveTimeoutRef.current = window.setTimeout(() => {
			if (!canvasRef.current?.id) return;

			updateMutation.mutate({
				id: canvasRef.current.id,
				data: { viewport: vp },
			});
		}, 500);
	}, [updateMutation]);

	const handleDocumentChange = useCallback((data: OutputData) => {
		// Debounce EditorJS saves
		if (docSaveTimeoutRef.current) window.clearTimeout(docSaveTimeoutRef.current);
		docSaveTimeoutRef.current = window.setTimeout(() => {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas?.id) return;

			updateMutation.mutate({
				id: currentCanvas.id,
				data: { document_data: data },
			});
		}, 1000);
	}, [updateMutation]);

	const handleTitleChange = useCallback((newTitle: string) => {
		setLocalTitle(newTitle);
		// Debounce title save
		if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = window.setTimeout(() => {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas?.id) return;

			updateMutation.mutate({
				id: currentCanvas.id,
				data: { title: newTitle },
			});
		}, 500);
	}, [updateMutation]);

	const handleTogglePin = useCallback(() => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas) return;
		updateMutation.mutate({
			id: currentCanvas.id,
			data: { pinned: !currentCanvas.pinned },
		});
	}, [updateMutation]);

	const handleDelete = useCallback(() => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas) return;
		if (window.confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
			deleteMutation.mutate(currentCanvas.id);
		}
	}, [deleteMutation]);

	const handleIconSelect = useCallback((iconName: string, IconComponent: unknown) => {
		toast.success(`Icon "${iconName}" selected! Click on the canvas to place it.`);
	}, []);

	const handleUpdateElement = useCallback((elementId: string, properties: unknown) => {
		// Implement element update logic if needed
	}, []);

	const sections = [
		{ key: 'document', label: 'Document', icon: FileText },
		{ key: 'both', label: 'Both', icon: LayoutGrid },
		{ key: 'canvas', label: 'Canvas', icon: Brush },
	] as const;

	// ============================================================================
	// RENDER CONTENT
	// ============================================================================
	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="h-full w-full bg-white rounded-2xl shadow-lg p-8 flex items-center justify-center">
					<div className="text-center space-y-4">
						<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
						<p className="text-muted-foreground">Loading canvas...</p>
					</div>
				</div>
			);
		}

		if (isError || !canvas) {
			return (
				<div className="h-full w-full bg-white rounded-2xl shadow-lg p-8 flex items-center justify-center">
					<div className="text-center space-y-4">
						<h3 className="text-lg font-semibold">Failed to load canvas</h3>
						<p className="text-muted-foreground">{error?.message || 'Canvas not found'}</p>
						<Button onClick={() => navigate('/canvases')}>Back to Canvases</Button>
					</div>
				</div>
			);
		}

		// We use the initial data captured on load, ensuring the Canvas doesn't re-init on every keypress
		const safeCanvasData = initialCanvasData || [];

		switch (activeSection) {
			case 'document':
				return (
					<div className="h-full w-full bg-white rounded-2xl shadow-lg p-4 flex items-start justify-start overflow-y-auto">
						<div className="w-full max-w-2xl mx-auto">
							<EditorJSEditor
								width={800}
								data={canvas.document_data}
								onChange={handleDocumentChange}
								placeholder="Start writing..."
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
							{/* Key forces re-mount only when switching distinct canvases */}
							<Canvas
								key={canvas.id}
								data={safeCanvasData}
								onChange={handleCanvasChange}
								viewport={initialViewport}
								onViewportChange={handleViewportChange}
							/>
						</div>
					</div>
				);
			case 'both':
			default:
				return (
					<div className="h-full w-full flex bg-gray-100 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
						{/* LEFT: Editor */}
						<div className="flex-1 bg-white flex flex-col items-start p-4 border-r border-gray-200 min-w-[350px] overflow-y-auto">
							<div className="w-full max-w-xl">
								<EditorJSEditor
									data={canvas.document_data}
									onChange={handleDocumentChange}
									placeholder="Start writing..."
									alignLeft
									noBorder
									onImageError={msg => toast.error(msg)}
								/>
							</div>
						</div>
						{/* Divider */}
						<div className="w-[2px] bg-gray-100" />
						{/* RIGHT: Canvas */}
						<div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-4 min-w-[350px] relative">
							<div className="w-full h-full max-w-3xl flex">
								<Canvas
									key={canvas.id}
									data={safeCanvasData}
									onChange={handleCanvasChange}
									viewport={initialViewport}
									onViewportChange={handleViewportChange}
								/>
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
				{!fullscreen && <MemoizedSidebar />}
				<div className="flex-1 flex flex-col relative">
					{/* Header Controls */}
					<motion.div
						initial={{ y: -10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 shadow-sm z-30 relative"
					>
						<div className="flex items-center justify-between gap-2">
							{/* Left: Title */}
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-500 rounded-full shadow animate-pulse" />
								{editingName ? (
									<input
										className="text-base font-semibold text-gray-800 tracking-tight bg-transparent border-b border-gray-300 focus:outline-none px-1"
										value={localTitle}
										autoFocus
										onChange={e => handleTitleChange(e.target.value)}
										onBlur={() => setEditingName(false)}
										onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
									/>
								) : (
									<span
										className="text-base font-semibold text-gray-800 tracking-tight cursor-pointer"
										onDoubleClick={() => setEditingName(true)}
									>
										{localTitle || 'Untitled Canvas'}
									</span>
								)}
								<div className="relative">
									<button
										className="ml-2 p-1 rounded hover:bg-gray-100"
										onClick={handleTogglePin}
										title={canvas?.pinned ? 'Unpin canvas' : 'Pin canvas'}
									>
										<Pin className={`h-5 w-5 ${canvas?.pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
									</button>
									<button className="ml-2 p-1 rounded hover:bg-gray-100" onClick={() => setShowMenu(v => !v)}>
										<MoreHorizontal className="h-5 w-5 text-gray-400" />
									</button>
									{showMenu && (
										<div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
											<button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100" onClick={() => { setEditingName(true); setShowMenu(false); }}>Edit Name</button>
											<button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100" onClick={() => { handleDelete(); setShowMenu(false); }}>Delete</button>
										</div>
									)}
								</div>
							</div>

							{/* Center: Tabs */}
							<div className="flex-1 flex justify-center">
								<div className="flex bg-gray-100 rounded-full shadow-inner px-1 py-1 gap-1">
									{sections.map((section) => (
										<button
											key={section.key}
											onClick={() => setActiveSection(section.key as CanvasSection)}
											className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2
                                                ${activeSection === section.key ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
										>
											<section.icon className="h-4 w-4" />
											{section.label}
										</button>
									))}
								</div>
							</div>

							{/* Right: Tools */}
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="sm" onClick={() => setIsGridVisible(!isGridVisible)} className={`text-gray-500 hover:text-gray-900 rounded-full ${isGridVisible ? 'bg-blue-100 text-blue-600' : ''}`}><Grid3X3 className="h-4 w-4" /></Button>
								<Button variant="ghost" size="sm" onClick={() => setShowIconModal(true)} className="text-gray-500 hover:text-gray-900 rounded-full"><Brush className="h-4 w-4" /></Button>
								<Button variant="ghost" size="sm" onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)} className={`text-gray-500 hover:text-gray-900 rounded-full ${isPropertiesPanelOpen ? 'bg-blue-100 text-blue-600' : ''}`}><Layers className="h-4 w-4" /></Button>
								<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full shadow"><Share className="h-4 w-4 mr-1" /> Share</Button>
								<Button variant="ghost" size="icon" onClick={toggleAiDrawer} className="text-gray-500 hover:text-blue-600 rounded-full"><Sparkles className="h-5 w-5" /></Button>
								<Button variant="ghost" size="icon" onClick={() => setFullscreen(f => !f)} className="text-gray-500 hover:text-blue-600 rounded-full">{fullscreen ? <Minimize className="h-5 w-5 text-blue-600" /> : <Maximize className="h-5 w-5 text-gray-600" />}</Button>
							</div>
						</div>
					</motion.div>

					{/* Content */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className={`flex-1 relative ${fullscreen ? 'h-full' : ''} ${isPropertiesPanelOpen && !fullscreen ? 'pr-[320px]' : ''}`}
					>
						{renderContent()}
					</motion.div>
				</div>
			</div>
			{!fullscreen && <AiDrawer />}
			<EraserPropertiesPanel isOpen={isPropertiesPanelOpen} onClose={() => setIsPropertiesPanelOpen(false)} selectedElements={selectedElements} onUpdateElement={handleUpdateElement} />
			<IconSearchModal isOpen={showIconModal} onClose={() => setShowIconModal(false)} onSelectIcon={handleIconSelect} />
		</div>
	);
};

export default CanvasPage;