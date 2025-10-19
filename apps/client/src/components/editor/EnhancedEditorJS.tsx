import { useEffect, useRef, useCallback } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Checklist from '@editorjs/checklist';
import Code from '@editorjs/code';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';

// Custom tools
import WikiLinkTool from './tools/WikiLinkTool';
import RunnableCodeTool from './tools/RunnableCodeTool';
import ChartTool from './tools/ChartTool';

import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { codeExecutionService } from '@/services/codeExecutionService';
import { useNoteMutations } from '@/hooks/useNotes';
import '../../styles/editorjs-custom.css';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface EnhancedEditorJSProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  alignLeft?: boolean;
  noBorder?: boolean;
  onImageError?: (msg: string) => void;
  fullHeight?: boolean;
  width?: string | number;
  mode?: 'full' | 'light'; // New prop to control feature set
  onNavigateToNote?: (noteId: string) => void; // New prop for navigation
}

export function EnhancedEditorJS({ 
  data, 
  onChange, 
  placeholder = "Start writing...",
  readOnly = false,
  alignLeft = false,
  noBorder = false,
  onImageError,
  fullHeight = false,
  width,
  mode = 'full', // Default to full feature set
  onNavigateToNote,
}: EnhancedEditorJSProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  
  const { 
    notes, 
    currentNoteId,
    setCurrentNote, 
    mode: storeMode,
    setMode
  } = useEnhancedNoteStore();
  const { createNote } = useNoteMutations();
  
  // Store latest props in a ref to avoid recreating the editor when props change
  const propsRef = useRef({ data, onChange, placeholder, readOnly, onImageError });
  
  // Set the mode in the store when component mode changes
  useEffect(() => {
    if (mode !== storeMode) {
      setMode(mode);
    }
  }, [mode, storeMode, setMode]);
  
  // Handle search functionality
  const showSearch = useCallback(() => {
    if (!searchOverlayRef.current || !searchInputRef.current) return;
    
    searchOverlayRef.current.style.display = 'flex';
    searchOverlayRef.current.style.alignItems = 'start';
    searchOverlayRef.current.style.justifyContent = 'center';
    searchInputRef.current.focus();
  }, []);
  
  const hideSearch = useCallback(() => {
    if (!searchOverlayRef.current) return;
    searchOverlayRef.current.style.display = 'none';
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F for search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        showSearch();
      }
      
      // Escape to close search
      if (e.key === 'Escape') {
        hideSearch();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, hideSearch]);
  
  const getAvailableNotes = useCallback(() => {
    return Object.values(notes).map(note => ({
      id: note.id,
      name: note.name,
    }));
  }, [notes]);
  
  // Helper function to update WikiLinks with note IDs
  const updateWikiLinksWithId = useCallback((noteName: string, noteId: string) => {
    // Find all WikiLinks with this name and update their data-note-id
    const wikiLinks = document.querySelectorAll(`wiki-link[data-note-name="${noteName}"]`);
    wikiLinks.forEach(link => {
      link.setAttribute('data-note-id', noteId);
    });
  }, []);
  
  // Helper function to update all WikiLinks when editor content changes
  const updateAllWikiLinkIds = useCallback(() => {
    const wikiLinks = document.querySelectorAll('wiki-link[data-note-name]');
    
    wikiLinks.forEach(link => {
      const noteName = link.getAttribute('data-note-name');
      const existingNoteId = link.getAttribute('data-note-id');
      
      // Only update if the link doesn't already have a valid ID
      if (noteName && (!existingNoteId || existingNoteId.trim() === '' || !notes[existingNoteId])) {
        const existingNote = Object.values(notes).find(note => note.name === noteName);
        if (existingNote) {
          link.setAttribute('data-note-id', existingNote.id);
        }
      }
    });
  }, [notes]);
  
  const handleNavigateToNote = useCallback(async (noteName: string, noteId?: string | null) => {
    const freshNotes = useEnhancedNoteStore.getState().notes;
    if (noteId && noteId.trim() !== '' && freshNotes[noteId]) {
      if (onNavigateToNote) {
        onNavigateToNote(noteId);
      } else {
        setCurrentNote(noteId);
      }
      return;
    }
    if (noteId && noteId.trim() !== '' && !notes[noteId]) {
      const wikiLinks = document.querySelectorAll(`wiki-link[data-note-id="${noteId}"]`);
      wikiLinks.forEach(link => {
        link.setAttribute('data-note-id', '');
      });
    }
    const existingNote = Object.values(freshNotes).find(note => note.name === noteName);
    if (existingNote) {
      updateWikiLinksWithId(noteName, existingNote.id);
      if (onNavigateToNote) {
        onNavigateToNote(existingNote.id);
      } else {
        setCurrentNote(existingNote.id);
      }
    } else {
      const isFirstNote = Object.keys(freshNotes).length === 0;
      let newApiNote;
      if (isFirstNote) {
        newApiNote = await createNote({
          name: noteName,
          content: {
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: 'Welcome to your enhanced note editor! Here are some features to get you started:'
                }
              },
              {
                type: 'list',
                data: {
                  style: 'unordered',
                  items: [
                    'Create links between notes using [[Note Name]] syntax',
                    'Add tags to organize your notes with #hashtag',
                    'Use the graph view to visualize connections',
                    'Run JavaScript and Python code in runnable blocks',
                    'Create charts from your data',
                    'Pin important notes for quick access'
                  ]
                }
              },
              {
                type: 'paragraph',
                data: {
                  text: 'Try creating a link to a new note: [[My First Note]] - click it to create and navigate!'
                }
              }
            ]
          }
        });
      } else {
        newApiNote = await createNote({ name: noteName });
      }
      const newNoteId = newApiNote.id?.toString?.() || newApiNote.id + '';
      if (onNavigateToNote) {
        onNavigateToNote(newNoteId);
      } else {
        setCurrentNote(newNoteId);
      }
      updateWikiLinksWithId(noteName, newNoteId);
    }
  }, [setCurrentNote, createNote, onNavigateToNote, updateWikiLinksWithId, notes]);
  console.log('localStorage', localStorage.getItem('auth_token'));
  const handleCodeExecution = useCallback(async (code: string, language: string) => {
    return await codeExecutionService.executeCode(code, language);
  }, []);
  
  const initializeEditor = useCallback(() => {
    if (!holderRef.current || editorRef.current) return;

    // Configure tools based on mode
    const baseTools = {
      header: {
        class: Header,
        config: {
          levels: [1, 2, 3, 4],
          defaultLevel: 2,
        }
      },
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
      },
      list: {
        class: List,
        inlineToolbar: true,
      },
      checklist: {
        class: Checklist,
        inlineToolbar: true,
      },
      code: {
        class: Code,
        config: {
          placeholder: 'Enter code here...'
        }
      },
      quote: {
        class: Quote,
        inlineToolbar: true,
      },
      table: Table,
      image: {
        class: ImageTool,
        config: {
          uploader: {
            async uploadByFile(file) {
              const formData = new FormData();
              formData.append('file', file);
              // Get token from Zustand store
              const token = useAuthStore.getState().token;
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_BASE_URL}/api/v1/assets/upload?fileType=note`,
                  formData,
                  {
                    headers: {
                      Authorization: token ? `Bearer ${token}` : '',
                    },
                  }
                );
                const data = response.data;
                console.log('Image upload response:', data);
                return {
                  success: 1,
                  file: {
                    url: data.data.url,
                  },
                };
              } catch (error) {
                const message = error?.response?.data?.message || 'Image upload failed';
                throw new Error(message);
              }
            },
          },
          captionPlaceholder: 'Add a caption',
          onUploadError: (err: any) => {
            if (propsRef.current.onImageError) {
              propsRef.current.onImageError('Couldn\'t upload image. Please try another.');
            }
          },
        }
      },
    };
    
    // Add advanced tools only in full mode
    const advancedTools = mode === 'full' ? {
      wikiLink: {
        class: WikiLinkTool,
        config: {
          onGetNotes: getAvailableNotes,
          onNavigateToNote: handleNavigateToNote,
        }
      },
      runnableCode: {
        class: RunnableCodeTool,
        config: {
          placeholder: 'Enter your code here...',
          onExecute: handleCodeExecution,
        }
      },
      chart: {
        class: ChartTool,
        config: {
          defaultWidth: 600,
          defaultHeight: 400,
        }
      },
    } : {};
    
    const editor = new EditorJS({
      holder: holderRef.current,
      readOnly: propsRef.current.readOnly,
      placeholder: propsRef.current.placeholder,
      data: propsRef.current.data || { blocks: [] },
      tools: {
        ...baseTools,
        ...advancedTools,
      },
      onChange: async () => {
        if (propsRef.current.onChange && editorRef.current) {
          try {
            const outputData = await editorRef.current.save();
            propsRef.current.onChange(outputData);
            
            // Update WikiLink IDs after content changes
            setTimeout(() => {
              updateAllWikiLinkIds();
            }, 100);
          } catch (error) {
            console.error('Editor.js save error:', error);
          }
        }
      },
    });

    editorRef.current = editor;
    
    // Update WikiLink IDs after editor is ready
    editor.isReady.then(() => {
      setTimeout(() => {
        updateAllWikiLinkIds();
      }, 500);
    });
  }, [mode, getAvailableNotes, handleNavigateToNote, handleCodeExecution, updateAllWikiLinkIds]);

  // Keep propsRef up to date when props change
  useEffect(() => {
    propsRef.current = { data, onChange, placeholder, readOnly, onImageError };
  }, [data, onChange, placeholder, readOnly, onImageError]);

  // Initialize editor only once on mount
  useEffect(() => {
    initializeEditor();

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when data changes - recreate editor
  useEffect(() => {
    if (editorRef.current && data !== propsRef.current.data) {
      // Destroy current editor and recreate with new data
      editorRef.current.destroy();
      editorRef.current = null;
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        initializeEditor();
      }, 10);
    }
  }, [data, initializeEditor]);

  // Update WikiLink IDs when notes change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateAllWikiLinkIds();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [notes, updateAllWikiLinkIds]);

  // Force update WikiLinks when currentNoteId changes (after navigation)
  useEffect(() => {
    if (currentNoteId) {
      const timer = setTimeout(() => {
        updateAllWikiLinkIds();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [currentNoteId, updateAllWikiLinkIds]);
  
  // Handle search functionality
  const handleSearch = (query: string) => {
    if (!editorRef.current) return;
    
    // This is a basic implementation
    // In a real implementation, you'd want to highlight matches in the editor
    const element = holderRef.current;
    if (!element) return;
    
    // Remove previous highlights
    element.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
    
    if (!query.trim()) return;
    
    // Simple text highlighting (basic implementation)
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Text[] = [];
    let node;
    
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.toLowerCase().includes(query.toLowerCase())) {
        textNodes.push(node as Text);
      }
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      const regex = new RegExp(`(${query})`, 'gi');
      const highlightedHTML = text.replace(regex, '<span class="search-highlight bg-yellow-200 px-1 rounded">$1</span>');
      
      if (highlightedHTML !== text) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedHTML;
        textNode.parentNode?.replaceChild(wrapper, textNode);
      }
    });
  };

  return (
    <div className="relative">
      {/* Search Overlay - only show in full mode */}
      {mode === 'full' && (
        <div
          ref={searchOverlayRef}
          className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 pt-20"
          style={{ display: 'none' }}
          onClick={(e) => {
            if (e.target === searchOverlayRef.current) {
              hideSearch();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-4 w-96 max-w-full mx-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Search in note</span>
              <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">Esc</kbd>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Enter search terms..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  hideSearch();
                }
              }}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={hideSearch}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Editor Container */}
      <div
        className={`editor-js-container ${alignLeft ? 'editorjs-toolbar-left pl-10' : ''} ${mode === 'full' ? 'enhanced-editor' : ''}`}
        style={{
          background: '#fff',
          color: '#111',
          borderRadius: 8,
          width: '100%',
          height: fullHeight ? '100%' : undefined,
          display: fullHeight ? 'flex' : undefined,
          flexDirection: fullHeight ? 'column' : undefined,
          border: noBorder ? 'none' : '1px solid #e5e7eb',
          boxShadow: noBorder ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s, background 0.2s',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <div
          ref={holderRef}
          className="prose prose-sm max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black prose-code:text-black prose-blockquote:text-gray-700 prose-blockquote:border-l-border editorjs-holder"
          style={{
            minHeight: fullHeight ? undefined : '300px',
            flex: fullHeight ? 1 : undefined,
            minWidth: 0,
            color: '#111',
            background: '#fff',
            padding: '16px',
            borderRadius: '8px',
            width: typeof width === 'number' ? `${width}px` : (width ?? '80%'),
            outline: 'none',
            transition: 'box-shadow 0.2s, background 0.2s',
            overflow: 'auto',
            position: 'relative',
          }}
          tabIndex={0}
        />
      </div>
    </div>
  );
}