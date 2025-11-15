import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
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
import { notesApi, convertApiNoteToLocal } from '@/lib/api/notesApi';
import '../../styles/editorjs-custom.css';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export interface EnhancedEditorJSRef {
  saveWithWikiLinkUpdate: () => Promise<void>;
  handleNavigateToNote: (noteName: string, noteId?: string | null, noteUid?: string | null) => Promise<void>;
}

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
  onNavigateToNote?: (noteId: string) => Promise<void>; // New prop for navigation
  onSaveCurrentNote?: () => Promise<void>; // New prop for auto-save callback
  onWikiLinkCreated?: (data: OutputData) => Promise<void>;
  onSearchNotes?: (query: string) => Promise<any[]>; // New prop for searching notes
  onShowSearchResults?: (results: any[], wikiLinkName: string, wikiLinkElement: HTMLElement) => void; // Show search popup
}

export const EnhancedEditorJS = forwardRef<EnhancedEditorJSRef, EnhancedEditorJSProps>(function EnhancedEditorJS({ 
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
  onSaveCurrentNote,
  onWikiLinkCreated,
  onSearchNotes,
  onShowSearchResults,
}: EnhancedEditorJSProps, ref) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const isSavingWikiLinkRef = useRef<boolean>(false);
  const creatingWikiLinksRef = useRef<Set<string>>(new Set());
  
  const { 
    notes, 
    currentNoteId,
    setCurrentNote, 
    mode: storeMode,
    setMode
  } = useEnhancedNoteStore();
  const { createNote } = useNoteMutations();
  
  // Store latest props in a ref to avoid recreating the editor when props change
  const propsRef = useRef({ data, onChange, placeholder, readOnly, onImageError, onWikiLinkCreated, onSearchNotes, onShowSearchResults });
  
  // Update propsRef when props change
  useEffect(() => {
    propsRef.current = { data, onChange, placeholder, readOnly, onImageError, onWikiLinkCreated, onSearchNotes, onShowSearchResults };
  }, [data, onChange, placeholder, readOnly, onImageError, onWikiLinkCreated, onSearchNotes, onShowSearchResults]);
  

  
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
      // if (e.ctrlKey && e.key === 'f') {
      //   e.preventDefault();
      //   showSearch();
      // }
      
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
      note_uid: (note as any).note_uid, // Include note_uid for WikiLink matching
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
    let updatedCount = 0;
    
    wikiLinks.forEach(link => {
      const noteName = link.getAttribute('data-note-name');
      const existingNoteId = link.getAttribute('data-note-id');
      
      // Only update if the link doesn't already have a valid ID
      if (noteName && (!existingNoteId || existingNoteId.trim() === '' || !notes[existingNoteId])) {
        const existingNote = Object.values(notes).find(note => note.name === noteName);
        if (existingNote && existingNote.id !== existingNoteId) {
          link.setAttribute('data-note-id', existingNote.id);
          updatedCount++;
        }
      }
    });
    
    if (updatedCount > 0) {
      console.log(`[WikiLink] Updated ${updatedCount} WikiLink IDs`);
    }
  }, [notes]);

  // Helper function to disable WikiLink during creation
  const disableWikiLink = useCallback((noteName: string, specificElement?: HTMLElement) => {
    if (specificElement) {
      // Disable only the specific clicked element
      specificElement.style.pointerEvents = 'none';
      specificElement.style.opacity = '0.5';
      specificElement.style.cursor = 'not-allowed';
      specificElement.style.backgroundColor = '#f3f4f6';
      specificElement.style.borderRadius = '4px';
      specificElement.style.padding = '2px 4px';
      specificElement.style.transition = 'all 0.2s ease';
      specificElement.setAttribute('data-creating', 'true');
      specificElement.setAttribute('title', 'Creating note...');
      console.log(`[WikiLink] Disabled specific WikiLink for: ${noteName}`);
    } else {
      // Fallback: disable all elements with the same name (old behavior)
      const wikiLinks = document.querySelectorAll(`wiki-link[data-note-name="${noteName}"]`);
      wikiLinks.forEach(link => {
        (link as HTMLElement).style.pointerEvents = 'none';
        (link as HTMLElement).style.opacity = '0.5';
        (link as HTMLElement).style.cursor = 'not-allowed';
        (link as HTMLElement).style.backgroundColor = '#f3f4f6';
        (link as HTMLElement).style.borderRadius = '4px';
        (link as HTMLElement).style.padding = '2px 4px';
        (link as HTMLElement).style.transition = 'all 0.2s ease';
        link.setAttribute('data-creating', 'true');
        link.setAttribute('title', 'Creating note...');
      });
      console.log(`[WikiLink] Disabled all WikiLinks for: ${noteName}`);
    }
    creatingWikiLinksRef.current.add(noteName);
  }, []);

  // Helper function to enable WikiLink after creation
  const enableWikiLink = useCallback((noteName: string, specificElement?: HTMLElement) => {
    if (specificElement) {
      // Enable only the specific element
      specificElement.style.pointerEvents = '';
      specificElement.style.opacity = '';
      specificElement.style.cursor = '';
      specificElement.style.backgroundColor = '';
      specificElement.style.borderRadius = '';
      specificElement.style.padding = '';
      specificElement.style.transition = '';
      specificElement.removeAttribute('data-creating');
      specificElement.removeAttribute('title');
      console.log(`[WikiLink] Enabled specific WikiLink for: ${noteName}`);
    } else {
      // Fallback: enable all elements with the same name (old behavior)
      const wikiLinks = document.querySelectorAll(`wiki-link[data-note-name="${noteName}"]`);
      wikiLinks.forEach(link => {
        (link as HTMLElement).style.pointerEvents = '';
        (link as HTMLElement).style.opacity = '';
        (link as HTMLElement).style.cursor = '';
        (link as HTMLElement).style.backgroundColor = '';
        (link as HTMLElement).style.borderRadius = '';
        (link as HTMLElement).style.padding = '';
        (link as HTMLElement).style.transition = '';
        link.removeAttribute('data-creating');
        link.removeAttribute('title');
      });
      console.log(`[WikiLink] Enabled all WikiLinks for: ${noteName}`);
    }
    creatingWikiLinksRef.current.delete(noteName);
  }, []);
  
  // Store reference to the currently clicked WikiLink element
  const clickedWikiLinkRef = useRef<HTMLElement | null>(null);

  const handleNavigateToNote = useCallback(async (noteName: string, noteId?: string | null, noteUid?: string | null, clickedElement?: HTMLElement) => {
    // Store the clicked element reference for later use
    clickedWikiLinkRef.current = clickedElement || null;
    
    if (clickedElement) {
      console.log('[WikiLink] Stored reference to clicked element:', {
        noteName,
        elementText: clickedElement.textContent,
        noteId: clickedElement.getAttribute('data-note-id'),
        noteUid: clickedElement.getAttribute('data-note-uid')
      });
    }
    const freshNotes = useEnhancedNoteStore.getState().notes;

    // Prefer note_uid navigation when available in the wiki link
    if (noteUid && noteUid.trim() !== '') {
      // Find local note by note_uid
      const existingByUid = Object.values(freshNotes).find(n => (n as any).note_uid === noteUid || (n as any).note_uid === String(noteUid));
      if (existingByUid) {
        const targetId = existingByUid.id;
        // Update any wiki-link elements with the id and uid for consistency
        updateAllWikiLinkIds();
        const wikiUidLinks = document.querySelectorAll(`wiki-link[data-note-uid="${noteUid}"]`);
        wikiUidLinks.forEach(link => {
          link.setAttribute('data-note-id', targetId);
          link.setAttribute('data-note-uid', noteUid as string);
        });

        // Prefer navigating by note_uid (routes expect it); fall back to numeric id
        const routeId = (existingByUid as any).note_uid || targetId;
        if (onNavigateToNote) {
          onNavigateToNote(routeId);
        } else {
          setCurrentNote(targetId);
        }
        return;
      }

      // If note_uid was present but not in local store, check if it exists on server
      try {
        const noteExists = await notesApi.checkNoteExists(noteUid);
        if (noteExists) {
          console.log(`[WikiLink] Note with uid ${noteUid} exists on server, navigating`);
          // Navigate to existing note
          if (onNavigateToNote) {
            onNavigateToNote(noteUid);
          } else {
            // For embedded mode, we might need to fetch the note first
            try {
              const serverNote = await notesApi.getNote(noteUid);
              const localNote = convertApiNoteToLocal(serverNote);
              setCurrentNote(localNote.id);
            } catch (fetchError) {
              console.error('Failed to fetch existing note:', fetchError);
            }
          }
          return;
        } else {
          console.log(`[WikiLink] Note with uid ${noteUid} does not exist on server`);
          // Clear the stale note_uid from wiki-link elements since it doesn't exist
          const wikiLinks = document.querySelectorAll(`wiki-link[data-note-uid="${noteUid}"]`);
          wikiLinks.forEach(link => {
            link.setAttribute('data-note-uid', '');
            link.setAttribute('data-note-id', '');
          });
        }
      } catch (error) {
        console.error('Error checking note existence:', error);
        // On error, clear stale data and proceed with creation
        const wikiLinks = document.querySelectorAll(`wiki-link[data-note-uid="${noteUid}"]`);
        wikiLinks.forEach(link => {
          link.setAttribute('data-note-uid', '');
          link.setAttribute('data-note-id', '');
        });
      }
    }

    // If numeric id provided and exists in store, navigate
    if (noteId && noteId.trim() !== '' && freshNotes[noteId]) {
      const local = freshNotes[noteId];
      const routeId = (local as any).note_uid || noteId;
      if (onNavigateToNote) {
        onNavigateToNote(routeId);
      } else {
        setCurrentNote(noteId);
      }
      return;
    }

    // If an existing note by name is found, prefer it
    const existingNote = Object.values(freshNotes).find(note => note.name === noteName);
    if (existingNote) {
      // If API exposes note_uid, add it to wiki-link elements
      if ((existingNote as any).note_uid) {
        const uid = (existingNote as any).note_uid;
        const wikiLinks = document.querySelectorAll(`wiki-link[data-note-name="${noteName}"]`);
        wikiLinks.forEach(link => {
          link.setAttribute('data-note-id', existingNote.id);
          link.setAttribute('data-note-uid', uid);
        });
        const routeId = uid || existingNote.id;
        if (onNavigateToNote) {
          onNavigateToNote(routeId);
        } else {
          setCurrentNote(existingNote.id);
        }
      } else {
        updateWikiLinksWithId(noteName, existingNote.id);
        if (onNavigateToNote) {
          onNavigateToNote(existingNote.id);
        } else {
          setCurrentNote(existingNote.id);
        }
      }
      return;
    }

    // No existing note: create one. Before creating, save current editor content to persist
    // the WikiLink that was just clicked (so the new note_uid can be saved to current content)
    console.log(`[WikiLink] Creating new note: ${noteName}`);
    
    // Disable the WikiLink during creation to prevent multiple clicks
    disableWikiLink(noteName, clickedWikiLinkRef.current || undefined);
    
    try {
      const isFirstNote = Object.keys(freshNotes).length === 0;
    // let newApiNote;
    // if (isFirstNote) {
    //   newApiNote = await createNote({
    //     name: noteName,
    //     content: {
    //       blocks: [
    //         {
    //           type: 'paragraph',
    //           data: {
    //             text: 'Welcome to your enhanced note editor! Here are some features to get you started:'
    //           }
    //         },
    //         {
    //           type: 'list',
    //           data: {
    //             style: 'unordered',
    //             items: [
    //               'Create links between notes using [[Note Name]] syntax',
    //               'Add tags to organize your notes with #hashtag',
    //               'Use the graph view to visualize connections',
    //               'Run JavaScript and Python code in runnable blocks',
    //               'Create charts from your data',
    //               'Pin important notes for quick access'
    //             ]
    //           }
    //         },
    //         {
    //           type: 'paragraph',
    //           data: {
    //             text: 'Try creating a link to a new note: [[My First Note]] - click it to create and navigate!'
    //           }
    //         }
    //       ]
    //     }
    //   });
    // } else {
    //   newApiNote = await createNote({ name: noteName });
    // }


const newNotePayload: any = {
      name: noteName,
      is_wiki_link: true,
      parent_note_id: currentNoteId || null // currentNoteId IS the parent!
    };

    // 2. Add welcome content only if it's the very first note
    if (isFirstNote) {
      newNotePayload.content = {
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
      };
    }

    // 3. Call createNote with the new payload
    const newApiNote = await createNote(newNotePayload);




  // Normalize returned identifiers
  const newNoteId = newApiNote.id?.toString?.() || newApiNote.id + '';
  const newNoteUid = (newApiNote as any).note_uid || '';

  // Log the full API response for debugging and the generated note_uid
  console.log('[WikiLink] createNote response:', newApiNote);
  console.log(`[WikiLink] Created note with ID: ${newNoteId}, UID: ${newNoteUid}`);

    // Update only the specific clicked wiki-link element, not all elements with the same name
    let updatedCount = 0;
    const clickedLink = clickedWikiLinkRef.current;
    
    if (clickedLink) {
      // Update only the clicked element
      const oldNoteId = clickedLink.getAttribute('data-note-id');
      const oldNoteUid = clickedLink.getAttribute('data-note-uid');
      
      if (newNoteId) clickedLink.setAttribute('data-note-id', newNoteId);
      if (newNoteUid) clickedLink.setAttribute('data-note-uid', newNoteUid);
      updatedCount = 1;
      
      console.log(`[WikiLink] Updated the specific clicked WikiLink element:`, {
        noteName,
        elementText: clickedLink.textContent,
        oldNoteId,
        newNoteId,
        oldNoteUid,
        newNoteUid,
        elementHTML: clickedLink.outerHTML.substring(0, 100) + '...'
      });
      
      // Clear the clicked element reference after successful update
      clickedWikiLinkRef.current = null;
    } else {
      // Fallback: if we don't have the clicked element reference, update all (old behavior)
      console.warn('[WikiLink] No clicked element reference, falling back to updating all WikiLinks with same name');
      const wikiLinksToUpdate = document.querySelectorAll(`wiki-link[data-note-name="${noteName}"]`);
      wikiLinksToUpdate.forEach((link, index) => {
        const oldNoteId = link.getAttribute('data-note-id');
        const oldNoteUid = link.getAttribute('data-note-uid');
        if (newNoteId) link.setAttribute('data-note-id', newNoteId);
        if (newNoteUid) link.setAttribute('data-note-uid', newNoteUid);
        
        console.log(`[WikiLink] Updated WikiLink ${index + 1}:`, {
          noteName,
          elementText: link.textContent,
          oldNoteId,
          newNoteId,
          oldNoteUid,
          newNoteUid
        });
      });
      updatedCount = wikiLinksToUpdate.length;
    }

    console.log(`[WikiLink] Updated ${updatedCount} WikiLink element(s) with new note_uid: ${newNoteUid}`);

    // Attempt to persist the updated wiki-link attributes by triggering editor save
    // This is critical to ensure the note_uid is saved back to the current note's content
    
    try {
      if (editorRef.current && typeof editorRef.current.save === 'function') {
        // Set flag to prevent EditorJS onChange from triggering during our save
        isSavingWikiLinkRef.current = true;
        
        const savedData = await editorRef.current.save();
        console.log('[WikiLink] Successfully saved editor content with updated note_uid');
        
        // Force immediate save through onWikiLinkCreated callback (bypasses auto-save debouncing)
        if (onWikiLinkCreated) {
          await onWikiLinkCreated(savedData);
          console.log('[WikiLink] onWikiLinkCreated completed - content saved to database');
        } else if (propsRef.current.onChange) {
          // Fallback: trigger onChange and force save
          propsRef.current.onChange(savedData);
          console.log('[WikiLink] Triggered onChange with updated content');
          
          // Force manual save through onSaveCurrentNote if available
          if (onSaveCurrentNote) {
            try {
              await onSaveCurrentNote();
              console.log('[WikiLink] Forced manual save completed');
            } catch (saveErr) {
              console.warn('[WikiLink] Manual save failed:', saveErr);
            }
          }
        }
        
        // Clear the flag after a short delay to allow any pending EditorJS onChange to complete
        setTimeout(() => {
          isSavingWikiLinkRef.current = false;
        }, 100);
      }
    } catch (err) {
      console.warn('Failed to save editor after updating wiki links with uid:', err);
      isSavingWikiLinkRef.current = false;
    }

      // Navigate to the newly created note using note_uid when possible (routes expect note_uid)
      // Prefer routing by note_uid when available
      const routeTarget = newNoteUid || newNoteId;
      if (onNavigateToNote) {
        await onNavigateToNote(routeTarget);
      } else {
        setCurrentNote(newNoteId);
      }
      
    } catch (error) {
      console.error(`[WikiLink] Failed to create note: ${noteName}`, error);
      // Re-enable the WikiLink on error
      enableWikiLink(noteName, clickedWikiLinkRef.current || undefined);
      throw error; // Re-throw to let parent handlers know about the error
    } finally {
      // Always re-enable the WikiLink after creation process (success or failure)
      // Use setTimeout to ensure navigation completes first
      setTimeout(() => {
        enableWikiLink(noteName, clickedWikiLinkRef.current || undefined);
      }, 100);
    }
  }, [setCurrentNote, createNote, onNavigateToNote, updateWikiLinksWithId, notes, editorRef, onChange, onSaveCurrentNote, disableWikiLink, enableWikiLink]);
  // console.log('localStorage', localStorage.getItem('auth_token'));
  const handleCodeExecution = useCallback(async (code: string, language: string) => {
    return await codeExecutionService.executeCode(code, language);
  }, []);
  

