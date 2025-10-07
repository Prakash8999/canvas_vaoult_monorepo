import React, { useState, useEffect } from 'react';
import { Search, X, LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

// Type for Lucide icon components
type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Get all Lucide icons with proper typing
const iconEntries = Object.entries(LucideIcons)
  .filter((entry): entry is [string, LucideIcon] => {
    const [name, component] = entry;
    return (
      typeof component === 'function' && 
      name !== 'createLucideIcon' && 
      name !== 'Icon' &&
      name !== 'icons' &&
      !name.startsWith('use') &&
      // Check if it's a React component
      'displayName' in component ||
      'render' in component ||
      name[0] === name[0].toUpperCase() // Component names start with uppercase
    );
  });

interface IconSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string, IconComponent: LucideIcon) => void;
}

export function IconSearchModal({ isOpen, onClose, onSelectIcon }: IconSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIcons, setFilteredIcons] = useState(iconEntries);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIcons(iconEntries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = iconEntries.filter(([name]) => 
        name.toLowerCase().includes(query)
      );
      setFilteredIcons(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-4xl h-[80vh] bg-white shadow-2xl">
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Choose an Icon</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search icons... (e.g., github, heart, arrow)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          
          {/* Results count */}
          <div className="text-sm text-gray-500 mb-4">
            {filteredIcons.length} icons found
          </div>
          
          {/* Icons Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-3">
              {filteredIcons.map(([name, IconComponent]) => (
                <button
                  key={name}
                  onClick={() => {
                    onSelectIcon(name, IconComponent);
                    onClose();
                  }}
                  className="group flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  title={name}
                >
                  <IconComponent 
                    size={24} 
                    className="text-gray-700 group-hover:text-blue-600 mb-2" 
                  />
                  <span className="text-xs text-gray-500 group-hover:text-blue-600 truncate w-full text-center">
                    {name}
                  </span>
                </button>
              ))}
            </div>
            
            {filteredIcons.length === 0 && (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No icons found</p>
                <p className="text-gray-400 text-sm">Try different search terms</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}