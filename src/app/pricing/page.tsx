'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Check, 
  Crown, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  Loader2, 
  XCircle, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { PRO_MONTHLY_PRICE_USD } from '@/lib/stripe';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [dismissedCancelled, setDismissedCancelled] = useState(false);

  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status');
  const cancelledNotice = status === 'cancelled' && !dismissedCancelled;

  // Handle post-checkout redirect params (?session_id=...&status=success)
  useEffect(() => {
    let isMounted = true;

    if (status === 'success' && sessionId) {
      const verify = async () => {
        setVerifyingSession(true);
        try {
          const res = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId: user?.uid,
            }),
          });
          const data = await res.json();
          if (!isMounted) return;

          if (data.success) {
            setVerificationSuccess(true);
            toast.create({
              title: '🎉 Welcome to PlateUp Pro!',
              description: 'Your subscription is now active. Enjoy unlimited AI extractions!',
              type: 'success',
            });
          } else {
            setVerificationError(data.error || 'Failed to verify checkout session.');
            toast.create({
              title: 'Verification Notice',
              description: data.error || 'Could not verify your checkout session.',
              type: 'error',
            });
          }
        } catch (err) {
          if (!isMounted) return;
          setVerificationError(err instanceof Error ? err.message : 'Network error while verifying checkout.');
        } finally {
          if (isMounted) {
            setVerifyingSession(false);
          }
        }
      };

      verify();
    }

    return () => {
      isMounted = false;
    };
  }, [status, sessionId, user?.uid]);

  const isPro = profile?.plan === 'pro';

  const handleGoPro = async () => {
    if (!user) {
      router.push('/login?redirect=%2Fpricing');
      return;
    }

    if (isPro) {
      router.push('/profile');
      return;
    }

    setIsLoadingCheckout(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          returnUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initiate checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.create({
        title: 'Checkout Error',
        description: err instanceof Error ? err.message : 'Could not start checkout. Please try again.',
        type: 'error',
      });
      setIsLoadingCheckout(false);
    }
  };

  const featureComparison = [
    {
      feature: 'AI YouTube Recipe Extractions',
      free: '5 extractions / month',
      pro: 'Unlimited extractions',
      highlight: true,
    },
    {
      feature: 'AI Photo & Screenshot Extractions',
      free: '5 extractions / month',
      pro: 'Unlimited extractions',
      highlight: true,
    },
    {
      feature: 'TheMealDB Recipe Discovery',
      free: 'Free & unlimited',
      pro: 'Free & unlimited',
    },
    {
      feature: 'Weekly Smart Meal Planner',
      free: 'Full access',
      pro: 'Full access + priority auto-fill',
    },
    {
      feature: 'Smart Shopping List Aggregation',
      free: 'Full access',
      pro: 'Full access',
    },
    {
      feature: '1-Click Partner Grocery Ordering (Amazon Fresh & Instacart)',
      free: 'Included',
      pro: 'Included',
    },
    {
      feature: 'Dietary & Allergy Preference Filtering',
      free: 'Included',
      pro: 'Included',
    },
    {
      feature: 'AI Processing Speed',
      free: 'Standard',
      pro: 'Priority Turbo Speed',
    },
    {
      feature: 'Pro Member Crown Badge',
      free: '—',
      pro: 'Shiny Crown in Navbar & Profile',
      highlight: true,
    },
    {
      feature: 'Ad-Free Kitchen Experience',
      free: '—',
      pro: '100% Ad-Free',
    },
    {
      feature: 'Customer Support',
      free: 'Community Support',
      pro: 'Priority Email Support',
    },
  ];

  const faqs = [
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes, absolutely! There are no long-term contracts or cancellation fees. You can cancel with one click from your Profile page whenever you want.',
    },
    {
      q: 'What happens to my saved recipes if I cancel?',
      a: 'Every recipe you have extracted or saved stays in your account forever. You will never lose access to your personal recipe library or meal plans.',
    },
    {
      q: 'How does the monthly free extraction limit work?',
      a: 'Free accounts receive 5 complimentary AI extractions (YouTube videos and photos combined) per calendar month. Your quota automatically resets on the 1st day of each month.',
    },
    {
      q: 'Is TheMealDB Discover page free for everyone?',
      a: 'Yes! Searching, viewing, and saving recipes from TheMealDB on the Discover page is 100% free and unlimited for all users, even if you reach your AI extraction limit.',
    },
    {
      q: 'How secure is my payment information?',
      a: 'All payment processing is handled securely through Stripe with industry-leading encryption. PlateUp never stores your credit card details.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-orange-50/30 text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Verification Status Banners */}
        {verifyingSession && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-3 text-orange-900 shadow-xs animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-primary shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Verifying your subscription...</h4>
              <p className="text-xs text-orange-700">Please wait while we activate your Pro membership perks.</p>
            </div>
          </div>
        )}

        {verificationSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-emerald-900 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  Upgrade Successful! You are now PlateUp Pro
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your account has been upgraded to Pro. Enjoy unlimited recipe extractions!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link href="/extract" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                  Start Extracting
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {cancelledNotice && (
          <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-stone-700 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-stone-500 shrink-0" />
              <p className="text-xs sm:text-sm">
                Checkout was cancelled. No charges were made. Feel free to upgrade whenever you are ready!
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissedCancelled(true)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        {verificationError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3 text-red-900 shadow-xs">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Session Verification Notice</h4>
              <p className="text-xs text-red-700">{verificationError}</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
            Cook smarter with <span className="text-primary">PlateUp Pro</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            Extract unlimited YouTube videos and photos into structured recipes, plan weekly meals seamlessly, and order ingredients in 1 click.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Tier Card */}
          <Card className="border-stone-200/90 rounded-3xl shadow-sm bg-white flex flex-col justify-between hover:border-stone-300 transition-all">
            <div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="outline" className="border-stone-300 text-stone-600 font-bold text-xs uppercase px-2.5 py-0.5">
                    Free Starter
                  </Badge>
                  {!isPro && user && (
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      Current Plan
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl font-black text-stone-900">Free Tier</CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Essential tools for casual home cooks exploring AI recipe extraction.
                </CardDescription>

                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-stone-900">$0</span>
                  <span className="text-stone-500 text-sm font-medium">/ month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">What’s included:</p>
                <ul className="space-y-3 text-xs sm:text-sm text-stone-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>5 AI extractions / month</strong> (YouTube & photos)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>TheMealDB recipe discovery & search</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Weekly meal planner & auto-fill</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Smart shopping list with grocery store links</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Dietary & allergy preference filtering</span>
                  </li>
                </ul>
              </CardContent>
            </div>

            <CardFooter className="pt-6">
              <Link href={user ? "/dashboard" : "/login"} className="w-full">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-12 font-bold border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {user ? "Continue with Free Plan" : "Get Started Free"}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pro Tier Card */}
          <Card className="border-2 border-primary/80 rounded-3xl shadow-xl bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-orange-600 text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Most Popular
            </div>

            <div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-1">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground font-extrabold text-xs uppercase px-2.5 py-0.5 flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                    PlateUp Pro
                  </Badge>
                  {isPro && (
                    <span className="text-xs font-extrabold text-primary bg-orange-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Active Plan
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl font-black text-stone-900">Pro Unlimited</CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Unrestricted culinary power for passionate foodies and busy meal planners.
                </CardDescription>

                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-stone-900">${PRO_MONTHLY_PRICE_USD.toFixed(2)}</span>
                  <span className="text-stone-500 text-sm font-medium">/ month</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Billed monthly • Cancel anytime in 1 click</p>
              </CardHeader>

              <CardContent className="space-y-4 pt-2 border-t border-orange-100">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Everything in Free, plus:</p>
                <ul className="space-y-3 text-xs sm:text-sm text-stone-800">
                  <li className="flex items-start gap-2.5 font-bold text-stone-900">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Unlimited AI Recipe Extractions</strong> (No monthly cap!)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Priority AI Processing Speed</strong> for instant results</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Shiny <strong>Pro Crown Badge</strong> next to your avatar</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>100% Ad-Free</strong> kitchen experience</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Early access to new smart meal planning features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Priority email & developer support</span>
                  </li>
                </ul>
              </CardContent>
            </div>

            <CardFooter className="pt-6">
              <Button
                onClick={handleGoPro}
                disabled={isLoadingCheckout || isPro}
                size="lg"
                className={cn(
                  "w-full rounded-2xl h-12 font-extrabold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2",
                  isPro 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-default"
                    : "bg-gradient-to-r from-primary via-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white hover:shadow-lg"
                )}
              >
                {isLoadingCheckout ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Opening Stripe Checkout...</span>
                  </>
                ) : isPro ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>You&apos;re on PlateUp Pro</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Go Pro for ${PRO_MONTHLY_PRICE_USD.toFixed(2)}/mo</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Compare Plans & Features</h2>
            <p className="text-xs sm:text-sm text-stone-500">Every feature designed to elevate your everyday cooking</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-stone-500 w-1/2">
                      Feature
                    </th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-stone-500 text-center w-1/4">
                      Free ($0/mo)
                    </th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-primary text-center w-1/4 bg-orange-50/60">
                      Pro ($4.99/mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                  {featureComparison.map((row, idx) => (
                    <tr key={idx} className={row.highlight ? "bg-orange-50/20" : "hover:bg-stone-50/50"}>
                      <td className="py-3.5 px-5 font-medium text-stone-900">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-600 font-medium">
                        {row.free}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-primary bg-orange-50/40">
                        {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trust & Guarantee Section */}
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-orange-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex p-3 bg-white text-primary rounded-2xl shadow-xs mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-stone-900">100% Satisfaction Guarantee</h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Try PlateUp Pro risk-free. If you don&apos;t love the unlimited recipe extractions and streamlined meal planning, cancel anytime in your profile with zero friction.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900">Got questions? We&apos;ve got answers.</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border-stone-200/80 rounded-2xl shadow-xs bg-white">
                <CardHeader className="py-4 px-5">
                  <CardTitle className="text-sm sm:text-base font-bold text-stone-900">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-4 px-5">
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-stone-500 font-medium">Loading pricing options...</p>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
