import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your credentials');
      return;
    }
    setIsLoading(true);
    try {
      // Prefer password auth when available
      await login(email, password, 'password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-accent/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img src="/logo12.png" alt="VBCI Redeemer Sanctuary" className="w-10 h-10 object-contain" />
            <div className="leading-tight">
              <h1 className="font-display text-2xl font-semibold text-white">
                VBCI REDEEMER SANCTUARY
              </h1>
              <p className="text-sm text-white/60">Management Platform</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <blockquote className="text-white/90 text-2xl font-display italic leading-relaxed">
            "For where two or three gather in my name, there am I with them."
          </blockquote>
          <p className="text-white/60 text-sm">— Matthew 18:20</p>
        </div>
        
        <div className="relative z-10 text-white/40 text-sm">
          © 2024 VBCI Redeemer Sanctuary
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/logo12.png" alt="VBCI Redeemer Sanctuary" className="w-10 h-10 object-contain" />
            <div className="leading-tight">
              <h1 className="font-display text-2xl font-semibold text-foreground">
                VBCI REDEEMER SANCTUARY
              </h1>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your church dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@church.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                  onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Need access?{' '}
            <button className="text-primary hover:text-primary/80 font-medium transition-colors" onClick={() => setContactOpen(true)}>
              Contact your church admin
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display">Reset your password</DialogTitle>
            <DialogDescription>
              Enter the email address associated with your account. We'll send you a reset link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email address</Label>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="you@church.org"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>Cancel</Button>
            <Button disabled={forgotLoading} onClick={async () => {
              const v = forgotEmail.trim();
              const ok = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(v);
              if (!ok) {
                toast.error('Please enter a valid email address');
                return;
              }

              const sb = getSupabase();
              if (!sb) {
                toast.error('Supabase is not configured. Password reset is unavailable.');
                return;
              }

              setForgotLoading(true);
              try {
                const { error } = await sb.auth.resetPasswordForEmail(v, {
                  redirectTo: window.location.origin + '/reset-password',
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }

                toast.success('If an account exists for this email, a reset link has been sent.');
                setForgotOpen(false);
                navigate('/reset-sent');
              } finally {
                setForgotLoading(false);
              }
            }}>Send reset link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Admin Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-display">Contact Administrator</DialogTitle>
            <DialogDescription>
              Reach out to your church administrator for account access or password assistance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value="appiahjoshua098@gmail.com" />
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText('appiahjoshua098@gmail.com'); toast.success('Email copied'); }}>Copy</Button>
              </div>
              <div>
                <a href="mailto:appiahjoshua098@gmail.com" className="text-sm text-primary hover:underline">Open email app</a>
              </div>
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={"+233 597 095 202"} />
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText('233597095202'); toast.success('Number copied'); }}>Copy</Button>
              </div>
              <div>
                <a
                  href="https://wa.me/233597095202"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Message on WhatsApp
                </a>
                <p className="text-xs text-muted-foreground mt-1">Using international format ensures the WhatsApp link works on all devices.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
