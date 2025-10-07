import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Shield, Zap, Sparkles, FileText, Palette, Bot, Gauge, Globe, Lock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from './LandingHeader';
import { AuthModals } from './AuthModals';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: FileText,
      title: "Rich Notes",
      description: "Obsidian-style backlinks, graph view, and block-based editing for connected thinking.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Palette,
      title: "Infinite Canvas",
      description: "Unlimited whiteboard space for ideas, architecture diagrams, and visual brainstorming.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Summarize content, generate mind maps, create auto-diagrams, and improve your writing.",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Gauge,
      title: "Quick Capture",
      description: "Instantly jot down ideas without breaking your flow, with smart organization.",
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  const benefits = [
    {
      icon: Lock,
      title: "Privacy First",
      description: "Your data stays on your device. No cloud storage unless you choose it."
    },
    {
      icon: Globe,
      title: "Works Offline",
      description: "Full functionality without internet. Sync when you're ready."
    },
    {
      icon: Database,
      title: "No Vendor Lock-in",
      description: "Export your data anytime. Own your content forever."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader onSignIn={() => openAuth('signin')} onSignUp={() => openAuth('signup')} />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-20 pb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <Badge variant="secondary" className="mx-auto w-fit">
                <Sparkles className="w-3 h-3 mr-1" />
                Local-First Workspace
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                CanvasVault
                <span className="block text-primary">Your Creative Space</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your local-first workspace for notes, canvases, and AI creativity.
                <span className="block mt-2">Everything stays on your device, works offline, and syncs seamlessly when needed.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-lg px-8"
                  onClick={() => navigate('/dashboard')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-border hover:bg-accent text-lg px-8"
                >
                  Try Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-4 mb-16"
            >
              <h2 className="text-4xl font-bold text-foreground">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful tools that work together seamlessly for your creative workflow
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full bg-card border-border hover:shadow-lg transition-all duration-300 group">
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Preview Section */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-4 mb-16"
            >
              <h2 className="text-4xl font-bold text-foreground">See It In Action</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the power of integrated notes, canvas, and AI assistance
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-8 rounded-2xl border border-blue-500/20">
                  <FileText className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Notes Editor</h3>
                  <p className="text-muted-foreground">Rich text editing with blocks, backlinks, and embedded canvases.</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-8 rounded-2xl border border-purple-500/20">
                  <Palette className="h-12 w-12 text-purple-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Canvas Workspace</h3>
                  <p className="text-muted-foreground">Infinite whiteboard for diagrams, mind maps, and visual thinking.</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-8 rounded-2xl border border-emerald-500/20">
                  <Bot className="h-12 w-12 text-emerald-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
                  <p className="text-muted-foreground">Smart assistance for writing, summarizing, and organizing ideas.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Local-First Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-4 mb-16"
            >
              <h2 className="text-4xl font-bold text-foreground">Why Local-First?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your data, your device, your control. Experience the benefits of true data ownership.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  <CheckCircle className="h-6 w-6 text-success mx-auto" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Ready to Start Creating?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of creators, thinkers, and builders who've made CanvasVault their digital workspace.
              </p>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-lg px-12"
                onClick={() => openAuth('signup')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required • Free forever • Export anytime
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <AuthModals 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}