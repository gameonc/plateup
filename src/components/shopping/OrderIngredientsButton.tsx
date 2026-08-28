'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  ExternalLink,
  Info,
  Store,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AFFILIATE_DISCLOSURE_TEXT,
  extractCleanIngredientNames,
  buildAmazonFreshUrl,
  buildInstacartUrl,
} from '@/lib/affiliate';
import { cn } from '@/lib/utils';

export interface OrderIngredientsButtonProps {
  ingredients: { item?: string; name?: string }[] | string[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
  disabled?: boolean;
  showIcon?: boolean;
  showInlineDisclosure?: boolean;
}

export function OrderIngredientsButton({
  ingredients,
  variant = 'outline',
  size = 'default',
  className,
  label = 'Order Ingredients',
  disabled = false,
  showIcon = true,
  showInlineDisclosure = false,
}: OrderIngredientsButtonProps) {
  const [open, setOpen] = useState(false);

  const cleanItems = extractCleanIngredientNames(ingredients, 6);
  const totalCount = Array.isArray(ingredients) ? ingredients.length : 0;
  const isListEmpty = totalCount === 0;

  const amazonUrl = buildAmazonFreshUrl(ingredients);
  const instacartUrl = buildInstacartUrl(ingredients);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          disabled={disabled || isListEmpty}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all cursor-pointer shadow-xs select-none disabled:opacity-50 disabled:cursor-not-allowed',
            variant === 'default' &&
              'bg-primary hover:bg-orange-700 text-primary-foreground',
            variant === 'outline' &&
              'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-400',
            variant === 'secondary' &&
              'bg-stone-100 hover:bg-stone-200 text-stone-900',
            variant === 'ghost' &&
              'hover:bg-stone-100 text-stone-700 shadow-none',
            size === 'sm' && 'h-8 px-3 text-xs',
            size === 'default' && 'h-10 px-4 py-2 text-sm',
            size === 'lg' && 'h-13 px-6 text-base',
            size === 'icon' && 'h-9 w-9 p-0',
            className
          )}
          title={isListEmpty ? 'No ingredients to order' : label}
        >
          {showIcon && <ShoppingCart className={cn('h-4 w-4 shrink-0', size === 'lg' && 'h-5 w-5')} />}
          {size !== 'icon' && <span>{label}</span>}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[480px] rounded-3xl p-5 sm:p-6 gap-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-stone-900">
                  Order Ingredients
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Choose a grocery delivery partner to shop ingredients with one click.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Ingredient Summary Badges */}
          {cleanItems.length > 0 && (
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Pre-filled items ({totalCount} total)
                </span>
                <span className="text-[11px] text-stone-400">Top search terms</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cleanItems.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-white text-stone-800 border border-stone-200 text-xs px-2.5 py-0.5 font-medium shadow-2xs"
                  >
                    {item}
                  </Badge>
                ))}
                {totalCount > cleanItems.length && (
                  <Badge
                    variant="outline"
                    className="text-stone-500 border-dashed text-xs px-2 py-0.5"
                  >
                    +{totalCount - cleanItems.length} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Partner Delivery Options */}
          <div className="space-y-3 pt-1">
            {/* Amazon Fresh Option */}
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 bg-white transition-all group cursor-pointer shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-900">
                      Amazon Fresh
                    </h3>
                    <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 text-[10px] py-0 px-1.5 border-none font-bold">
                      Fast Delivery
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    Search fresh groceries and household essentials on Amazon.
                  </p>
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-amber-700 pl-2 shrink-0">
                <ExternalLink className="h-5 w-5" />
              </div>
            </a>

            {/* Instacart Option */}
            <a
              href={instacartUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-white transition-all group cursor-pointer shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-900">
                      Instacart
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 text-[10px] py-0 px-1.5 border-none font-bold">
                      Local Stores
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    Order from supermarkets near you in as fast as 1 hour.
                  </p>
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-emerald-700 pl-2 shrink-0">
                <ExternalLink className="h-5 w-5" />
              </div>
            </a>
          </div>

          {/* FTC & Affiliate Transparency Disclosure */}
          <div className="flex items-start gap-2 bg-stone-100/70 p-3 rounded-2xl border border-stone-200 text-stone-500 text-[11px] leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-stone-400 mt-0.5" />
            <span>{AFFILIATE_DISCLOSURE_TEXT}</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Optional inline disclosure caption */}
      {showInlineDisclosure && (
        <span className="text-[10px] text-stone-400 italic">
          *Affiliate partner links
        </span>
      )}
    </div>
  );
}
