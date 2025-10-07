// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import {
//   Users,
//   Wifi,
//   WifiOff,
//   Save,
//   Clock,
//   Zap,
//   Eye,
//   MousePointer2,
//   Hash,
//   Palette
// } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// interface EraserStatusBarProps {
//   isOnline: boolean;
//   lastSaved?: Date;
//   collaborators: Array<{
//     id: string;
//     name: string;
//     avatar?: string;
//     color: string;
//     isActive: boolean;
//   }>;
//   elementCount: number;
//   zoomLevel: number;
//   selectedTool: string;
//   canvasSize: { width: number; height: number };
//   onZoomChange: (zoom: number) => void;
// }

// export function EraserStatusBar({
//   isOnline,
//   lastSaved,
//   collaborators,
//   elementCount,
//   zoomLevel,
//   selectedTool,
//   canvasSize,
//   onZoomChange
// }: EraserStatusBarProps) {
//   const [currentTime, setCurrentTime] = useState(new Date());

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString('en-US', {
//       hour12: false,
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatLastSaved = (date: Date) => {
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

//     if (diffInSeconds < 60) {
//       return 'Saved just now';
//     } else if (diffInSeconds < 3600) {
//       const minutes = Math.floor(diffInSeconds / 60);
//       return `Saved ${minutes}m ago`;
//     } else {
//       return `Saved at ${date.toLocaleTimeString('en-US', {
//         hour12: false,
//         hour: '2-digit',
//         minute: '2-digit'
//       })}`;
//     }
//   };

//   const getToolDisplayName = (tool: string) => {
//     const toolNames: Record<string, string> = {
//       select: 'Select',
//       rectangle: 'Rectangle',
//       ellipse: 'Ellipse',
//       diamond: 'Diamond',
//       arrow: 'Arrow',
//       line: 'Line',
//       freedraw: 'Draw',
//       text: 'Text',
//       image: 'Image',
//       eraser: 'Eraser',
//       hand: 'Hand'
//     };
//     return toolNames[tool] || tool;
//   };

//   const zoomOptions = [25, 50, 75, 100, 125, 150, 200, 300, 400];

//   return (
//     <TooltipProvider delayDuration={300}>
//       <motion.div
//         className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200"
//         initial={{ y: 100, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.3, ease: "easeOut" }}
//       >
//         <div className="px-6 py-3">
//           <div className="flex items-center justify-between text-sm">
//             {/* Left Section */}
//             <div className="flex items-center gap-6">
//               {/* Connection Status */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2">
//                     {isOnline ? (
//                       <Wifi className="h-4 w-4 text-green-500" />
//                     ) : (
//                       <WifiOff className="h-4 w-4 text-red-500" />
//                     )}
//                     <span className={`text-xs font-medium ${
//                       isOnline ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {isOnline ? 'Online' : 'Offline'}
//                     </span>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>{isOnline ? 'Connected to Eraser servers' : 'Connection lost'}</p>
//                 </TooltipContent>
//               </Tooltip>

//               {/* Save Status */}
//               {lastSaved && (
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <Save className="h-4 w-4" />
//                       <span className="text-xs">
//                         {formatLastSaved(lastSaved)}
//                       </span>
//                     </div>
//                   </TooltipTrigger>
//                   <TooltipContent>
//                     <p>Last saved: {lastSaved.toLocaleString()}</p>
//                   </TooltipContent>
//                 </Tooltip>
//               )}

//               {/* Collaborators */}
//               {collaborators.length > 0 && (
//                 <div className="flex items-center gap-2">
//                   <Users className="h-4 w-4 text-gray-500" />
//                   <div className="flex -space-x-2">
//                     {collaborators.slice(0, 5).map((collaborator) => (
//                       <Tooltip key={collaborator.id}>
//                         <TooltipTrigger asChild>
//                           <div
//                             className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white cursor-pointer ${
//                               collaborator.isActive ? 'ring-2 ring-green-400' : ''
//                             }`}
//                             style={{ backgroundColor: collaborator.color }}
//                           >
//                             {collaborator.avatar ? (
//                               <img
//                                 src={collaborator.avatar}
//                                 alt={collaborator.name}
//                                 className="w-full h-full rounded-full object-cover"
//                               />
//                             ) : (
//                               collaborator.name.charAt(0).toUpperCase()
//                             )}
//                           </div>
//                         </TooltipTrigger>
//                         <TooltipContent>
//                           <p>{collaborator.name} {collaborator.isActive ? '(active)' : ''}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     ))}
//                     {collaborators.length > 5 && (
//                       <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
//                         +{collaborators.length - 5}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Center Section */}
//             <div className="flex items-center gap-6">
//               {/* Element Count */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2 text-gray-600">
//                     <Hash className="h-4 w-4" />
//                     <span className="text-xs">
//                       {elementCount} element{elementCount !== 1 ? 's' : ''}
//                     </span>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Total elements on canvas</p>
//                 </TooltipContent>
//               </Tooltip>

//               {/* Active Tool */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2">
//                     <MousePointer2 className="h-4 w-4 text-blue-600" />
//                     <Badge variant="secondary" className="text-xs">
//                       {getToolDisplayName(selectedTool)}
//                     </Badge>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Active tool: {getToolDisplayName(selectedTool)}</p>
//                 </TooltipContent>
//               </Tooltip>

//               {/* Canvas Size */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2 text-gray-600">
//                     <Eye className="h-4 w-4" />
//                     <span className="text-xs">
//                       {canvasSize.width} × {canvasSize.height}
//                     </span>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Canvas dimensions</p>
//                 </TooltipContent>
//               </Tooltip>
//             </div>

//             {/* Right Section */}
//             <div className="flex items-center gap-6">
//               {/* Zoom Control */}
//               <div className="flex items-center gap-2">
//                 <select
//                   value={Math.round(zoomLevel * 100)}
//                   onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
//                   className="text-xs bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
//                 >
//                   {zoomOptions.map((zoom) => (
//                     <option key={zoom} value={zoom}>
//                       {zoom}%
//                     </option>
//                   ))}
//                   <option value={Math.round(zoomLevel * 100)}>
//                     {Math.round(zoomLevel * 100)}%
//                   </option>
//                 </select>
//               </div>

//               {/* Performance Indicator */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2 text-green-600">
//                     <Zap className="h-4 w-4" />
//                     <span className="text-xs font-medium">60fps</span>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Canvas performance: Excellent</p>
//                 </TooltipContent>
//               </Tooltip>

//               {/* Current Time */}
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="flex items-center gap-2 text-gray-600">
//                     <Clock className="h-4 w-4" />
//                     <span className="text-xs font-mono">
//                       {formatTime(currentTime)}
//                     </span>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Current time</p>
//                 </TooltipContent>
//               </Tooltip>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </TooltipProvider>
//   );
// }