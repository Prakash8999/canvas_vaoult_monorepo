import { useState, useEffect, useCallback, useRef, memo, startTransition } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OutputData } from '@editorjs/editorjs';
import '../styles/editorjs-custom.css';

import {
	Share, Sparkles, FileText, Brush, LayoutGrid,
	Grid3X3, Layers, Pin, Minimize, Maximize, Loader2, MoreHorizontal,
	Save, CheckCircle2
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
import { UpdateCanvasDto } from '@/lib/api/canvasApi';
// ✅ IMPORT THIS HELPER
import { getSceneVersion } from "@excalidraw/excalidraw";

type CanvasSection = 'document' | 'both' | 'canvas';

const MemoizedSidebar = memo(Sidebar);

const CanvasPage = () => {
	const navigate = useNavigate();
	const { id: canvasUid } = useParams<{ id: string }>();
	const { toggleAiDrawer } = useWorkspaceStore();

	// 1. Fetch Data
	const { data: canvas, isLoading, isError, error } = useCanvas(canvasUid || '');

	// 2. Local State for "Initial Load"
	const [initialCanvasData, setInitialCanvasData] = useState<ExcalidrawElement[] | null>(null);
	const [initialViewport, setInitialViewport] = useState<any>(null);
	// 3. Current Canvas Data (includes unsaved changes) - using refs to avoid infinite loops
	const currentCanvasDataRef = useRef<ExcalidrawElement[]>([]);
	const currentViewportRef = useRef<any>(null);

	const isDataReady = !isLoading && canvas && (
		!canvas.canvas_data || // canvas is empty on server
		canvas.canvas_data.length === 0 || // canvas is empty on server
		(initialCanvasData && initialCanvasData.length > 0) // or we have loaded it
	);
	// Refs to track state
	const lastLoadedIdRef = useRef<number | null>(null);
	const canvasRef = useRef(canvas);
	// ✅ Track the "Version" of the saved data to prevent false "Unsaved" states
	const lastSavedVersionRef = useRef<number>(0);
	// ✅ Track the last processed version to detect actual changes
	const lastProcessedVersionRef = useRef<number>(0);

	useEffect(() => {
		canvasRef.current = canvas;
	}, [canvas]);

	// Initialize Data on Load
	useEffect(() => {
		if (!canvas) return;

		const isNewCanvas = lastLoadedIdRef.current !== canvas.id;
		const hasDataNow = canvas.canvas_data && canvas.canvas_data.length > 0;
		const dataNotLoaded = !initialCanvasData || initialCanvasData.length === 0;

		if (isNewCanvas || (hasDataNow && dataNotLoaded)) {
			lastLoadedIdRef.current = canvas.id;
			const data = canvas.canvas_data ? [...canvas.canvas_data] : [];
			setInitialCanvasData(data);
			setInitialViewport(canvas.viewport);
			// Also set current data refs
			currentCanvasDataRef.current = data;
			currentViewportRef.current = canvas.viewport;
			// Set initial versions so we don't immediately think we are "dirty"
			const initialVersion = getSceneVersion(data);
			lastSavedVersionRef.current = initialVersion;
			lastProcessedVersionRef.current = initialVersion;
		}
	}, [canvas, initialCanvasData]);

	// ============================================================================
	// ✅ SAVE LOGIC
	// ============================================================================

	const [isUnsaved, setIsUnsaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const pendingChangesRef = useRef<Partial<UpdateCanvasDto>>({});
	const autoSaveTimerRef = useRef<number | null>(null);

	const updateMutation = useUpdateCanvas({
		onSuccess: (_, variables) => {
			setIsSaving(false);
			setIsUnsaved(false);

			// ✅ FIX PARTIAL SAVE BUG: Only clear the keys we actually saved.
			// If we just saved 'pinned', DO NOT clear 'canvas_data' from pendingChangesRef.
			const savedKeys = Object.keys(variables.data);
			const currentPending = { ...pendingChangesRef.current };

			savedKeys.forEach((key) => {
				delete currentPending[key as keyof UpdateCanvasDto];
			});

			pendingChangesRef.current = currentPending;

			// Update version refs ONLY if we saved canvas data
			if (variables.data.canvas_data) {
				const savedVersion = getSceneVersion(variables.data.canvas_data);
				lastSavedVersionRef.current = savedVersion;
				lastProcessedVersionRef.current = savedVersion;
			}
		},
		onError: (error) => {
			console.error("Save failed:", error);
			setIsSaving(false);
			toast.error("Failed to save changes");
		},
	});

	const triggerSave = useCallback(() => {
		const currentCanvas = canvasRef.current;
		const changes = pendingChangesRef.current;

		if (!currentCanvas?.id) return;
		if (Object.keys(changes).length === 0) return;

		setIsSaving(true);

		// Ensure viewport is included if not explicitly changed
		const payload = { ...changes };
		if (!payload.viewport && currentCanvas.viewport) {
			payload.viewport = currentCanvas.viewport;
		}

		updateMutation.mutate({
			id: currentCanvas.id,
			data: payload,
		});

		if (autoSaveTimerRef.current) {
			window.clearTimeout(autoSaveTimerRef.current);
			autoSaveTimerRef.current = null;
		}
	}, [updateMutation]);

	const scheduleAutoSave = useCallback((silent = false) => {
		// Only mark UI as "Unsaved" (Blue button) if it's NOT a silent update (like viewport)
		if (!silent) setIsUnsaved(true);

		if (autoSaveTimerRef.current) {
			window.clearTimeout(autoSaveTimerRef.current);
		}

		// 12 Seconds Timer
		autoSaveTimerRef.current = window.setTimeout(() => {
			triggerSave();
		}, 12000);
	}, [triggerSave]);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	// ✅ FIXED: Intelligent Change Handler
	const handleCanvasChange = useCallback((elements: readonly unknown[], appState: any) => {
		if (elements && Array.isArray(elements)) {
			const typedElements = elements as ExcalidrawElement[];

			// 1. Check Scene Version: Did something ACTUALLY change?
			// (Filters out selection changes, hover, etc.)
			const currentVersion = getSceneVersion(typedElements);

			// Compare with last PROCESSED version, not last SAVED version
			if (currentVersion !== lastProcessedVersionRef.current) {
				// UI Updates
				const selected = elements.filter((el: any) => el?.isSelected === true);
				startTransition(() => {
					setElementCount(elements.length);
					setSelectedElements(selected);
				});

				// Update Pending Data
				const currentZoom = typeof appState.zoom === 'object' ? appState.zoom.value : appState.zoom;
				const newViewport = {
					scrollX: appState.scrollX,
					scrollY: appState.scrollY,
					zoom: currentZoom || 1
				};

				pendingChangesRef.current = {
					...pendingChangesRef.current,
					canvas_data: typedElements,
					viewport: newViewport
				};

				// Update current refs so it persists across view mode changes
				currentCanvasDataRef.current = typedElements;
				currentViewportRef.current = newViewport;

				// Update the last processed version
				lastProcessedVersionRef.current = currentVersion;

				// Trigger "Loud" AutoSave (enables Blue Button)
				scheduleAutoSave(false);
			}
		}

		// Handle Zoom changes silently
		if (appState?.zoom) {
			const newZoom = typeof appState.zoom === 'object' ? appState.zoom.value : appState.zoom;
			if (newZoom) setZoomLevel(prev => (prev !== newZoom ? newZoom : prev));
		}
	}, [scheduleAutoSave]);

	// ✅ FIXED: Viewport changes trigger SILENT auto-save
	const handleViewportChange = useCallback((vp: { scrollX?: number; scrollY?: number; zoom?: number }) => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas) return;

		const currentVp = currentCanvas.viewport;
		if (currentVp) {
			const isSame =
				Math.abs((currentVp.scrollX || 0) - (vp.scrollX || 0)) < 1 &&
				Math.abs((currentVp.scrollY || 0) - (vp.scrollY || 0)) < 1 &&
				Math.abs((currentVp.zoom || 1) - (vp.zoom || 1)) < 0.01;
			if (isSame) return;
		}

		pendingChangesRef.current = {
			...pendingChangesRef.current,
			viewport: vp
		};

		// Update current viewport ref
		currentViewportRef.current = vp;

		// Silent = true (Don't turn button blue, but do save eventually)
		scheduleAutoSave(true);
	}, [scheduleAutoSave]);

	const handleDocumentChange = useCallback((data: OutputData) => {
		pendingChangesRef.current = {
			...pendingChangesRef.current,
			document_data: data
		};
		scheduleAutoSave(false);
	}, [scheduleAutoSave]);

	const handleTitleChange = useCallback((newTitle: string) => {
		setLocalTitle(newTitle);
		pendingChangesRef.current = {
			...pendingChangesRef.current,
			title: newTitle
		};
		scheduleAutoSave(false);
	}, [scheduleAutoSave]);

	const handleTogglePin = useCallback(() => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas) return;
		updateMutation.mutate({
			id: currentCanvas.id,
			data: { pinned: !currentCanvas.pinned },
		});
	}, [updateMutation]);

	const deleteMutation = useDeleteCanvas({
		onSuccess: () => {
			toast.success('Canvas deleted successfully');
			navigate('/canvases');
		},
		onError: (error) => {
			toast.error(`Failed to delete canvas: ${error.message}`);
		},
	});

	const handleDelete = useCallback(() => {
		const currentCanvas = canvasRef.current;
		if (!currentCanvas) return;
		if (window.confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
			deleteMutation.mutate(currentCanvas.id);
		}
	}, [deleteMutation]);

	// UI States
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

	useEffect(() => {
		if (canvas?.title && !editingName) setLocalTitle(canvas.title);
	}, [canvas?.title, editingName]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setIsPropertiesPanelOpen(v => !v); }
			if ((e.metaKey || e.ctrlKey) && e.key === 'g') { e.preventDefault(); setIsGridVisible(v => !v); }
			if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); setShowIconModal(true); }
			if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); triggerSave(); }
			if (e.key === 'Escape') navigate('/canvases');
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [navigate, triggerSave]);

	const handleIconSelect = useCallback((iconName: string, IconComponent: unknown) => {
		toast.success(`Icon "${iconName}" selected! Click on the canvas to place it.`);
	}, []);

	const handleUpdateElement = useCallback((elementId: string, properties: unknown) => {
		// Implement element update logic
	}, []);

	const sections = [
		{ key: 'document', label: 'Document', icon: FileText },
		{ key: 'both', label: 'Both', icon: LayoutGrid },
		{ key: 'canvas', label: 'Canvas', icon: Brush },
	] as const;

	const renderContent = () => {
		if (!isDataReady) {
			return (
				<div className="h-full w-full flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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

		// Use current data (includes unsaved changes) instead of initial data
		const safeCanvasData = currentCanvasDataRef.current.length > 0 ? currentCanvasDataRef.current : (initialCanvasData || []);
		const safeViewport = currentViewportRef.current || initialViewport;

		// Use activeSection in key to force remount when switching views
		const canvasKey = `${canvas.id}-${activeSection}`;

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
							<Canvas
								key={canvasKey}
								data={safeCanvasData}
								onChange={handleCanvasChange}
								viewport={safeViewport}
								onViewportChange={handleViewportChange}
							/>
						</div>
					</div>
				);
			case 'both':
			default:
				return (
					<div className="h-full w-full flex bg-gray-100 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
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
						<div className="w-[2px] bg-gray-100" />
						<div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-4 min-w-[350px] relative">
							<div className="w-full h-full max-w-3xl flex">
								<Canvas
									key={canvasKey}
									data={safeCanvasData}
									onChange={handleCanvasChange}
									viewport={safeViewport}
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
					<motion.div
						initial={{ y: -10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 shadow-sm z-30 relative"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2 mr-2">
									{isSaving ? (
										<Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
									) : isUnsaved ? (
										<div className="h-2 w-2 bg-yellow-500 rounded-full" title="Unsaved changes" />
									) : (
										<CheckCircle2 className="h-4 w-4 text-green-500 opacity-50" name="All changes saved" />
									)}
								</div>

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

							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant={isUnsaved ? "default" : "ghost"}
									className={`rounded-full transition-all ${isUnsaved ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-500"}`}
									onClick={triggerSave}
									disabled={!isUnsaved || isSaving}
								>
									<Save className="h-4 w-4 mr-1" />
									{isSaving ? "Saving..." : "Save"}
								</Button>
								<div className="h-4 w-[1px] bg-gray-300 mx-1"></div>

								<Button variant="ghost" size="sm" onClick={() => setIsGridVisible(!isGridVisible)} className={`text-gray-500 hover:text-gray-900 rounded-full ${isGridVisible ? 'bg-blue-100 text-blue-600' : ''}`}><Grid3X3 className="h-4 w-4" /></Button>
								<Button variant="ghost" size="sm" onClick={() => setShowIconModal(true)} className="text-gray-500 hover:text-gray-900 rounded-full"><Brush className="h-4 w-4" /></Button>
								<Button variant="ghost" size="sm" onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)} className={`text-gray-500 hover:text-gray-900 rounded-full ${isPropertiesPanelOpen ? 'bg-blue-100 text-blue-600' : ''}`}><Layers className="h-4 w-4" /></Button>
								<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full shadow"><Share className="h-4 w-4 mr-1" /> Share</Button>
								<Button variant="ghost" size="icon" onClick={toggleAiDrawer} className="text-gray-500 hover:text-blue-600 rounded-full"><Sparkles className="h-5 w-5" /></Button>
								<Button variant="ghost" size="icon" onClick={() => setFullscreen(f => !f)} className="text-gray-500 hover:text-blue-600 rounded-full">{fullscreen ? <Minimize className="h-5 w-5 text-blue-600" /> : <Maximize className="h-5 w-5 text-gray-600" />}</Button>
							</div>
						</div>
					</motion.div>

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