useEffect(() => {
    const editorHolder = holderRef.current;
    if (!editorHolder) {
      return;
    }

    // This handler will live for the entire lifecycle of the editor instance
    const handleWikiLinkClick = async (e: Event) => {
      const target = e.target as HTMLElement;
      const wikiLink = target.closest('wiki-link');

      if (wikiLink) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const noteName = wikiLink.getAttribute('data-note-name') || wikiLink.textContent?.replace(/^\[\[|\]\]$/g, '') || '';
        
        // Check if this WikiLink is already being created
        if (wikiLink.getAttribute('data-creating') === 'true' || creatingWikiLinksRef.current.has(noteName)) {
          console.log(`[WikiLink] Click ignored - already creating note: ${noteName}`);
          return;
        }

        const noteId = wikiLink.getAttribute('data-note-id') || '';
        const noteUid = wikiLink.getAttribute('data-note-uid') || '';

        // Call our internal handleNavigateToNote function which handles the complete flow
        // including note creation, saving, and navigation
        await handleNavigateToNote(noteName, noteId || null, noteUid || null);
      }
    };

    // Attach listener directly to the editor's container
    editorHolder.addEventListener('click', handleWikiLinkClick);

    // React's cleanup function removes the listener when the component
    // (and thus the editor instance) is destroyed.
    return () => {
      editorHolder.removeEventListener('click', handleWikiLinkClick);
    };
    
    // Re-run this effect if the holderRef changes or the navigation handler prop changes
  }, [holderRef.current, onNavigateToNote]);




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
          onSaveCurrentNote: onSaveCurrentNote, // Add auto-save callback
          onWikiLinkCreated: propsRef.current.onWikiLinkCreated,
          onSearchNotes: propsRef.current.onSearchNotes,
          onShowSearchResults: propsRef.current.onShowSearchResults,
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
        // Skip onChange if we're currently saving WikiLink updates to prevent double-save
        if (isSavingWikiLinkRef.current) {
          console.log('[EditorJS] Skipping onChange - currently saving WikiLink updates');
          return;
        }
        
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
        updateAllWikiLinkIds(); // Update note IDs for existing WikiLinks
      }, 500);
    });
  }, [mode, getAvailableNotes, handleNavigateToNote, handleCodeExecution, updateAllWikiLinkIds, onSaveCurrentNote]);

  // Keep propsRef up to date when props change
  useEffect(() => {
    propsRef.current = { data, onChange, placeholder, readOnly, onImageError, onWikiLinkCreated, onSearchNotes, onShowSearchResults };
  }, [data, onChange, placeholder, readOnly, onImageError, onWikiLinkCreated]);

  // Initialize editor only once on mount
  useEffect(() => {
    initializeEditor();

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      
      // Re-enable any disabled WikiLinks on cleanup
      creatingWikiLinksRef.current.forEach(noteName => {
        enableWikiLink(noteName); // Don't pass specific element for cleanup
      });
      creatingWikiLinksRef.current.clear();
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

  // Update WikiLink IDs when notes change (but not during WikiLink creation)
  useEffect(() => {
    // Skip if we're currently creating/saving WikiLinks to prevent interference
    if (isSavingWikiLinkRef.current || creatingWikiLinksRef.current.size > 0) {
      return;
    }
    
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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    saveWithWikiLinkUpdate: async () => {
      if (editorRef.current && typeof editorRef.current.save === 'function') {
        try {
          // Set flag to prevent EditorJS onChange from triggering during our save
          isSavingWikiLinkRef.current = true;
          
          const savedData = await editorRef.current.save();
          console.log('[EnhancedEditorJS] Successfully saved editor content with updated wiki-link');
          
          // Force immediate save through onWikiLinkCreated callback (bypasses auto-save debouncing)
          if (onWikiLinkCreated) {
            await onWikiLinkCreated(savedData);
            console.log('[EnhancedEditorJS] onWikiLinkCreated completed - content saved to database');
          } else {
            // Fallback: trigger onChange and force save
            propsRef.current.onChange?.(savedData);
            
            // Force manual save through onSaveCurrentNote if available
            if (onSaveCurrentNote) {
              await onSaveCurrentNote();
            }
          }
        } catch (error) {
          console.error('[EnhancedEditorJS] Failed to save with wiki-link update:', error);
          throw error;
        } finally {
          isSavingWikiLinkRef.current = false;
        }
      }
    },
    handleNavigateToNote: handleNavigateToNote
  }), [onWikiLinkCreated, onSaveCurrentNote, handleNavigateToNote]);
  
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
});