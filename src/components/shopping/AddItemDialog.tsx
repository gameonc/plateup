'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GROCERY_DEPARTMENTS, type GroceryDepartment } from '@/types';
import { toast } from '@/components/ui/toast';

interface AddItemDialogProps {
  onAddItem: (
    name: string,
    category: GroceryDepartment,
    amount?: string,
    unit?: string
  ) => Promise<unknown>;
}

export function AddItemDialog({ onAddItem }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroceryDepartment>('Other');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.create({
        title: 'Item Name Required',
        description: 'Please enter an item name.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      await onAddItem(cleanName, category, amount.trim(), unit.trim());
      toast.create({
        title: 'Item Added',
        description: `Added "${cleanName}" to ${category}.`,
        type: 'success',
      });
      setName('');
      setAmount('');
      setUnit('');
      setCategory('Other');
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.create({
        title: 'Failed to Add Item',
        description: 'An error occurred while adding the item.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-orange-700 text-primary-foreground font-semibold shadow-xs px-4 py-2 text-sm cursor-pointer transition-all">
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stone-900">Add Custom Item</DialogTitle>
          <DialogDescription className="text-stone-500 text-xs">
            Add any grocery or household item to your shopping list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name" className="text-xs font-semibold text-stone-700">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-name"
              placeholder="e.g. Paper Towels, Oat Milk, Sourdough"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-stone-300 focus-visible:ring-primary text-sm"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-amount" className="text-xs font-semibold text-stone-700">
                Quantity / Amount
              </Label>
              <Input
                id="item-amount"
                placeholder="e.g. 2, 1 1/2, 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border-stone-300 focus-visible:ring-primary text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-unit" className="text-xs font-semibold text-stone-700">
                Unit
              </Label>
              <Input
                id="item-unit"
                placeholder="e.g. cans, lbs, bags, items"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-xl border-stone-300 focus-visible:ring-primary text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-category" className="text-xs font-semibold text-stone-700">
              Store Department
            </Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as GroceryDepartment)}
            >
              <SelectTrigger id="item-category" className="rounded-xl border-stone-300 focus-visible:ring-primary">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GROCERY_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept} className="cursor-pointer">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary hover:bg-orange-700 text-primary-foreground font-semibold shadow-xs"
              disabled={submitting || !name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to List'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
