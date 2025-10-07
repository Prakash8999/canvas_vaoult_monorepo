import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Camera, 
  Edit3, 
  Check, 
  X,
  Calendar,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Github,
  Twitter,
  Globe,
  Settings,
  LogOut,
  MoreVertical
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiDrawer } from '@/components/ai/AiDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/stores/workspace';
import { toast } from 'sonner';
import { SettingsModal } from '@/components/settings/SettingsModal';

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  title: string;
  location: string;
  website: string;
  github: string;
  twitter: string;
  joinedDate: string;
  avatar: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);
  
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    bio: 'Passionate knowledge worker and creative thinker. I love organizing ideas and building beautiful digital experiences.',
    title: 'Product Designer',
    location: 'San Francisco, CA',
    website: 'https://alexjohnson.dev',
    github: 'alexjohnson',
    twitter: '@alexjohnson',
    joinedDate: '2024-01-15',
    avatar: ''
  });
  
  const [editData, setEditData] = useState(profileData);

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="h-screen bg-workspace-bg flex flex-col overflow-hidden w-full">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto" style={{ paddingRight: sidebarOpen ? undefined : 0 }}>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto p-8 space-y-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ai-gradient rounded-2xl flex items-center justify-center shadow-glow">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground">
                      Profile
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Manage your personal information and preferences
                    </p>
                  </div>
                </div>
                
                {/* Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="border-workspace-border hover:bg-workspace-hover"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-workspace-panel border-workspace-border w-48">
                    <DropdownMenuItem 
                      onClick={() => setSettingsOpen(true)}
                      className="hover:bg-workspace-hover cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="hover:bg-workspace-hover cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>

            {/* Profile Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-workspace-panel border-workspace-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Personal Information</CardTitle>
                      <CardDescription>Your profile details and public information</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={handleEdit} variant="outline" className="border-workspace-border hover:bg-workspace-hover">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90">
                          <Check className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm" className="border-workspace-border hover:bg-workspace-hover">
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-ai-gradient rounded-2xl flex items-center justify-center shadow-glow">
                        {profileData.avatar ? (
                          <img 
                            src={profileData.avatar} 
                            alt="Profile" 
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-white" />
                        )}
                      </div>
                      {isEditing && (
                        <Button 
                          size="sm" 
                          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                          {isEditing ? (
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                              className="bg-workspace-bg border-workspace-border"
                            />
                          ) : (
                            <p className="text-foreground font-medium">{profileData.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                          {isEditing ? (
                            <Input
                              value={editData.email}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-workspace-bg border-workspace-border"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-foreground">{profileData.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-workspace-border" />

                  {/* Bio Section */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                    {isEditing ? (
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                        className="bg-workspace-bg border-workspace-border min-h-[100px]"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-muted-foreground">{profileData.bio}</p>
                    )}
                  </div>

                  <Separator className="bg-workspace-border" />

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Job Title</label>
                        {isEditing ? (
                          <Input
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-workspace-bg border-workspace-border"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <p className="text-foreground">{profileData.title}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                        {isEditing ? (
                          <Input
                            value={editData.location}
                            onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                            className="bg-workspace-bg border-workspace-border"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="text-foreground">{profileData.location}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Website</label>
                        {isEditing ? (
                          <Input
                            value={editData.website}
                            onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                            className="bg-workspace-bg border-workspace-border"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {profileData.website}
                            </a>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Member Since</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-foreground">
                            {new Date(profileData.joinedDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-workspace-border" />

                  {/* Social Links */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-4 block">Social Links</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">GitHub</label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4 text-muted-foreground" />
                            <Input
                              value={editData.github}
                              onChange={(e) => setEditData(prev => ({ ...prev, github: e.target.value }))}
                              className="bg-workspace-bg border-workspace-border"
                              placeholder="username"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4 text-muted-foreground" />
                            <p className="text-foreground">{profileData.github}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Twitter</label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-muted-foreground" />
                            <Input
                              value={editData.twitter}
                              onChange={(e) => setEditData(prev => ({ ...prev, twitter: e.target.value }))}
                              className="bg-workspace-bg border-workspace-border"
                              placeholder="@username"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-muted-foreground" />
                            <p className="text-foreground">{profileData.twitter}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants}>
              <Card className="bg-workspace-panel border-workspace-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Activity Overview</CardTitle>
                  <CardDescription>Your workspace activity and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-workspace-bg rounded-lg border border-workspace-border">
                      <div className="text-2xl font-bold text-foreground mb-1">24</div>
                      <div className="text-sm text-muted-foreground">Notes Created</div>
                    </div>
                    <div className="text-center p-4 bg-workspace-bg rounded-lg border border-workspace-border">
                      <div className="text-2xl font-bold text-foreground mb-1">7</div>
                      <div className="text-sm text-muted-foreground">Canvases</div>
                    </div>
                    <div className="text-center p-4 bg-workspace-bg rounded-lg border border-workspace-border">
                      <div className="text-2xl font-bold text-foreground mb-1">15</div>
                      <div className="text-sm text-muted-foreground">Days Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
      <AiDrawer />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}