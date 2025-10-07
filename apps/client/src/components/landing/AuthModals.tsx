import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Chrome, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface AuthModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export function AuthModals({ open, onOpenChange, mode, onModeChange }: AuthModalsProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const getToken = useAuthStore((state) => state.token);

  const handleGoogleAuth = async () => {
    setLoading(true);
    // Simulate Google OAuth flow
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      navigate('/');
    }, 1000);
  };

  const isSignUp = mode === 'signup';
  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log(" base url", import.meta.env.VITE_BASE_URL)

    try {
      if (isSignUp) {
        await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/user/signup`, {
          name: name,
          email: email,
          password: password,
          profile_url: "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png"
        });
        setLoading(false);
        setOtpModalOpen(true);
        onOpenChange(false);
      } else {
        const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/user/login`, {
          email,
          password
        });
        // Save token to zustand and localStorage
        const token = res.data?.data?.token;
        if (token) {
          setToken(token);
          navigate('/dashboard');
        }
        setLoading(false);
        onOpenChange(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.data || 'Authentication failed');
      } else {
        setError('Network error');
      }
      setLoading(false);
    }
  }, [isSignUp, name, email, password, onOpenChange, navigate, setToken]);

  const handleOtpSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/user/verify-otp`, {
        email,
        otp
      });
      // Save token to zustand and localStorage
      const token = res.data?.data?.token;
      if (token) {
        setToken(token);
        navigate('/dashboard');
      }
      setOtpLoading(false);
      setOtpModalOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setOtpError(err.response?.data?.message || 'OTP verification failed');
      } else {
        setOtpError('Network error');
      }
      setOtpLoading(false);
    }
  }, [email, otp, navigate, setToken]);


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 py-4"
          >
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleAuth}
              disabled={loading}
              variant="outline"
              className="w-full h-12 text-base"
            >
              <Chrome className="mr-3 h-5 w-5" />
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base"
              >
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {error && (
                <div className="text-red-500 text-sm text-center mt-2">{error}</div>
              )}
            </form>

            {/* Switch Mode */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              </span>
              <button
                type="button"
                onClick={() => onModeChange(isSignUp ? 'signin' : 'signup')}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            {/* Terms */}
            {isSignUp && (
              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Verify OTP</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={otpLoading} className="w-full h-12 text-base">
              {otpLoading ? 'Verifying...' : 'Verify'}
            </Button>
            {otpError && (
              <div className="text-red-500 text-sm text-center mt-2">{otpError}</div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}