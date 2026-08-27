'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuthError = (err: unknown) => {
    console.error('Auth error:', err);
    const authError = err as { code?: string; message?: string } | undefined;
    const code = authError?.code || '';
    const message = authError?.message || '';
    
    switch (code) {
      case 'auth/invalid-credential':
        setError('Invalid email or password.');
        break;
      case 'auth/email-already-in-use':
        setError('An account with this email already exists. Try signing in.');
        break;
      case 'auth/weak-password':
        setError('Password should be at least 6 characters long.');
        break;
      case 'auth/invalid-email':
        setError('Please enter a valid email address.');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email. Try signing up.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      case 'auth/too-many-requests':
        setError('Too many attempts. Please wait a moment and try again.');
        break;
      case 'auth/popup-closed-by-user':
        setError('Google sign-in was cancelled. Please try again.');
        break;
      case 'auth/unauthorized-domain':
        setError('This domain is not authorized for sign-in. Please contact support.');
        break;
      case 'auth/network-request-failed':
        setError('Network error. Please check your internet connection.');
        break;
      default:
        setError(message || 'An unexpected error occurred. Please try again.');
    }
  };

  const validateInputs = (isSignUpMode: boolean): boolean => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (isSignUpMode && !displayName.trim()) {
      setError('Please enter your display name.');
      return false;
    }
    return true;
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateInputs(false)) return;

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      handleAuthError(err);
      setIsSubmitting(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateInputs(true)) return;

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (err) {
      handleAuthError(err);
      setIsSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      handleAuthError(err);
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-3">
        <div className="p-3 bg-orange-100 text-primary rounded-2xl animate-pulse">
          <ChefHat className="h-8 w-8" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-stone-500 font-medium">Preparing your kitchen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background blob elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-orange-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md z-10 flex flex-col items-center mb-8 text-center">
        <div className="bg-primary text-primary-foreground p-3.5 rounded-2xl shadow-lg shadow-orange-600/20 mb-4 transition-transform hover:scale-105">
          <ChefHat size={36} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 mb-2">PlateUp</h1>
        <p className="text-stone-600 text-base sm:text-lg">Extract recipes. Plan meals. Eat well.</p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md z-10 border-stone-200/80 bg-white/95 backdrop-blur shadow-xl shadow-stone-900/5 rounded-2xl">
        <Tabs defaultValue="signin" className="w-full" onValueChange={() => setError('')}>
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2 bg-stone-100 p-1 rounded-xl">
              <TabsTrigger 
                value="signin" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-xs font-semibold"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-xs font-semibold"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="pt-2">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <TabsContent value="signin" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-stone-700 font-medium">Email Address</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="chef@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required 
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-stone-300 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-stone-700 font-medium">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required 
                      disabled={isSubmitting}
                      className="h-11 pr-10 rounded-lg border-stone-300 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-orange-700 text-primary-foreground h-11 font-semibold rounded-lg shadow-sm mt-2 transition-all" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-stone-700 font-medium">Full Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="Chef Marco"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                    required 
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-stone-300 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-stone-700 font-medium">Email Address</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="chef@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required 
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-stone-300 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-stone-700 font-medium">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required 
                      disabled={isSubmitting}
                      className="h-11 pr-10 rounded-lg border-stone-300 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-orange-700 text-primary-foreground h-11 font-semibold rounded-lg shadow-sm mt-2 transition-all" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Free Account
                </Button>
              </form>
            </TabsContent>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-500 font-medium">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-11 border-stone-300 hover:bg-stone-50 font-medium rounded-lg"
              onClick={onGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </CardContent>
        </Tabs>
      </Card>
      
      <div className="mt-8 text-center text-xs text-stone-500 z-10 max-w-sm">
        By signing in or creating an account, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
