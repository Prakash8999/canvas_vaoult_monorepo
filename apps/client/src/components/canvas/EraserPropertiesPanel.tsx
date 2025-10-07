import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  Move,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Settings2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EraserPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElements: any[];
  onUpdateElement?: (elementId: string, properties: any) => void;
}

const colorPalette = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'
];

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export function EraserPropertiesPanel({
  isOpen,
  onClose,
  selectedElements,
  onUpdateElement
}: EraserPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('style');
  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    typography: false,
    position: false,
    effects: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const selectedElement = selectedElements[0];
  const hasSelection = selectedElements.length > 0;
  const multipleSelection = selectedElements.length > 1;

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-2xl z-50"
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Properties</h2>
          {multipleSelection && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {selectedElements.length} selected
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasSelection ? (
          // No Selection State
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Settings2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No Selection</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Select an element on the canvas to view and edit its properties
            </p>
          </div>
        ) : (
          // Properties Content
          <div className="p-4 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-6 mt-6">
                {/* Appearance Section */}
                <Collapsible
                  open={expandedSections.appearance}
                  onOpenChange={() => toggleSection('appearance')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Appearance</span>
                    </div>
                    {expandedSections.appearance ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {/* Fill Color */}
                    <div className="space-y-2">
                      <Label className="text-sm">Fill</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              selectedElement?.backgroundColor === color
                                ? 'border-blue-500 scale-110'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateElement?.(selectedElement.id, {
                              backgroundColor: color
                            })}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-8 h-8 rounded border"
                          value={selectedElement?.backgroundColor || '#ffffff'}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            backgroundColor: e.target.value
                          })}
                        />
                        <Input
                          type="text"
                          placeholder="#000000"
                          value={selectedElement?.backgroundColor || ''}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            backgroundColor: e.target.value
                          })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Stroke Color */}
                    <div className="space-y-2">
                      <Label className="text-sm">Stroke</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              selectedElement?.strokeColor === color
                                ? 'border-blue-500 scale-110'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateElement?.(selectedElement.id, {
                              strokeColor: color
                            })}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stroke Width */}
                    <div className="space-y-2">
                      <Label className="text-sm">Stroke Width</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[selectedElement?.strokeWidth || 1]}
                          onValueChange={(value) => onUpdateElement?.(selectedElement.id, {
                            strokeWidth: value[0]
                          })}
                          max={20}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 w-8">
                          {selectedElement?.strokeWidth || 1}
                        </span>
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                      <Label className="text-sm">Opacity</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[selectedElement?.opacity * 100 || 100]}
                          onValueChange={(value) => onUpdateElement?.(selectedElement.id, {
                            opacity: value[0] / 100
                          })}
                          max={100}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 w-10">
                          {Math.round(selectedElement?.opacity * 100 || 100)}%
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Effects Section */}
                <Collapsible
                  open={expandedSections.effects}
                  onOpenChange={() => toggleSection('effects')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Effects</span>
                    </div>
                    {expandedSections.effects ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Visible</Label>
                      <Switch
                        checked={!selectedElement?.isHidden}
                        onCheckedChange={(checked) => onUpdateElement?.(selectedElement.id, {
                          isHidden: !checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Locked</Label>
                      <Switch
                        checked={selectedElement?.isLocked}
                        onCheckedChange={(checked) => onUpdateElement?.(selectedElement.id, {
                          isLocked: checked
                        })}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="text" className="space-y-6 mt-6">
                {selectedElement?.type === 'text' ? (
                  <>
                    {/* Typography Section */}
                    <Collapsible
                      open={expandedSections.typography}
                      onOpenChange={() => toggleSection('typography')}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Typography</span>
                        </div>
                        {expandedSections.typography ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        {/* Font Family */}
                        <div className="space-y-2">
                          <Label className="text-sm">Font Family</Label>
                          <Select
                            value={selectedElement.fontFamily || 'Inter'}
                            onValueChange={(value) => onUpdateElement?.(selectedElement.id, {
                              fontFamily: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Monaco">Monaco</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-2">
                          <Label className="text-sm">Font Size</Label>
                          <Select
                            value={String(selectedElement.fontSize || 16)}
                            onValueChange={(value) => onUpdateElement?.(selectedElement.id, {
                              fontSize: Number(value)
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontSizes.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                  {size}px
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Text Style */}
                        <div className="space-y-2">
                          <Label className="text-sm">Style</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                              })}
                            >
                              <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic'
                              })}
                            >
                              <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedElement.textDecoration === 'underline' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline'
                              })}
                            >
                              <Underline className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div className="space-y-2">
                          <Label className="text-sm">Alignment</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                textAlign: 'left'
                              })}
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                textAlign: 'center'
                              })}
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onUpdateElement?.(selectedElement.id, {
                                textAlign: 'right'
                              })}
                            >
                              <AlignRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a text element to edit typography</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="layout" className="space-y-6 mt-6">
                {/* Position Section */}
                <Collapsible
                  open={expandedSections.position}
                  onOpenChange={() => toggleSection('position')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Position & Size</span>
                    </div>
                    {expandedSections.position ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">X</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement?.x || 0)}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            x: Number(e.target.value)
                          })}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Y</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement?.y || 0)}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            y: Number(e.target.value)
                          })}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Width</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement?.width || 0)}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            width: Number(e.target.value)
                          })}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Height</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement?.height || 0)}
                          onChange={(e) => onUpdateElement?.(selectedElement.id, {
                            height: Number(e.target.value)
                          })}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div className="space-y-2">
                      <Label className="text-sm">Rotation</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[selectedElement?.angle || 0]}
                          onValueChange={(value) => onUpdateElement?.(selectedElement.id, {
                            angle: value[0]
                          })}
                          max={360}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 w-10">
                          {Math.round(selectedElement?.angle || 0)}°
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </motion.div>
  );
}