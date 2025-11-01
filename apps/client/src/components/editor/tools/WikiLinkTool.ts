/**
 * Wiki Link Tool for EditorJS
 * Handles [[Link]] syntax with autocomplete
 */

import { API, InlineTool, InlineToolConstructorOptions, OutputData } from '@editorjs/editorjs';

interface WikiLinkConfig {
  onGetNotes?: () => Array<{ id: string; name: string; note_uid?: string }>;
  onCreateNote?: (name: string) => void;
  // noteId may be API numeric id or the server-generated note_uid
  onNavigateToNote?: (name: string, noteId?: string | null, noteUid?: string | null) => void;
  onSaveCurrentNote?: () => Promise<void>; // New callback to save current note
  onWikiLinkCreated?: (data: OutputData) => Promise<void>;
}

export class WikiLinkTool implements InlineTool {
  private api: API;
  private config: WikiLinkConfig;
  private button: HTMLElement | null = null;
  private tag: string = 'WIKI-LINK';
  
  static get isInline() {
    return true;
  }
  
  static get sanitize() {
    return {
      'wiki-link': {
        'data-note-name': true,
        'data-note-uid': true,
        class: true
      }
    };
  }
  
  constructor({ api, config }: InlineToolConstructorOptions) {
    this.api = api;
    this.config = config || {};
  }
  
