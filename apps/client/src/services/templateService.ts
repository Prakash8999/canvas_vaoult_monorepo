/**
 * Template Service
 * Provides pre-defined note templates with dynamic placeholders
 */

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'meeting' | 'research' | 'daily' | 'project' | 'learning' | 'general';
  content: any; // EditorJS OutputData format
  placeholders: Array<{
    key: string;
    label: string;
    type: 'text' | 'date' | 'time' | 'datetime' | 'select';
    options?: string[];
    defaultValue?: string;
  }>;
}

class TemplateService {
  private static instance: TemplateService;
  private templates: Template[] = [];
  
  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
      TemplateService.instance.initializeTemplates();
    }
    return TemplateService.instance;
  }
  
  private initializeTemplates() {
    this.templates = [
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured template for meeting documentation',
        category: 'meeting',
        placeholders: [
          { key: 'meeting_title', label: 'Meeting Title', type: 'text', defaultValue: 'Team Meeting' },
          { key: 'meeting_date', label: 'Date', type: 'date' },
          { key: 'meeting_time', label: 'Time', type: 'time' },
          { key: 'attendees', label: 'Attendees', type: 'text', defaultValue: 'Team members' },
        ],
        content: {
          blocks: [
            {
              type: 'header',
              data: { text: '{{meeting_title}} - {{meeting_date}}', level: 1 }
            },
            {
              type: 'paragraph',
              data: { text: '**Date:** {{meeting_date}}<br>**Time:** {{meeting_time}}<br>**Attendees:** {{attendees}}' }
            },
            {
              type: 'header',
              data: { text: 'Agenda', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'ordered',
                items: [
                  'Item 1',
                  'Item 2',
                  'Item 3'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Discussion Points', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Key discussion points and decisions made...' }
            },
            {
              type: 'header',
              data: { text: 'Action Items', level: 2 }
            },
            {
              type: 'checklist',
              data: {
                items: [
                  { text: 'Action item 1 - Assigned to: [Name]', checked: false },
                  { text: 'Action item 2 - Assigned to: [Name]', checked: false },
                  { text: 'Action item 3 - Assigned to: [Name]', checked: false }
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Next Steps', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Next meeting scheduled for: [Date]' }
            }
          ]
        }
      },
      {
        id: 'research-log',
        name: 'Research Log',
        description: 'Template for documenting research findings',
        category: 'research',
        placeholders: [
          { key: 'research_topic', label: 'Research Topic', type: 'text' },
          { key: 'research_date', label: 'Date', type: 'date' },
          { key: 'researcher', label: 'Researcher', type: 'text', defaultValue: 'Your Name' },
        ],
        content: {
          blocks: [
            {
              type: 'header',
              data: { text: 'Research: {{research_topic}}', level: 1 }
            },
            {
              type: 'paragraph',
              data: { text: '**Date:** {{research_date}}<br>**Researcher:** {{researcher}}' }
            },
            {
              type: 'header',
              data: { text: 'Research Question', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'What specific question or hypothesis are you investigating?' }
            },
            {
              type: 'header',
              data: { text: 'Methodology', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Describe your research approach and methods...' }
            },
            {
              type: 'header',
              data: { text: 'Sources', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'Source 1: [Title, Author, URL]',
                  'Source 2: [Title, Author, URL]',
                  'Source 3: [Title, Author, URL]'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Key Findings', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Summarize the main findings from your research...' }
            },
            {
              type: 'header',
              data: { text: 'Analysis', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'What do these findings mean? How do they relate to your research question?' }
            },
            {
              type: 'header',
              data: { text: 'Next Steps', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'What additional research is needed? What questions emerged?' }
            }
          ]
        }
      },
      {
        id: 'daily-journal',
        name: 'Daily Journal',
        description: 'Daily reflection and planning template',
        category: 'daily',
        placeholders: [
          { key: 'journal_date', label: 'Date', type: 'date' },
          { key: 'mood', label: 'Mood', type: 'select', options: ['😊 Great', '🙂 Good', '😐 Okay', '😕 Not great', '😞 Difficult'] },
        ],
        content: {
          blocks: [
            {
              type: 'header',
              data: { text: 'Daily Journal - {{journal_date}}', level: 1 }
            },
            {
              type: 'paragraph',
              data: { text: '**Mood:** {{mood}}' }
            },
            {
              type: 'header',
              data: { text: 'Today\'s Highlights', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'Achievement or positive moment 1',
                  'Achievement or positive moment 2',
                  'Achievement or positive moment 3'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Challenges Faced', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'What difficulties did you encounter today? How did you handle them?' }
            },
            {
              type: 'header',
              data: { text: 'Lessons Learned', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'What did you learn today? Any insights or realizations?' }
            },
            {
              type: 'header',
              data: { text: 'Gratitude', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'Something I\'m grateful for today',
                  'Someone who made a positive impact',
                  'A moment of joy or peace'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Tomorrow\'s Focus', level: 2 }
            },
            {
              type: 'checklist',
              data: {
                items: [
                  { text: 'Priority task 1', checked: false },
                  { text: 'Priority task 2', checked: false },
                  { text: 'Priority task 3', checked: false }
                ]
              }
            }
          ]
        }
      },
      {
        id: 'project-planning',
        name: 'Project Planning',
        description: 'Comprehensive project planning template',
        category: 'project',
        placeholders: [
          { key: 'project_name', label: 'Project Name', type: 'text' },
          { key: 'project_manager', label: 'Project Manager', type: 'text' },
          { key: 'start_date', label: 'Start Date', type: 'date' },
          { key: 'end_date', label: 'End Date', type: 'date' },
        ],
        content: {
          blocks: [
            {
              type: 'header',
              data: { text: 'Project: {{project_name}}', level: 1 }
            },
            {
              type: 'paragraph',
              data: { text: '**Project Manager:** {{project_manager}}<br>**Start Date:** {{start_date}}<br>**End Date:** {{end_date}}' }
            },
            {
              type: 'header',
              data: { text: 'Project Overview', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Brief description of the project goals, scope, and expected outcomes...' }
            },
            {
              type: 'header',
              data: { text: 'Objectives', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'ordered',
                items: [
                  'Primary objective',
                  'Secondary objective',
                  'Tertiary objective'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Key Stakeholders', level: 2 }
            },
            {
              type: 'table',
              data: {
                content: [
                  ['Name', 'Role', 'Contact', 'Involvement Level'],
                  ['[Name]', '[Role]', '[Email/Phone]', '[High/Medium/Low]'],
                  ['[Name]', '[Role]', '[Email/Phone]', '[High/Medium/Low]'],
                  ['[Name]', '[Role]', '[Email/Phone]', '[High/Medium/Low]']
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Milestones', level: 2 }
            },
            {
              type: 'checklist',
              data: {
                items: [
                  { text: 'Milestone 1 - [Date]', checked: false },
                  { text: 'Milestone 2 - [Date]', checked: false },
                  { text: 'Milestone 3 - [Date]', checked: false },
                  { text: 'Project Completion - [Date]', checked: false }
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Risks and Mitigation', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Identify potential risks and describe mitigation strategies...' }
            },
            {
              type: 'header',
              data: { text: 'Resources Required', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'Human resources: [Team members, roles]',
                  'Technical resources: [Tools, software, hardware]',
                  'Budget: [Estimated costs]'
                ]
              }
            }
          ]
        }
      },
      {
        id: 'learning-notes',
        name: 'Learning Notes',
        description: 'Template for structured learning and study notes',
        category: 'learning',
        placeholders: [
          { key: 'subject', label: 'Subject/Topic', type: 'text' },
          { key: 'learning_date', label: 'Date', type: 'date' },
          { key: 'source', label: 'Source', type: 'text', defaultValue: 'Book/Course/Article' },
        ],
        content: {
          blocks: [
            {
              type: 'header',
              data: { text: 'Learning Notes: {{subject}}', level: 1 }
            },
            {
              type: 'paragraph',
              data: { text: '**Date:** {{learning_date}}<br>**Source:** {{source}}' }
            },
            {
              type: 'header',
              data: { text: 'Learning Objectives', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'What I want to learn/understand',
                  'Specific skills to develop',
                  'Questions to answer'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Key Concepts', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Main concepts, definitions, and principles...' }
            },
            {
              type: 'header',
              data: { text: 'Detailed Notes', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Comprehensive notes on the topic, including examples and explanations...' }
            },
            {
              type: 'header',
              data: { text: 'Examples', level: 2 }
            },
            {
              type: 'paragraph',
              data: { text: 'Practical examples, case studies, or demonstrations...' }
            },
            {
              type: 'header',
              data: { text: 'Questions & Reflections', level: 2 }
            },
            {
              type: 'list',
              data: {
                style: 'unordered',
                items: [
                  'What questions do I still have?',
                  'How does this connect to what I already know?',
                  'Where can I apply this knowledge?'
                ]
              }
            },
            {
              type: 'header',
              data: { text: 'Action Items', level: 2 }
            },
            {
              type: 'checklist',
              data: {
                items: [
                  { text: 'Practice/apply the concept', checked: false },
                  { text: 'Research related topics', checked: false },
                  { text: 'Review and summarize', checked: false }
                ]
              }
            }
          ]
        }
      }
    ];
  }
  
  getTemplates(): Template[] {
    return this.templates;
  }
  
  getTemplatesByCategory(category: Template['category']): Template[] {
    return this.templates.filter(t => t.category === category);
  }
  
  getTemplate(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }
  
  applyTemplate(template: Template, placeholderValues: Record<string, string>): any {
    const content = JSON.parse(JSON.stringify(template.content)); // Deep clone
    
    // Replace placeholders in the content
    const replacePlaceholders = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        Object.entries(placeholderValues).forEach(([key, value]) => {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return result;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(replacePlaceholders);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        Object.entries(obj).forEach(([key, value]) => {
          result[key] = replacePlaceholders(value);
        });
        return result;
      }
      
      return obj;
    };
    
    return replacePlaceholders(content);
  }
  
  getDefaultPlaceholderValues(template: Template): Record<string, string> {
    const values: Record<string, string> = {};
    const now = new Date();
    
    template.placeholders.forEach(placeholder => {
      if (placeholder.defaultValue) {
        values[placeholder.key] = placeholder.defaultValue;
      } else {
        switch (placeholder.type) {
          case 'date':
            values[placeholder.key] = now.toISOString().split('T')[0];
            break;
          case 'time':
            values[placeholder.key] = now.toTimeString().split(' ')[0].substring(0, 5);
            break;
          case 'datetime':
            values[placeholder.key] = now.toISOString().substring(0, 16);
            break;
          default:
            values[placeholder.key] = '';
        }
      }
    });
    
    return values;
  }
}

export const templateService = TemplateService.getInstance();