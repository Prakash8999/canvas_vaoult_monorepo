import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OutputData } from '@editorjs/editorjs';
import '../styles/editorjs-custom.css';
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
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
	Maximize,
	Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawCanvas } from '@/components/canvas/ExcalidrawCanvas';
import { EraserPropertiesPanel } from '@/components/canvas/EraserPropertiesPanel';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiDrawer } from '@/components/ai/AiDrawer';
import Canvas from '@/components/canvas/Canvas';
import { IconSearchModal } from '@/components/canvas/IconSearchModal';
import { EditorJSEditor } from '@/components/editor/EditorJSEditor';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCanvas, useUpdateCanvas, useDeleteCanvas } from '@/hooks/useCanvas';
import { Skeleton } from '@/components/ui/skeleton';

type CanvasSection = 'document' | 'both' | 'canvas';

const CanvasPage = () => {
	const navigate = useNavigate();
	const { id: canvasUid } = useParams<{ id: string }>();
	const { sidebarOpen, toggleAiDrawer } = useWorkspaceStore();

	// Fetch canvas data
	const { data: canvas, isLoading, isError, error } = useCanvas(canvasUid || '');

	// Mutations
	const updateMutation = useUpdateCanvas({
		onError: (error) => {
			toast.error(`Failed to update canvas: ${error.message}`);
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

	const [activeSection, setActiveSection] = useState<CanvasSection>('canvas');
	const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [isGridVisible, setIsGridVisible] = useState(false);
	const [isLocked, setIsLocked] = useState(false);
	const [selectedElements, setSelectedElements] = useState<unknown[]>([]);
	const [elementCount, setElementCount] = useState(0);
	const [fullscreen, setFullscreen] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [showIconModal, setShowIconModal] = useState(false);
	const [localTitle, setLocalTitle] = useState('');

	// Update local title when canvas loads
	useEffect(() => {
		if (canvas?.title) {
			setLocalTitle(canvas.title);
		}
	}, [canvas?.title]);

	// Restore zoom from viewport
	useEffect(() => {
		if (canvas?.viewport?.zoom) {
			setZoomLevel(canvas.viewport.zoom);
		}
	}, [canvas?.viewport?.zoom]);

	const sections = [
		{ key: 'document', label: 'Document', icon: FileText },
		{ key: 'both', label: 'Both', icon: LayoutGrid },
		{ key: 'canvas', label: 'Canvas', icon: Brush },
	] as const;

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
				e.preventDefault();
				setIsPropertiesPanelOpen(!isPropertiesPanelOpen);
			}
			if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
				e.preventDefault();
				setIsGridVisible(!isGridVisible);
			}
			if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
				e.preventDefault();
				setShowIconModal(true);
			}
			if (e.key === 'Escape') {
				navigate('/canvases');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isPropertiesPanelOpen, isGridVisible, navigate]);

	// Debounced canvas update
	const saveTimeoutRef = useRef<number | null>(null);
	const viewportSaveTimeoutRef = useRef<number | null>(null);

	const handleCanvasChange = useCallback((elements: readonly unknown[], appState: unknown) => {
		if (!canvas) return;

		if (elements && Array.isArray(elements)) {
			setElementCount(elements.length);
			const selected = elements.filter((el: any) => el?.isSelected === true);
			setSelectedElements(selected);

			// Debounce canvas data update
			if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = window.setTimeout(() => {
				updateMutation.mutate({
					id: canvas.id,
					data: { canvas_data: elements },
				});
			}, 1000); // 1 second debounce
		}

		// Update zoom
		if (appState && typeof appState === 'object' && 'zoom' in appState) {
			const zoom = (appState as any).zoom;
			if (zoom?.value && zoom.value !== zoomLevel) {
				setZoomLevel(zoom.value);
			}
		}
	}, [canvas, zoomLevel, updateMutation]);

	const handleViewportChange = useCallback((vp: { scrollX?: number; scrollY?: number; zoom?: number }) => {
		if (!canvas || !vp) return;

		if (viewportSaveTimeoutRef.current) window.clearTimeout(viewportSaveTimeoutRef.current);
		viewportSaveTimeoutRef.current = window.setTimeout(() => {
			updateMutation.mutate({
				id: canvas.id,
				data: { viewport: vp },
			});
		}, 500); // 500ms debounce
	}, [canvas, updateMutation]);

	const handleDocumentChange = useCallback((data: OutputData) => {
		if (!canvas) return;

		if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = window.setTimeout(() => {
			updateMutation.mutate({
				id: canvas.id,
				data: { document_data: data },
			});
		}, 1000); // 1 second debounce
	}, [canvas, updateMutation]);

	const handleTitleChange = useCallback((newTitle: string) => {
		setLocalTitle(newTitle);
		if (!canvas) return;

		if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = window.setTimeout(() => {
			updateMutation.mutate({
				id: canvas.id,
				data: { title: newTitle },
			});
		}, 500); // 500ms debounce
	}, [canvas, updateMutation]);

	const handleTogglePin = useCallback(() => {
		if (!canvas) return;
		updateMutation.mutate({
			id: canvas.id,
			data: { pinned: !canvas.pinned },
		});
	}, [canvas, updateMutation]);

	const handleDelete = useCallback(() => {
		if (!canvas) return;
		if (window.confirm(`Are you sure you want to delete "${canvas.title}"?`)) {
			deleteMutation.mutate(canvas.id);
		}
	}, [canvas, deleteMutation]);

	const handleIconSelect = useCallback((iconName: string, IconComponent: unknown) => {
		toast.success(`Icon "${iconName}" selected! Click on the canvas to place it.`);
		console.log('Selected icon:', iconName, IconComponent);
	}, []);

	const handleUpdateElement = useCallback((elementId: string, properties: unknown) => {
		console.log('Update element:', elementId, properties);
	}, []);

	const renderContent = () => {

		const safeCanvasData = canvas.canvas_data || [];

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

		switch (activeSection) {
			case 'document':
				return (
					<div className="h-full w-full bg-white rounded-2xl shadow-lg p-4 flex items-start justify-start">
						<div className="w-full max-w-2xl mx-auto">
							<EditorJSEditor
								width={800}
								data={canvas.document_data}
								onChange={handleDocumentChange}
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
							<Canvas
								data={safeCanvasData}
								onChange={handleCanvasChange}
								viewport={canvas.viewport}
								onViewportChange={handleViewportChange}
							/>
						</div>
					</div>
				);
			case 'both':
			default:
				return (
					<div className="h-full w-full flex bg-gray-100 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
						<div className="flex-1 bg-white flex flex-col items-start p-4 border-r border-gray-200 min-w-[350px]">
							<div className="w-full max-w-xl">
								<EditorJSEditor
									data={canvas.document_data}
									onChange={handleDocumentChange}
									placeholder="Start writing your document..."
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
									data={safeCanvasData}
									onChange={handleCanvasChange}
									viewport={canvas.viewport}
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
				{!fullscreen && <Sidebar />}
				<div className="flex-1 flex flex-col relative">
					{/* Document Header */}
					<motion.div
						initial={{ y: -10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 shadow-sm z-30 relative"
					>
						<div className="flex items-center justify-between gap-2">
							{/* Left side */}
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
												onClick={() => { handleDelete(); setShowMenu(false); }}
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
					>
						{renderContent()}
					</motion.div>
				</div>
			</div>
			{!fullscreen && <AiDrawer />}
			<EraserPropertiesPanel
				isOpen={isPropertiesPanelOpen}
				onClose={() => setIsPropertiesPanelOpen(false)}
				selectedElements={selectedElements}
				onUpdateElement={handleUpdateElement}
			/>
			<IconSearchModal
				isOpen={showIconModal}
				onClose={() => setShowIconModal(false)}
				onSelectIcon={handleIconSelect}
			/>
		</div>
	);
};

export default CanvasPage;