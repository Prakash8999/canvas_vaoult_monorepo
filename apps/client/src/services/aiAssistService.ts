/**
 * AI Assist Service
 * Provides AI-powered text enhancement features
 */

interface AIAssistResult {
  text: string;
  suggestions?: string[];
  error?: string;
}

interface AIAssistOptions {
  action: 'summarize' | 'rephrase' | 'flashcards' | 'expand' | 'fix-grammar';
  context?: string;
  tone?: 'formal' | 'casual' | 'academic' | 'creative';
}

class AIAssistService {
  private static instance: AIAssistService;
  
  static getInstance(): AIAssistService {
    if (!AIAssistService.instance) {
      AIAssistService.instance = new AIAssistService();
    }
    return AIAssistService.instance;
  }
  
  async processText(text: string, options: AIAssistOptions): Promise<AIAssistResult> {
    // This is a mock implementation
    // In a real app, this would connect to an AI service like OpenAI, Claude, etc.
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          let result: AIAssistResult;
          
          switch (options.action) {
            case 'summarize':
              result = this.mockSummarize(text);
              break;
            case 'rephrase':
              result = this.mockRephrase(text, options.tone);
              break;
            case 'flashcards':
              result = this.mockFlashcards(text);
              break;
            case 'expand':
              result = this.mockExpand(text);
              break;
            case 'fix-grammar':
              result = this.mockFixGrammar(text);
              break;
            default:
              result = { text, error: 'Unknown action' };
          }
          
          resolve(result);
        } catch (error) {
          resolve({
            text,
            error: error instanceof Error ? error.message : 'AI processing failed'
          });
        }
      }, 1000 + Math.random() * 2000); // Simulate API delay
    });
  }
  
  private mockSummarize(text: string): AIAssistResult {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return {
        text: "The provided text is already quite concise.",
        suggestions: [
          "The text is brief and doesn't require summarization",
          "Consider expanding the content for a more detailed summary"
        ]
      };
    }
    
    // Mock summarization - take key sentences
    const keyPoints = sentences.slice(0, Math.ceil(sentences.length / 2))
      .map(s => s.trim())
      .join('. ') + '.';
    
    return {
      text: `**Summary:** ${keyPoints}`,
      suggestions: [
        "Focus on main concepts and key takeaways",
        "Remove redundant information and examples",
        "Maintain the core message while reducing length"
      ]
    };
  }
  
  private mockRephrase(text: string, tone: string = 'formal'): AIAssistResult {
    const toneAdjustments = {
      formal: {
        replacements: [
          ['really', 'significantly'],
          ['get', 'obtain'],
          ['show', 'demonstrate'],
          ['big', 'substantial'],
          ['good', 'beneficial'],
        ],
        prefix: 'Formal version: '
      },
      casual: {
        replacements: [
          ['demonstrate', 'show'],
          ['obtain', 'get'],
          ['substantial', 'big'],
          ['beneficial', 'good'],
          ['furthermore', 'also'],
        ],
        prefix: 'Casual version: '
      },
      academic: {
        replacements: [
          ['show', 'illustrate'],
          ['get', 'acquire'],
          ['big', 'considerable'],
          ['good', 'advantageous'],
          ['also', 'furthermore'],
        ],
        prefix: 'Academic version: '
      },
      creative: {
        replacements: [
          ['show', 'reveal'],
          ['get', 'discover'],
          ['big', 'magnificent'],
          ['good', 'wonderful'],
          ['also', 'plus'],
        ],
        prefix: 'Creative version: '
      }
    };
    
    const adjustment = toneAdjustments[tone as keyof typeof toneAdjustments] || toneAdjustments.formal;
    let rephrased = text;
    
    adjustment.replacements.forEach(([from, to]) => {
      rephrased = rephrased.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
    });
    
    return {
      text: adjustment.prefix + rephrased,
      suggestions: [
        `Adjusted tone to be more ${tone}`,
        "Consider context and audience when choosing tone",
        "Review word choice and sentence structure"
      ]
    };
  }
  
  private mockFlashcards(text: string): AIAssistResult {
    const sentences = text.split(/[.!?]+/)
      .filter(s => s.trim().length > 10)
      .slice(0, 5); // Limit to 5 flashcards
    
    if (sentences.length === 0) {
      return {
        text: "Unable to generate flashcards from the provided text.",
        error: "Text too short or no clear concepts found"
      };
    }
    
    const flashcards = sentences.map((sentence, index) => {
      const words = sentence.trim().split(' ');
      const keyWord = words.find(w => w.length > 5) || words[Math.floor(words.length / 2)];
      
      return `**Card ${index + 1}:**
**Q:** What is ${keyWord}?
**A:** ${sentence.trim()}.`;
    }).join('\n\n');
    
    return {
      text: `**Generated Flashcards:**\n\n${flashcards}`,
      suggestions: [
        "Review and edit questions for clarity",
        "Add more specific details to answers",
        "Consider creating additional cards for complex topics"
      ]
    };
  }
  
  private mockExpand(text: string): AIAssistResult {
    const expanded = text.split('. ').map(sentence => {
      if (sentence.trim().length < 10) return sentence;
      
      // Add context and examples
      const expansions = [
        ' This is particularly important because it affects how we understand the broader context.',
        ' For example, this principle can be applied in various real-world scenarios.',
        ' Research has shown that this approach yields significant benefits.',
        ' It\'s worth noting that this concept builds upon established theories.',
        ' Furthermore, this has implications for future developments in the field.'
      ];
      
      const randomExpansion = expansions[Math.floor(Math.random() * expansions.length)];
      return sentence + randomExpansion;
    }).join('. ');
    
    return {
      text: `**Expanded version:**\n\n${expanded}`,
      suggestions: [
        "Added context and explanations to key points",
        "Included examples and implications",
        "Enhanced detail while maintaining clarity"
      ]
    };
  }
  
  private mockFixGrammar(text: string): AIAssistResult {
    // Simple grammar fixes
    let corrected = text
      .replace(/\bi\b/g, 'I') // Capitalize 'i'
      .replace(/\s+/g, ' ') // Fix multiple spaces
      .replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => punct + ' ' + letter.toUpperCase()) // Capitalize after punctuation
      .replace(/,\s*,/g, ',') // Fix double commas
      .replace(/\.\s*\./g, '.') // Fix double periods
      .trim();
    
    // Ensure proper sentence ending
    if (corrected && !['.', '!', '?'].includes(corrected.slice(-1))) {
      corrected += '.';
    }
    
    const changes = text !== corrected;
    
    return {
      text: changes ? `**Grammar corrected:**\n\n${corrected}` : text,
      suggestions: changes ? [
        "Fixed capitalization issues",
        "Corrected punctuation spacing",
        "Ensured proper sentence structure"
      ] : [
        "No grammar issues detected",
        "Text appears to be well-structured"
      ]
    };
  }
}

export const aiAssistService = AIAssistService.getInstance();