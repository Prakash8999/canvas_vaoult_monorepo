import React, { useState } from 'react';
import { 
  Settings, 
  Monitor, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload,
  Trash2,
  Shield,
  Bell,
  Keyboard,
  Palette,
  Database,
  HardDrive,
  RefreshCw,
  FileText,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingRow = ({ icon: Icon, title, description, children }: any) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-workspace-bg border border-workspace-border">
    <div className="flex items-center gap-3 flex-1">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
    <div className="ml-4">
      {children}
    </div>
  </div>
);

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    notifications: true,
    sounds: true,
    autoSave: true,
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 'medium',
    fontFamily: 'inter',
    autoBackup: true,
    compactMode: false,
    showPreview: true,
    keyboardShortcuts: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleExportData = () => {
    toast.success('Data export started');
  };

  const handleImportData = () => {
    toast.success('Data import completed');
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
      toast.success('Cache cleared successfully');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        notifications: true,
        sounds: true,
        autoSave: true,
        showLineNumbers: true,
        wordWrap: true,
        fontSize: 'medium',
        fontFamily: 'inter',
        autoBackup: true,
        compactMode: false,
        showPreview: true,
        keyboardShortcuts: true
      });
      setTheme('dark');
      toast.success('Settings reset to default');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-workspace-panel border-workspace-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-workspace-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ai-gradient rounded-xl flex items-center justify-center shadow-glow">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl text-foreground">Settings</DialogTitle>
              <p className="text-sm text-muted-foreground">Customize your CanvasVault experience</p>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Appearance */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  icon={Monitor}
                  title="Theme"
                  description="Choose your preferred color scheme"
                >
                  <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                    <SelectTrigger className="w-32 bg-workspace-panel border-workspace-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-workspace-panel border-workspace-border">
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow
                  icon={FileText}
                  title="Font Size"
                  description="Adjust the editor font size"
                >
                  <Select value={settings.fontSize} onValueChange={(value) => handleSettingChange('fontSize', value)}>
                    <SelectTrigger className="w-32 bg-workspace-panel border-workspace-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-workspace-panel border-workspace-border">
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow
                  icon={Eye}
                  title="Compact Mode"
                  description="Reduce spacing for more content"
                >
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Editor
                </CardTitle>
                <CardDescription>Configure your writing and editing experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  icon={RefreshCw}
                  title="Auto Save"
                  description="Automatically save changes while typing"
                >
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                  />
                </SettingRow>

                <SettingRow
                  icon={Eye}
                  title="Show Line Numbers"
                  description="Display line numbers in code blocks"
                >
                  <Switch
                    checked={settings.showLineNumbers}
                    onCheckedChange={(checked) => handleSettingChange('showLineNumbers', checked)}
                  />
                </SettingRow>

                <SettingRow
                  icon={FileText}
                  title="Word Wrap"
                  description="Wrap long lines in the editor"
                >
                  <Switch
                    checked={settings.wordWrap}
                    onCheckedChange={(checked) => handleSettingChange('wordWrap', checked)}
                  />
                </SettingRow>

                <SettingRow
                  icon={EyeOff}
                  title="Show Preview"
                  description="Show live preview while editing"
                >
                  <Switch
                    checked={settings.showPreview}
                    onCheckedChange={(checked) => handleSettingChange('showPreview', checked)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            {/* Notifications & Sound */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications & Sound
                </CardTitle>
                <CardDescription>Manage alerts and audio feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  icon={Bell}
                  title="Push Notifications"
                  description="Receive notifications for important events"
                >
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </SettingRow>

                <SettingRow
                  icon={settings.sounds ? Volume2 : VolumeX}
                  title="Sound Effects"
                  description="Play sounds for actions and notifications"
                >
                  <Switch
                    checked={settings.sounds}
                    onCheckedChange={(checked) => handleSettingChange('sounds', checked)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            {/* Data & Storage */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data & Storage
                </CardTitle>
                <CardDescription>Manage your data and backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  icon={HardDrive}
                  title="Auto Backup"
                  description="Automatically backup your data locally"
                >
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </SettingRow>

                <Separator className="bg-workspace-border" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="border-workspace-border hover:bg-workspace-hover"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleImportData}
                    className="border-workspace-border hover:bg-workspace-hover"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </div>

                <Separator className="bg-workspace-border" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Storage Usage</div>
                      <div className="text-sm text-muted-foreground">Local storage used by CanvasVault</div>
                    </div>
                    <Badge variant="secondary">2.4 MB</Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleClearCache}
                    className="w-full border-workspace-border hover:bg-workspace-hover text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Cache & Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Advanced
                </CardTitle>
                <CardDescription>Advanced settings and debugging options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  icon={Keyboard}
                  title="Keyboard Shortcuts"
                  description="Enable keyboard shortcuts for faster navigation"
                >
                  <Switch
                    checked={settings.keyboardShortcuts}
                    onCheckedChange={(checked) => handleSettingChange('keyboardShortcuts', checked)}
                  />
                </SettingRow>

                <Separator className="bg-workspace-border" />

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                    className="border-workspace-border hover:bg-workspace-hover text-destructive hover:text-destructive"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset All Settings
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will reset all settings to their default values
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* App Info */}
            <Card className="bg-workspace-bg border-workspace-border">
              <CardHeader>
                <CardTitle className="text-foreground">About CanvasVault</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-foreground mb-1">Version</div>
                    <div className="text-muted-foreground">1.0.0</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">Build</div>
                    <div className="text-muted-foreground">20240928</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">Platform</div>
                    <div className="text-muted-foreground">Web</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">License</div>
                    <div className="text-muted-foreground">MIT</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
