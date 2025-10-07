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
import '../../styles/editorjs-custom.css';

interface EditorJSEditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  alignLeft?: boolean;
  noBorder?: boolean;
  onImageError?: (msg: string) => void;
  /** When true the editor will expand to fill its parent (useful for full-screen layouts) */
  fullHeight?: boolean;
  /** Optional width for the editor holder. Pass a string (e.g. '800px' or '70%') or a number (pixels). If omitted, defaults to current behavior. */
  width?: string | number;
}

export function EditorJSEditor({ 
  data, 
  onChange, 
  placeholder = "Start writing...",
  readOnly = false,
  alignLeft = false,
  noBorder = false,
  onImageError,
  fullHeight = false,
  width,
}: EditorJSEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  // Store latest props in a ref to avoid recreating the editor when props change
  const propsRef = useRef({ data, onChange, placeholder, readOnly, onImageError });

  const initializeEditor = useCallback(() => {
    if (!holderRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      // Use the values from propsRef so we don't recreate editor when parent passes new props
      readOnly: propsRef.current.readOnly,
      placeholder: propsRef.current.placeholder,
      data: propsRef.current.data || { blocks: [] },
      tools: {
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
            endpoints: {
              byFile: '/api/upload',
              byUrl: '/api/fetchUrl',
            },
            captionPlaceholder: 'Add a caption',
            onUploadError: (err: any) => {
              if (propsRef.current.onImageError) {
                propsRef.current.onImageError('Couldn’t upload image. Please try another.');
              }
            },
          }
        },
      },
      onChange: async () => {
        // Use the onChange from propsRef so we don't cause re-renders that recreate editor
        if (propsRef.current.onChange && editorRef.current) {
          try {
            const outputData = await editorRef.current.save();
            propsRef.current.onChange(outputData);
          } catch (error) {
            console.error('Editor.js save error:', error);
          }
        }
      },
    });

    editorRef.current = editor;
  }, []);

  // Keep propsRef up to date when props change (but don't recreate editor)
  useEffect(() => {
    propsRef.current = { data, onChange, placeholder, readOnly, onImageError };
  }, [data, onChange, placeholder, readOnly, onImageError]);

  // Initialize editor only once on mount to avoid losing focus/caret when parent updates data
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

  return (
    <div
      className={`editor-js-container ${alignLeft ? 'editorjs-toolbar-left' : ''}`}
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
          overflow: fullHeight ? 'auto' : undefined,
        }}
        tabIndex={0}
      />
    </div>
  );
}