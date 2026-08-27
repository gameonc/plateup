'use client';

import React, { useState } from 'react';
import { 
  User, 
  ChefHat, 
  Save, 
  Loader2, 
  Check, 
  Calendar, 
  Sparkles,
  Sliders,
  ShieldCheck,
  Leaf,
  Fish,
  WheatOff,
  MilkOff,
  Flame,
  Scale,
  Ban
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';
import { DIETARY_OPTIONS, type DietaryRestriction, type MealTime, type UserProfile, type UserPreferences } from '@/types';
import { cn } from '@/lib/utils';

function ProfileForm({
  profile,
  preferences,
  userEmail,
  userPhotoURL,
  onSaveProfile,
  onSavePreferences,
}: {
  profile: UserProfile | null;
  preferences: UserPreferences;
  userEmail?: string | null;
  userPhotoURL?: string | null;
  onSaveProfile: (data: { displayName: string }) => Promise<void>;
  onSavePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName || 'Chef');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>(
    preferences.dietaryRestrictions || []
  );
  const [repeatWindowDays, setRepeatWindowDays] = useState(preferences.repeatWindowDays ?? 5);
  const [mealsPerDay, setMealsPerDay] = useState<MealTime[]>(
    preferences.mealsPerDay || ['breakfast', 'lunch', 'dinner']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    setDietaryRestrictions((prev) => {
      const next = prev.includes(restriction)
        ? prev.filter((item) => item !== restriction)
        : [...prev, restriction];
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const toggleMealTime = (meal: MealTime) => {
    setMealsPerDay((prev) => {
      let next: MealTime[];
      if (prev.includes(meal)) {
        if (prev.length <= 1) {
          toast.create({
            title: 'At least one meal required',
            description: 'You must have at least one meal time enabled for your meal plan.',
            type: 'warning',
          });
          return prev;
        }
        next = prev.filter((m) => m !== meal);
      } else {
        next = [...prev, meal];
      }
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (displayName !== profile?.displayName) {
        await onSaveProfile({ displayName });
      }

      await onSavePreferences({
        dietaryRestrictions,
        repeatWindowDays,
        mealsPerDay,
      });

      setHasUnsavedChanges(false);
      toast.create({
        title: 'Preferences Saved! ✨',
        description: 'Your dietary and meal planning settings have been updated.',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to save profile preferences:', err);
      toast.create({
        title: 'Error Saving Settings',
        description: 'Could not save your preferences. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearAllDietary = () => {
    setDietaryRestrictions([]);
    setHasUnsavedChanges(true);
  };

  const selectAllDietary = () => {
    setDietaryRestrictions(DIETARY_OPTIONS.map((o) => o.id));
    setHasUnsavedChanges(true);
  };

  const getDietaryIcon = (id: DietaryRestriction) => {
    switch (id) {
      case 'vegetarian':
        return <Leaf className="h-4 w-4 text-emerald-600" />;
      case 'vegan':
        return <Sparkles className="h-4 w-4 text-green-600" />;
      case 'gluten-free':
        return <WheatOff className="h-4 w-4 text-amber-600" />;
      case 'dairy-free':
        return <MilkOff className="h-4 w-4 text-blue-600" />;
      case 'keto':
        return <Flame className="h-4 w-4 text-purple-600" />;
      case 'low-carb':
        return <Scale className="h-4 w-4 text-indigo-600" />;
      case 'pescatarian':
        return <Fish className="h-4 w-4 text-cyan-600" />;
      case 'nut-free':
        return <Ban className="h-4 w-4 text-rose-600" />;
      default:
        return <ChefHat className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className={cn(
            "bg-primary hover:bg-orange-700 text-primary-foreground font-semibold rounded-xl shadow-xs transition-all",
            hasUnsavedChanges && "ring-2 ring-orange-400 ring-offset-2 animate-pulse"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Account Info Card */}
      <Card className="border-stone-200/80 rounded-2xl shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-stone-50/60 border-b border-stone-100 pb-4">
          <CardTitle className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account Profile
          </CardTitle>
          <CardDescription className="text-xs text-stone-500">
            Your personal account details and display name
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-orange-200">
              <AvatarImage src={userPhotoURL || ''} alt={displayName || 'User'} />
              <AvatarFallback className="bg-orange-100 text-primary text-xl font-bold">
                {displayName?.charAt(0).toUpperCase() || <ChefHat className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-lg">{displayName || 'Chef'}</h3>
                <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-900 font-semibold">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Active Member
                </Badge>
              </div>
              <p className="text-xs text-stone-500">{userEmail || 'Logged in user'}</p>
              {profile?.createdAt && (
                <p className="text-[11px] text-stone-400">
                  Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Display Name
              </label>
              <Input
                id="display-name"
                type="text"
                placeholder="Your Name"
                className="rounded-xl border-stone-300 focus-visible:ring-primary bg-white"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                id="email-address"
                type="email"
                value={userEmail || ''}
                disabled
                className="rounded-xl border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences Card */}
      <Card className="border-stone-200/80 rounded-2xl shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-stone-50/60 border-b border-stone-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                Dietary Preferences & Restrictions (R4)
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Recipes and meal plans will be filtered and curated to match your dietary profile
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {dietaryRestrictions.length} Active
              </Badge>
              {dietaryRestrictions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllDietary}
                  className="h-7 text-xs text-stone-500 hover:text-red-600 hover:bg-red-50 px-2 rounded-lg cursor-pointer"
                >
                  Clear all
                </Button>
              )}
              {dietaryRestrictions.length === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllDietary}
                  className="h-7 text-xs text-stone-500 hover:text-primary hover:bg-orange-50 px-2 rounded-lg cursor-pointer"
                >
                  Select all
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = dietaryRestrictions.includes(option.id);
              return (
                <div
                  key={option.id}
                  onClick={() => toggleDietaryRestriction(option.id)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-orange-50/60 border-primary text-stone-900 shadow-xs"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 text-stone-700"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-stone-300 bg-white"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {getDietaryIcon(option.id)}
                      <span className="font-bold text-sm text-stone-900">{option.label}</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {dietaryRestrictions.length === 0 && (
            <p className="text-xs text-stone-400 italic text-center pt-2">
              No restrictions selected. All recipes and meal suggestions will be available without filter.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meal Planning Preferences Card */}
      <Card className="border-stone-200/80 rounded-2xl shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-stone-50/60 border-b border-stone-100 pb-4">
          <CardTitle className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Smart Meal Planning Preferences
          </CardTitle>
          <CardDescription className="text-xs text-stone-500">
            Configure how the auto-fill engine generates your weekly menu
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Repeat Window Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="repeat-window" className="text-sm font-bold text-stone-900 block">
                  Recipe Repeat Window
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Avoid auto-filling recipes cooked in the last {repeatWindowDays} {repeatWindowDays === 1 ? 'day' : 'days'}.
                </p>
              </div>
              <Badge className="text-sm font-extrabold bg-orange-100 text-primary border-none px-3 py-1 rounded-xl">
                {repeatWindowDays} {repeatWindowDays === 1 ? 'day' : 'days'}
              </Badge>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <input
                id="repeat-window"
                type="range"
                min="1"
                max="14"
                step="1"
                value={repeatWindowDays}
                onChange={(e) => {
                  setRepeatWindowDays(parseInt(e.target.value, 10));
                  setHasUnsavedChanges(true);
                }}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>
            <div className="flex justify-between text-[11px] text-stone-400 px-1 font-medium">
              <span>1 day (Frequent repeats)</span>
              <span>7 days (Weekly variety)</span>
              <span>14 days (Maximum variety)</span>
            </div>
          </div>

          {/* Default Planned Meals Per Day */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <div>
              <label className="text-sm font-bold text-stone-900 block">
                Daily Planned Meal Slots
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Select which meal times to include in your weekly planning grid
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {(['breakfast', 'lunch', 'dinner'] as MealTime[]).map((meal) => {
                const isChecked = mealsPerDay.includes(meal);
                return (
                  <div
                    key={meal}
                    onClick={() => toggleMealTime(meal)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                      isChecked
                        ? "bg-orange-50/60 border-primary text-stone-900"
                        : "bg-white border-stone-200 hover:border-stone-300 text-stone-600"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isChecked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-stone-300 bg-white"
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="font-bold text-sm capitalize">{meal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={isSaving}
          className="w-full sm:w-auto bg-primary hover:bg-orange-700 text-primary-foreground font-bold px-8 h-12 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving Preferences...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, preferences, loading, updatePreferences, updateUserProfile } = useProfile();

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded-xl w-48 mb-6" />
        <div className="h-64 bg-stone-200 rounded-2xl" />
        <div className="h-80 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 text-primary rounded-2xl shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Profile & Settings</h1>
            <p className="text-xs text-stone-500 mt-0.5">Customize your dietary rules and smart meal planning</p>
          </div>
        </div>
      </div>

      <ProfileForm
        key={profile?.uid || user?.uid || 'profile-form'}
        profile={profile}
        preferences={preferences}
        userEmail={user?.email}
        userPhotoURL={user?.photoURL}
        onSaveProfile={updateUserProfile}
        onSavePreferences={updatePreferences}
      />
    </div>
  );
}
