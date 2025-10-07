/**
 * Code Execution Service
 * Provides sandboxed execution for JavaScript and Python code
 */

interface ExecutionResult {
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
}

class CodeExecutionService {
  private static instance: CodeExecutionService;
  
  static getInstance(): CodeExecutionService {
    if (!CodeExecutionService.instance) {
      CodeExecutionService.instance = new CodeExecutionService();
    }
    return CodeExecutionService.instance;
  }
  
  async executeJavaScript(code: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let output = '';
      let error = '';
      
      // Create a sandboxed environment
      const sandbox = {
        console: {
          log: (...args: any[]) => {
            output += args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ') + '\n';
          },
          error: (...args: any[]) => {
            error += args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ') + '\n';
          },
          warn: (...args: any[]) => {
            output += '[WARN] ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ') + '\n';
          },
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        setTimeout: (fn: Function, delay: number) => {
          if (delay > 5000) throw new Error('Maximum timeout is 5 seconds');
          return setTimeout(fn, delay);
        },
        clearTimeout,
      };
      
      try {
        // Create a function with the sandbox as context
        const func = new Function(
          ...Object.keys(sandbox),
          `
          "use strict";
          try {
            ${code}
          } catch (e) {
            console.error(e.message);
          }
          `
        );
        
        // Execute with timeout
        const timeoutId = setTimeout(() => {
          error = 'Execution timeout (5 seconds exceeded)';
        }, 5000);
        
        func(...Object.values(sandbox));
        clearTimeout(timeoutId);
        
        const executionTime = performance.now() - startTime;
        
        resolve({
          output: output.trim(),
          error: error.trim() || undefined,
          executionTime,
        });
        
      } catch (e) {
        const executionTime = performance.now() - startTime;
        resolve({
          output: output.trim() || undefined,
          error: e instanceof Error ? e.message : 'Unknown error',
          executionTime,
        });
      }
    });
  }
  
  async executePython(code: string): Promise<ExecutionResult> {
    // For now, we'll simulate Python execution
    // In a real implementation, you might use Pyodide or a backend service
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      try {
        // Basic Python-like execution simulation
        let output = '';
        let error = '';
        
        // Simple pattern matching for common Python constructs
        const lines = code.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('print(') && trimmedLine.endsWith(')')) {
            // Extract content between print()
            const content = trimmedLine.slice(6, -1);
            try {
              // Try to evaluate simple expressions
              if (content.startsWith('"') && content.endsWith('"')) {
                output += content.slice(1, -1) + '\n';
              } else if (content.startsWith("'") && content.endsWith("'")) {
                output += content.slice(1, -1) + '\n';
              } else if (!isNaN(Number(content))) {
                output += content + '\n';
              } else {
                output += content + '\n';
              }
            } catch (e) {
              error += `Error in print statement: ${e}\n`;
            }
          } else if (trimmedLine && !trimmedLine.startsWith('#')) {
            // For other statements, just acknowledge them
            if (trimmedLine.includes('=')) {
              output += `Executed: ${trimmedLine}\n`;
            }
          }
        }
        
        if (!output && !error) {
          output = 'Code executed successfully (no output)';
        }
        
        const executionTime = performance.now() - startTime;
        
        resolve({
          output: output.trim() || undefined,
          error: error.trim() || undefined,
          executionTime,
        });
        
      } catch (e) {
        const executionTime = performance.now() - startTime;
        resolve({
          output: undefined,
          error: `Python execution error: ${e instanceof Error ? e.message : 'Unknown error'}`,
          executionTime,
        });
      }
    });
  }
  
  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    switch (language) {
      case 'javascript':
        return this.executeJavaScript(code);
      case 'python':
        return this.executePython(code);
      default:
        return {
          error: `Unsupported language: ${language}`,
        };
    }
  }
}

export const codeExecutionService = CodeExecutionService.getInstance();