  render(): HTMLElement {
    this.button = document.createElement('button');
    const buttonEl = this.button as HTMLButtonElement;
    buttonEl.type = 'button';
    
    // Check if we're in unlink mode (selection contains a wiki link)
    const selection = window.getSelection();
    if (selection && this.checkState(selection)) {
      // Show unlink button
      buttonEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13v-2a4 4 0 0 1 4-4h3"></path>
          <path d="M14 11v2a4 4 0 0 1-4 4H7"></path>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      buttonEl.title = 'Unlink';
    } else {
      // Show link button
      buttonEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13v-2a4 4 0 0 1 4-4h3"></path>
          <path d="M14 11v2a4 4 0 0 1-4 4H7"></path>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      `;
      buttonEl.title = 'Wiki Link';
    }
    
    buttonEl.className = 'wiki-link-tool-btn';
    
    // Setup event delegation when the tool is rendered
    this.setupEventDelegation();
    
    return buttonEl;
  }
  
  async surround(range: Range): Promise<void> {
    // Check if we're unlinking an existing wiki link
    const selection = window.getSelection();
    if (selection && this.checkState(selection)) {
      // Unlink mode - remove the wiki link
      this.unwrap(range);
      return;
    }
    
    // Link mode - create new wiki link
    const selectedText = range.extractContents().textContent || '';
    const wikiLink = this.createWikiLink(selectedText || 'Link Text');
    range.insertNode(wikiLink);
    
    console.log('[WikiLinkTool] Created WikiLink');
    
    // Trigger a change event to ensure EditorJS detects the modification
    const changeEvent = new Event('input', { bubbles: true });
    wikiLink.dispatchEvent(changeEvent);
    
    // Also try to trigger EditorJS onChange manually
    if (this.api && (this as any).api.blocks) {
      setTimeout(() => {
        const blocks = (this.api as any).blocks;
        if (blocks && blocks.getBlockByIndex) {
          console.log('[WikiLinkTool] Manually triggering EditorJS change detection');
          // Force EditorJS to detect changes
          document.dispatchEvent(new Event('editorjs-change'));
        }
      }, 50);
    }
    
    // Save immediately after creating the wiki link
    if (this.config.onWikiLinkCreated) {
      setTimeout(async () => {
        try {
          // Get the fresh data from the editor
          const savedData = await this.api.saver.save();
          
          console.log('[WikiLinkTool] Calling onWikiLinkCreated to persist content (awaiting)');
          await this.config.onWikiLinkCreated(savedData);
          console.log('[WikiLinkTool] onWikiLinkCreated completed - content saved');
        } catch (err) {
          console.error('[WikiLinkTool] onWikiLinkCreated failed:', err);
        }
      }, 100);
    }
    
    // Select the link text for editing
    const textNode = wikiLink.firstChild;
    if (textNode) {
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }


  }
  
  checkState(selection: Selection): boolean {
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return false;
    
    const element = anchorNode.nodeType === Node.TEXT_NODE 
      ? anchorNode.parentElement 
      : anchorNode as Element;
      
    return element?.closest?.('wiki-link') !== null;
  }

  unwrap(range: Range): void {
    const anchorNode = range.startContainer;
    const element = anchorNode.nodeType === Node.TEXT_NODE 
      ? anchorNode.parentElement 
      : anchorNode as Element;
    
    const wikiLink = element?.closest('wiki-link');
    if (wikiLink) {
      const text = wikiLink.getAttribute('data-note-name') || wikiLink.textContent || '';
      const cleanText = text.replace(/^\[\[|\]\]$/g, '');
      const textNode = document.createTextNode(cleanText);
      wikiLink.parentNode?.replaceChild(textNode, wikiLink);
      
      // Update selection to the text node
      range.selectNodeContents(textNode);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  
  private createWikiLink(text: string): HTMLElement {
    const link = document.createElement('wiki-link');
    link.className = 'wiki-link inline-block px-1 py-0.5 mx-0.5 bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200 transition-colors';
    link.setAttribute('data-note-name', text);
    link.setAttribute('data-note-id', ''); // Will be set when note is created/found
    link.setAttribute('data-note-uid', ''); // Will be set when note is created/found
    link.textContent = `[[${text}]]`;
    link.contentEditable = 'false';
    
    // Try to find existing note and set ID and UID immediately
    if (this.config.onGetNotes) {
      const notes = this.config.onGetNotes();
      const existingNote = notes.find(note => note.name === text);
      if (existingNote) {
        link.setAttribute('data-note-id', existingNote.id);
        if (existingNote.note_uid) {
          link.setAttribute('data-note-uid', existingNote.note_uid);
        }
      }
    }
    // Log when a new wiki link element is created for debugging
    try {
      const existingId = link.getAttribute('data-note-id') || '';
      const existingUid = link.getAttribute('data-note-uid') || '';
      console.log(`[WikiLinkTool] createWikiLink -> created wiki-link for "${text}" (data-note-id=${existingId}, data-note-uid=${existingUid})`);
    } catch (err) {
      // swallow logging errors
      console.warn('[WikiLinkTool] createWikiLink logging failed', err);
    }
    
    // Set up event delegation for click handling
    // this.setupEventDelegation();
    
    return link;
  }

  private setupEventDelegation(): void {
    // Only set up once per tool instance
    if ((this as any).__eventDelegationSetup) return;
    (this as any).__eventDelegationSetup = true;
    
    // Use event delegation on document to handle all wiki-link clicks
    const handleWikiLinkClick = async (e: Event) => {
      const target = e.target as HTMLElement;
      const wikiLink = target.closest('wiki-link');
      
      if (wikiLink) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const noteId = wikiLink.getAttribute('data-note-id') || '';
        const noteUid = wikiLink.getAttribute('data-note-uid') || '';
        const noteName = wikiLink.getAttribute('data-note-name') || wikiLink.textContent?.replace(/^\[\[|\]\]$/g, '') || '';

        // Auto-save current note before navigation if callback provided
        if (this.config.onSaveCurrentNote) {
          try {
            await this.config.onSaveCurrentNote();
            console.log('[WikiLinkTool] Auto-saved current note before navigation');
          } catch (error) {
            console.error('[WikiLinkTool] Failed to save current note before navigation:', error);
            // Continue with navigation even if save fails
          }
        }

        if (this.config.onNavigateToNote) {
          // Pass name, numeric id (if any), and canonical note_uid (if any)
          this.config.onNavigateToNote(noteName, noteId || undefined, noteUid || undefined);
        }
      }
    };
    
    // Add multiple event listeners to ensure we catch the click
    document.addEventListener('click', handleWikiLinkClick, true); // Capture phase
    document.addEventListener('click', handleWikiLinkClick, false); // Bubble phase
    
    // Handle input events for editing
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      const wikiLink = target.closest('wiki-link');
      
      if (wikiLink) {
        const content = wikiLink.textContent || '';
        const match = content.match(/\[\[([^\]]+)\]\]/);
        if (match) {
          const newNoteName = match[1];
          wikiLink.setAttribute('data-note-name', newNoteName);
          
          // If the note name changed, clear the existing note_uid and note_id
          // since this might now refer to a different note
          wikiLink.setAttribute('data-note-uid', '');
          wikiLink.setAttribute('data-note-id', '');
          
          // Try to find existing note with the new name and update IDs
          if (this.config.onGetNotes) {
            const notes = this.config.onGetNotes();
            const existingNote = notes.find(note => note.name === newNoteName);
            if (existingNote) {
              wikiLink.setAttribute('data-note-id', existingNote.id);
              if (existingNote.note_uid) {
                wikiLink.setAttribute('data-note-uid', existingNote.note_uid);
              }
            }
          }
        }
      }
    });

    // Update button state when selection changes
    document.addEventListener('selectionchange', () => {
      if (this.button) {
        const selection = window.getSelection();
        const buttonEl = this.button as HTMLButtonElement;
        
        if (selection && this.checkState(selection)) {
          // Show unlink button
          buttonEl.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13v-2a4 4 0 0 1 4-4h3"></path>
              <path d="M14 11v2a4 4 0 0 1-4 4H7"></path>
              <line x1="8" y1="12" x2="16" y2="12"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          `;
          buttonEl.title = 'Unlink';
        } else {
          // Show link button
          buttonEl.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13v-2a4 4 0 0 1 4-4h3"></path>
              <path d="M14 11v2a4 4 0 0 1-4 4H7"></path>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          `;
          buttonEl.title = 'Wiki Link';
        }
      }
    });
  }
  
  private showAutocomplete(linkElement: HTMLElement) {
    if (!this.config.onGetNotes) return;
    
    const notes = this.config.onGetNotes();
    if (notes.length === 0) return;
    
    // Create autocomplete dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute z-50 w-64 max-h-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    
    notes.forEach(note => {
      const item = document.createElement('div');
      item.className = 'px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm';
      item.textContent = note.name;
      
      item.addEventListener('click', () => {
        linkElement.textContent = `[[${note.name}]]`;
        linkElement.setAttribute('data-note-name', note.name);
        dropdown.remove();
      });
      
      dropdown.appendChild(item);
    });
    
    // Position dropdown
    const rect = linkElement.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    
    document.body.appendChild(dropdown);
    
    // Remove dropdown when clicking outside
    const removeDropdown = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node) && !linkElement.contains(e.target as Node)) {
        dropdown.remove();
        document.removeEventListener('click', removeDropdown);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeDropdown);
    }, 0);
  }
}

export default WikiLinkTool;