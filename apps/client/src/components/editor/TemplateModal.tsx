import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templateService } from '@/services/templateService';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'meeting' | 'research' | 'daily' | 'project' | 'learning' | 'general';
  content: any;
  placeholders: Array<{
    key: string;
    label: string;
    type: 'text' | 'date' | 'time' | 'datetime' | 'select';
    options?: string[];
    defaultValue?: string;
  }>;
}
import { 
  FileText, 
  Users, 
  Search, 
  BookOpen, 
  Briefcase, 
  Calendar,
  X
} from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateContent: any, templateName: string) => void;
}

const categoryIcons = {
  all: FileText,
  meeting: Users,
  research: Search,
  daily: Calendar,
  project: Briefcase,
  learning: BookOpen,
  general: FileText,
};

const categoryLabels = {
  all: 'All',
  meeting: 'Meeting',
  research: 'Research',
  daily: 'Daily',
  project: 'Project',
  learning: 'Learning',
  general: 'General',
};

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<Template['category'] | 'all'>('all');
  
  const templates = templateService.getTemplates();
  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    const defaultValues = templateService.getDefaultPlaceholderValues(template);
    setPlaceholderValues(defaultValues);
  };
  
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    const content = templateService.applyTemplate(selectedTemplate, placeholderValues);
    onSelectTemplate(content, selectedTemplate.name);
    onClose();
    setSelectedTemplate(null);
    setPlaceholderValues({});
  };
  
  const handleCancel = () => {
    onClose();
    setSelectedTemplate(null);
    setPlaceholderValues({});
  };
  
  const filteredTemplates = templates.filter(t => 
    activeCategory === 'all' ? true : t.category === activeCategory
  );
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            Choose a Template
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Template Selection */}
          {!selectedTemplate && (
            <div className="flex-1 flex flex-col min-h-0">
              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as Template['category'] | 'all')}>
                <TabsList className="grid w-full grid-cols-7">
                  {/* All Templates Tab */}
                  <TabsTrigger key="all" value="all" className="flex items-center gap-1">
                    <FileText size={14} />
                    All
                  </TabsTrigger>
                  
                  {categories.map(category => {
                    const Icon = categoryIcons[category];
                    return (
                      <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                        <Icon size={14} />
                        {categoryLabels[category]}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {activeCategory === 'all' ? (
                  <div className="flex-1 mt-4">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-2 gap-4">
                        {templates.map(template => {
                          const Icon = categoryIcons[template.category];
                          return (
                            <Card 
                              key={template.id} 
                              className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Icon size={16} />
                                  {template.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {template.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {categoryLabels[template.category]}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {template.placeholders.length} fields
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                ) : categories.map(category => (
                  <TabsContent key={category} value={category} className="flex-1 mt-4">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-2 gap-4">
                      {filteredTemplates.map(template => {
                        const Icon = categoryIcons[template.category];
                        return (
                          <Card 
                            key={template.id} 
                            className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Icon size={16} />
                                {template.name}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {template.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {categoryLabels[template.category]}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {template.placeholders.length} fields
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
          
          {/* Template Configuration */}
          {selectedTemplate && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {React.createElement(categoryIcons[selectedTemplate.category], { size: 20 })}
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(null)}>
                  <X size={16} />
                  <span className="ml-2">Back to Templates</span>
                </Button>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="text-sm font-medium mb-3">Template Fields</h4>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pr-4">
                    {selectedTemplate.placeholders.map(placeholder => (
                      <div key={placeholder.key} className="space-y-2">
                        <Label htmlFor={placeholder.key} className="text-sm">
                          {placeholder.label}
                        </Label>
                        
                        {placeholder.type === 'select' ? (
                          <Select 
                            value={placeholderValues[placeholder.key]} 
                            onValueChange={(value) => setPlaceholderValues(prev => ({ ...prev, [placeholder.key]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {placeholder.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={placeholder.key}
                            type={placeholder.type}
                            value={placeholderValues[placeholder.key] || ''}
                            onChange={(e) => setPlaceholderValues(prev => ({ 
                              ...prev, 
                              [placeholder.key]: e.target.value 
                            }))}
                            placeholder={placeholder.defaultValue || `Enter ${placeholder.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleApplyTemplate}>
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer - only show when no template is selected */}
        {!selectedTemplate && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}