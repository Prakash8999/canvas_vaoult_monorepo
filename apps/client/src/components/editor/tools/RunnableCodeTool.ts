/**
 * Runnable Code Block Tool for EditorJS
 * Supports JavaScript and Python execution in sandboxed environment
 */

import { API, BlockTool, BlockToolConstructorOptions, BlockToolData } from '@editorjs/editorjs';

interface RunnableCodeData extends BlockToolData {
  code: string;
  language: 'javascript' | 'python';
  output?: string;
  error?: string;
  isRunning?: boolean;
  lastRun?: number;
}

interface RunnableCodeConfig {
  placeholder?: string;
  onExecute?: (code: string, language: string) => Promise<{ output?: string; error?: string }>;
}

export class RunnableCodeTool implements BlockTool {
  private api: API;
  private config: RunnableCodeConfig;
  private data: RunnableCodeData;
  private wrapper: HTMLElement | null = null;
  private codeEditor: HTMLTextAreaElement | null = null;
  private outputArea: HTMLElement | null = null;
  
  static get toolbox() {
    return {
      title: 'Runnable Code',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16,18 22,12 16,6"></polyline>
        <polyline points="8,6 2,12 8,18"></polyline>
      </svg>`,
    };
  }
  
  static get sanitize() {
    return {
      code: false,
      language: false,
      output: false,
      error: false,
    };
  }
  
  constructor({ data, config, api }: BlockToolConstructorOptions) {
    this.api = api;
    this.config = config || {};
    this.data = data as RunnableCodeData || {
      code: '',
      language: 'javascript',
      output: '',
      error: '',
      isRunning: false,
    };
  }
  
  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'runnable-code-block border border-gray-200 rounded-lg overflow-hidden bg-gray-50';
    
    // Header with language selector and run button
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200';
    
    const languageSelect = document.createElement('select');
    languageSelect.className = 'text-sm border border-gray-300 rounded px-2 py-1';
    languageSelect.innerHTML = `
      <option value="javascript" ${this.data.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
      <option value="python" ${this.data.language === 'python' ? 'selected' : ''}>Python</option>
    `;
    
    languageSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.data.language = target.value as 'javascript' | 'python';
      this.updateCodeEditorLanguage();
    });
    
    const runButton = document.createElement('button');
    runButton.className = 'flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50';
    runButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5,3 19,12 5,21"></polygon>
      </svg>
      Run
    `;
    
    runButton.addEventListener('click', () => this.executeCode());
    
    header.appendChild(languageSelect);
    header.appendChild(runButton);
    
    // Code editor area
    const editorContainer = document.createElement('div');
    editorContainer.className = 'relative';
    
    this.codeEditor = document.createElement('textarea');
    this.codeEditor.className = 'w-full h-32 p-4 font-mono text-sm bg-white border-none resize-y focus:outline-none';
    this.codeEditor.placeholder = this.config.placeholder || 'Enter your code here...';
    this.codeEditor.value = this.data.code || '';
    this.codeEditor.spellcheck = false;
    
    this.codeEditor.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.code = target.value;
    });
    
    editorContainer.appendChild(this.codeEditor);
    
    // Output area
    this.outputArea = document.createElement('div');
    this.outputArea.className = 'hidden border-t border-gray-200 bg-black text-green-400 p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto';
    
    this.wrapper.appendChild(header);
    this.wrapper.appendChild(editorContainer);
    this.wrapper.appendChild(this.outputArea);
    
    // Show output if exists
    if (this.data.output || this.data.error) {
      this.displayOutput(this.data.output || '', this.data.error || '');
    }
    
    return this.wrapper;
  }
  
  private updateCodeEditorLanguage() {
    if (!this.codeEditor) return;
    
    // Update placeholder based on language
    const placeholders = {
      javascript: 'console.log("Hello, JavaScript!");',
      python: 'print("Hello, Python!")',
    };
    
    this.codeEditor.placeholder = placeholders[this.data.language] || 'Enter your code here...';
  }
  
  private async executeCode() {
    if (!this.config.onExecute || !this.data.code.trim()) return;
    
    this.data.isRunning = true;
    this.updateRunButton(true);
    
    try {
      const result = await this.config.onExecute(this.data.code, this.data.language);
      this.data.output = result.output || '';
      this.data.error = result.error || '';
      this.data.lastRun = Date.now();
      
      this.displayOutput(this.data.output, this.data.error);
    } catch (error) {
      this.data.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.data.output = '';
      this.displayOutput('', this.data.error);
    } finally {
      this.data.isRunning = false;
      this.updateRunButton(false);
    }
  }
  
  private updateRunButton(isRunning: boolean) {
    const runButton = this.wrapper?.querySelector('button');
    if (!runButton) return;
    
    runButton.disabled = isRunning;
    runButton.innerHTML = isRunning 
      ? `
        <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        Running...
      `
      : `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
        Run
      `;
  }
  
  private displayOutput(output: string, error: string) {
    if (!this.outputArea) return;
    
    if (!output && !error) {
      this.outputArea.classList.add('hidden');
      return;
    }
    
    this.outputArea.classList.remove('hidden');
    
    if (error) {
      this.outputArea.className = 'border-t border-gray-200 bg-red-900 text-red-200 p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto';
      this.outputArea.textContent = `Error: ${error}`;
    } else {
      this.outputArea.className = 'border-t border-gray-200 bg-black text-green-400 p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto';
      this.outputArea.textContent = output || '(no output)';
    }
  }
  
  save(): RunnableCodeData {
    return {
      code: this.data.code,
      language: this.data.language,
      output: this.data.output,
      error: this.data.error,
      lastRun: this.data.lastRun,
    };
  }
  
  validate(savedData: RunnableCodeData): boolean {
    return savedData.code !== undefined;
  }
}

export default RunnableCodeTool;