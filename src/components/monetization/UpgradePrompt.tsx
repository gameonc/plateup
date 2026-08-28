import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { ProBadge } from './ProBadge';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  variant?: 'card' | 'banner' | 'inline';
  compact?: boolean;
  className?: string;
}

export function UpgradePrompt({
  title = "Unlock Unlimited Recipe Extractions with PlateUp Pro",
  description = "You've enjoyed your 5 free AI extractions this month! Ready to explore even more delicious recipes? Upgrade to PlateUp Pro for unlimited video & photo extractions, priority processing, and intelligent meal planning.",
  variant = 'card',
  compact = false,
  className = '',
}: UpgradePromptProps) {
  const proFeatures = [
    'Unlimited YouTube & Photo recipe extractions',
    'Smart auto-fill & dietary weekly meal planning',
    'Instant grocery ordering & consolidated shopping lists',
    'Priority AI processing speed & early feature access',
  ];

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-orange-200/80 rounded-2xl p-4 sm:p-5 text-stone-800 ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                {title}
                <ProBadge size="xs" variant="gradient" />
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <Link href="/pricing" className="w-full sm:w-auto shrink-0">
            <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm text-sm font-semibold gap-1.5 rounded-xl cursor-pointer">
              <Crown className="w-4 h-4 text-amber-200 fill-amber-300" />
              Upgrade to Pro
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`border-orange-200/80 bg-gradient-to-b from-orange-50/70 via-white to-amber-50/40 shadow-sm rounded-2xl overflow-hidden ${className}`}
    >
      <CardContent className={compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'}>
        <div className="flex flex-col items-center text-center max-w-xl mx-auto">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-orange-300 rounded-full blur-md opacity-40 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3.5 rounded-2xl shadow-md">
              <Crown className="h-7 w-7 text-amber-200 fill-amber-300" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>PlateUp Pro Experience</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {title}
          </h3>

          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            {description}
          </p>

          {!compact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left w-full my-6 bg-white/90 border border-orange-100 p-4 rounded-xl shadow-2xs">
              {proFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button
                size={compact ? "default" : "lg"}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-md gap-2 rounded-xl cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Go Pro for $4.99/mo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-stone-500 mt-3.5">
            Includes 14-day satisfaction guarantee • Cancel anytime with one click
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default UpgradePrompt;
