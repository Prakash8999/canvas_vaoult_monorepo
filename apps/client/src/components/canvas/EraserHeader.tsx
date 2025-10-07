import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Crown,
  Settings,
  HelpCircle,
  User,
  LogOut,
  Bell,
  Search,
  Plus,
  FolderOpen,
  Star,
  Clock,
  Users,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EraserHeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    plan: 'free' | 'pro' | 'team';
  };
  onNewDocument?: () => void;
  onOpenDocument?: () => void;
  onSearch?: (query: string) => void;
}

const recentDocuments = [
  { id: '1', name: 'System Architecture', lastModified: '2 hours ago', collaborators: 3 },
  { id: '2', name: 'Database Schema', lastModified: '1 day ago', collaborators: 1 },
  { id: '3', name: 'API Flow Diagram', lastModified: '3 days ago', collaborators: 5 },
  { id: '4', name: 'User Journey Map', lastModified: '1 week ago', collaborators: 2 },
];

export function EraserHeader({
  user = {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'pro'
  },
  onNewDocument,
  onOpenDocument,
  onSearch
}: EraserHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: '1', title: 'Document shared with you', time: '5m ago', unread: true },
    { id: '2', title: 'Comment on System Architecture', time: '1h ago', unread: true },
    { id: '3', title: 'Export completed', time: '2h ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-700';
      case 'team':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanIcon = (plan: string) => {
    return plan === 'pro' || plan === 'team' ? Crown : null;
  };

  return (
    <motion.header
      className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between relative z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Eraser</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onNewDocument}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Open
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">Recent Documents</h3>
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200"
                    />
                  </div>
                </form>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {recentDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={onOpenDocument}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{doc.lastModified}</span>
                        <Users className="h-3 w-3 ml-2" />
                        <span>{doc.collaborators} collaborators</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
                  View all documents
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents, templates, or help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Plan Badge */}
        <Badge className={`${getPlanColor(user.plan)} capitalize`}>
          {(user.plan === 'pro' || user.plan === 'team') && (
            <Crown className="h-3 w-3 mr-1" />
          )}
          {user.plan}
        </Badge>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-50 last:border-0 ${
                    notification.unread ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" className="w-full text-gray-600">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help */}
        <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Crown className="mr-2 h-4 w-4" />
              <span>Upgrade Plan</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Globe className="mr-2 h-4 w-4" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}