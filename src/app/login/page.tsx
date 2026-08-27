'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Loader2 } from 'lucide-react';
// @ts-ignore
import { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuthError = (err: any) => {
    console.error(err);
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('Email is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
    } else {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      handleAuthError(err);
      setIsSubmitting(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signUp(email, password, displayName);
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
      <div className="min-h-screen flex items-center justify-center bg-orange-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md z-10 flex flex-col items-center mb-8">
        <div className="bg-orange-600 text-white p-3 rounded-2xl shadow-lg mb-4">
          <ChefHat size={40} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-2">PlateUp</h1>
        <p className="text-stone-500 text-center text-lg">Extract recipes. Plan meals. Eat well.</p>
      </div>

      <Card className="w-full max-w-md z-10 border-orange-100 shadow-xl shadow-orange-900/5">
        <Tabs defaultValue="signin" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2 bg-stone-100/80">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}

            <TabsContent value="signin" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="chef@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                  </div>
                  <Input 
                    id="signin-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="Gordon Ramsay"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="chef@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-500">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              className="w-full border-stone-200"
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
      
      <div className="mt-8 text-center text-sm text-stone-500 z-10">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
