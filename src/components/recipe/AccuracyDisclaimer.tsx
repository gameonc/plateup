import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Recipes and their dietary tags are produced by AI and by keyword matching
 * (see detectDietaryTags in lib/extract-recipe), neither of which is reliable
 * enough to be trusted for allergy decisions. A false "nut-free" is a safety
 * risk, so this warning is shown next to the tags rather than only in the
 * footer.
 */
export function AccuracyDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] leading-snug text-amber-700 mt-2">
        AI-generated — verify ingredients yourself. Do not rely on dietary tags
        for allergies.
      </p>
    );
  }

  return (
    <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-amber-600 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed text-amber-800">
        <span className="font-semibold">Check before you cook.</span> This recipe
        and its dietary tags were generated automatically and may be incomplete
        or wrong — including missed allergens. If you have a food allergy or
        intolerance, confirm every ingredient against the original source before
        relying on it.
      </p>
    </div>
  );
}
