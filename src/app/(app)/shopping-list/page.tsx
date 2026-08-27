'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  Trash2,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Carrot,
  Egg,
  Beef,
  Package,
  Flame,
  Croissant,
  Snowflake,
  HelpCircle,
  Loader2,
  CheckCheck,
  CookingPot,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek, getYear } from 'date-fns';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { AddItemDialog } from '@/components/shopping/AddItemDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { GROCERY_DEPARTMENTS, type GroceryDepartment, type ShoppingListItem } from '@/types';
import { cn } from '@/lib/utils';

function getISOWeekId(date: Date): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}

const DEPARTMENT_ICONS: Record<GroceryDepartment, React.ComponentType<{ className?: string }>> = {
  Produce: Carrot,
  Dairy: Egg,
  'Meat/Seafood': Beef,
  Pantry: Package,
  'Spices/Seasonings': Flame,
  Bakery: Croissant,
  Frozen: Snowflake,
  Other: HelpCircle,
};

export default function ShoppingListPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentWeekId = getISOWeekId(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const {
    items,
    loading: shoppingLoading,
    uncheckedCount,
    checkedCount,
    generateFromMealPlan,
    addItem,
    toggleItemCheck,
    removeItem,
    clearCheckedItems,
    clearList,
  } = useShoppingList(currentWeekId);

  const { mealPlan, loading: mealPlanLoading } = useMealPlan(currentWeekId);
  const { recipes, loading: recipesLoading } = useRecipes();

  const [activeFilter, setActiveFilter] = useState<'all' | 'remaining' | 'completed'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleNextWeek = () => setCurrentDate((prev) => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate((prev) => subWeeks(prev, 1));

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      if (!mealPlan || !mealPlan.meals) {
        toast.create({
          title: 'No Meal Plan Found',
          description: 'Please assign recipes to your meal plan first.',
          type: 'warning',
        });
        return;
      }

      const generated = await generateFromMealPlan(mealPlan, recipes);
      if (generated.length === 0) {
        toast.create({
          title: 'No Meals Planned',
          description: 'Your current meal plan has no recipes assigned.',
          type: 'info',
        });
      } else {
        toast.create({
          title: 'Shopping List Generated! 🛒',
          description: `Aggregated ${generated.length} grocery items from your meal plan.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      toast.create({
        title: 'Error Generating List',
        description: 'Failed to aggregate ingredients from meal plan.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChecked = async () => {
    try {
      await clearCheckedItems();
      toast.create({
        title: 'Cleared Checked Items',
        description: 'Completed items have been removed from your list.',
        type: 'info',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearList();
      toast.create({
        title: 'List Cleared',
        description: 'All items have been removed from your shopping list.',
        type: 'info',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'remaining') return items.filter((i) => !i.checked);
    if (activeFilter === 'completed') return items.filter((i) => i.checked);
    return items;
  }, [items, activeFilter]);

  // Group filtered items by department
  const filteredDepartments = useMemo(() => {
    const groups: Partial<Record<GroceryDepartment, ShoppingListItem[]>> = {};

    for (const dept of GROCERY_DEPARTMENTS) {
      const deptItems = filteredItems.filter((i) => {
        const itemCat = (i.category as GroceryDepartment) || 'Other';
        return itemCat === dept;
      });
      if (deptItems.length > 0) {
        groups[dept] = deptItems;
      }
    }

    return groups;
  }, [filteredItems]);

  const isLoading = shoppingLoading || mealPlanLoading || recipesLoading;

  if (isLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 py-6 animate-pulse">
        <div className="h-10 bg-stone-200 rounded-xl w-1/3" />
        <div className="h-14 bg-stone-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-stone-200 rounded-2xl" />
          <div className="h-48 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 py-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-orange-100 rounded-xl flex items-center justify-center text-primary shadow-xs">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
              Shopping List
            </h1>
            <p className="text-xs text-stone-500">
              Aggregated grocery items for your weekly meal plan
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <AddItemDialog onAddItem={addItem} />

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-xl bg-orange-50 hover:bg-orange-100 text-primary border border-orange-200 font-semibold shadow-2xs"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate from Plan
          </Button>

          {checkedCount > 0 && (
            <Button
              variant="outline"
              onClick={handleClearChecked}
              className="rounded-xl border-stone-300 hover:bg-stone-100 text-stone-700 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Clear Done ({checkedCount})
            </Button>
          )}

          {items.length > 0 && (
            <Dialog>
              <DialogTrigger
                className="inline-flex items-center justify-center rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 cursor-pointer transition-colors"
                title="Clear entire shopping list"
              >
                <Trash2 className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Clear Shopping List</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete all {items.length} items from your shopping list for this week?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={handleClearAll}
                    disabled={isClearingAll}
                  >
                    {isClearingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Yes, Clear All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Week Navigation & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-stone-200/80 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            className="rounded-xl hover:bg-stone-100 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4 text-stone-700" />
          </Button>
          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
            className="rounded-xl hover:bg-stone-100 h-8 w-8"
          >
            <ChevronRight className="h-4 w-4 text-stone-700" />
          </Button>
        </div>

        {/* Status Counter Chips */}
        <div className="flex items-center gap-2 justify-end">
          <Badge variant="secondary" className="rounded-lg bg-stone-100 text-stone-700 font-semibold px-2.5 py-1">
            {items.length} Total
          </Badge>
          <Badge className="rounded-lg bg-orange-100 text-primary border-none font-semibold px-2.5 py-1">
            {uncheckedCount} Remaining
          </Badge>
          {checkedCount > 0 && (
            <Badge className="rounded-lg bg-emerald-100 text-emerald-800 border-none font-semibold px-2.5 py-1">
              {checkedCount} Done
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {items.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
              activeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('remaining')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
              activeFilter === 'remaining'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            To Buy ({uncheckedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            Completed ({checkedCount})
          </button>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <Card className="border-dashed border-stone-300 bg-stone-50/50 rounded-3xl p-8 sm:p-12 text-center shadow-none">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-xs">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900">Your shopping list is empty</h2>
              <p className="text-sm text-stone-500">
                Generate all ingredients automatically from your weekly meal plan, or add custom grocery items.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto rounded-xl bg-primary hover:bg-orange-700 text-primary-foreground font-semibold shadow-xs"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate from Meal Plan
              </Button>
              <Link href="/meal-plan" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-xl border-stone-300">
                  <Calendar className="h-4 w-4 mr-2 text-stone-600" />
                  View Meal Planner
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Filtered 0-State */}
      {items.length > 0 && Object.keys(filteredDepartments).length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
          {activeFilter === 'remaining'
            ? '🎉 All items are checked off! Great shopping trip.'
            : 'No completed items yet. Check off items as you shop!'}
        </div>
      )}

      {/* Department Grouped Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(Object.entries(filteredDepartments) as [GroceryDepartment, ShoppingListItem[]][]).map(
          ([department, deptItems]) => {
            const Icon = DEPARTMENT_ICONS[department] || Package;
            const deptUnchecked = deptItems.filter((i) => !i.checked).length;

            return (
              <Card
                key={department}
                className="rounded-2xl border-stone-200/80 bg-white shadow-xs overflow-hidden"
              >
                <CardHeader className="py-3 px-4 bg-stone-50/80 border-b border-stone-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-orange-100 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{department}</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-semibold bg-white border border-stone-200">
                    {deptUnchecked > 0 ? `${deptUnchecked} remaining` : `${deptItems.length} done`}
                  </Badge>
                </CardHeader>

                <CardContent className="p-2 divide-y divide-stone-100">
                  {deptItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemCheck(item.id)}
                      className={cn(
                        'flex items-start justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer group select-none hover:bg-stone-50',
                        item.checked && 'opacity-60 bg-stone-50/50'
                      )}
                    >
                      {/* Checkbox */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            item.checked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 bg-white group-hover:border-primary'
                          )}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {/* Item Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-sm font-medium transition-all text-stone-900',
                                item.checked && 'line-through text-stone-400'
                              )}
                            >
                              {item.name}
                            </span>
                            {item.displayAmount && (
                              <span
                                className={cn(
                                  'text-xs font-bold text-primary',
                                  item.checked && 'text-stone-400 line-through'
                                )}
                              >
                                {item.displayAmount}
                              </span>
                            )}
                          </div>

                          {/* Contributing Recipes or Custom Badge */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.isCustom && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 h-4 text-stone-500 border-stone-200"
                              >
                                Custom
                              </Badge>
                            )}
                            {item.recipeTitles &&
                              item.recipeTitles.map((title, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-[10px] py-0 px-1.5 h-4 bg-orange-50 text-stone-600 border border-orange-100 flex items-center gap-1 max-w-[200px] truncate"
                                  title={`Needed for: ${title}`}
                                >
                                  <CookingPot className="h-2.5 w-2.5 text-primary shrink-0" />
                                  <span className="truncate">{title}</span>
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded-md transition-opacity cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    </div>
  );
}
