import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Image, Code, FileJson } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, options: any) => void;
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState('1');
  const [background, setBackground] = useState(true);
  const [padding, setPadding] = useState(true);

  const handleExport = () => {
    onExport(format, {
      scale: parseFloat(scale),
      includeBackground: background,
      padding: padding ? 20 : 0
    });
    onClose();
  };

  const formatOptions = [
    { value: 'png', label: 'PNG Image', icon: Image, description: 'High quality raster image' },
    { value: 'svg', label: 'SVG Vector', icon: Code, description: 'Scalable vector graphics' },
    { value: 'json', label: 'JSON Data', icon: FileJson, description: 'Raw canvas data' }
  ];

  const scaleOptions = [
    { value: '0.5', label: '0.5x (Small)' },
    { value: '1', label: '1x (Normal)' },
    { value: '2', label: '2x (High DPI)' },
    { value: '3', label: '3x (Ultra HD)' }
  ];

  const selectedFormat = formatOptions.find(f => f.value === format);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Canvas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid gap-2">
              {formatOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      format === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormat(option.value)}
                  >
                    <IconComponent className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      format === option.value
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options */}
          {format !== 'json' && (
            <div className="space-y-4">
              <Label>Export Options</Label>
              
              {format === 'png' && (
                <div className="space-y-2">
                  <Label htmlFor="scale" className="text-sm">Scale</Label>
                  <Select value={scale} onValueChange={setScale}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scaleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="background"
                  checked={background}
                  onCheckedChange={(checked) => setBackground(checked === true)}
                />
                <Label htmlFor="background" className="text-sm">
                  Include background
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="padding"
                  checked={padding}
                  onCheckedChange={(checked) => setPadding(checked === true)}
                />
                <Label htmlFor="padding" className="text-sm">
                  Add padding
                </Label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export {selectedFormat?.label}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}