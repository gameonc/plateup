'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Calendar,
  ShoppingBag,
  LogOut,
  User,
  ChefHat,
  Settings,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ProBadge } from '@/components/monetization/ProBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mobileNavItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Extract', href: '/extract', icon: Sparkles },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Recipes', href: '/recipes', icon: BookOpen },
  { name: 'Meal Plan', mobileName: 'Plan', href: '/meal-plan', icon: Calendar },
  { name: 'Shopping List', mobileName: 'Shop', href: '/shopping-list', icon: ShoppingBag },
];

const desktopNavItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Extract', href: '/extract', icon: Sparkles },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Recipes', href: '/recipes', icon: BookOpen },
  { name: 'Meal Plan', href: '/meal-plan', icon: Calendar },
  { name: 'Shopping List', href: '/shopping-list', icon: ShoppingBag },
  { name: 'Pricing', href: '/pricing', icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const isPro = profile?.plan === 'pro';

  return (
    <>
      {/* Mobile Top Bar (Header with Profile/Logout) */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-stone-200/80 bg-white/95 backdrop-blur px-4">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          aria-label="PlateUp Home"
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-xs">
            <ChefHat className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-bold inline-block text-lg text-stone-900">PlateUp</span>
        </Link>

        <div className="flex items-center gap-2">
          {isPro && (
            <Link 
              href="/pricing" 
              aria-label="PlateUp Pro Plan"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            >
              <ProBadge size="xs" variant="gradient" />
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger 
                className="relative h-8 w-8 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                aria-label="User account menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.photoURL || user.photoURL || ''}
                    alt={profile?.displayName || user.displayName || 'User profile'}
                  />
                  <AvatarFallback className="bg-orange-100 text-primary text-xs font-semibold">
                    {(profile?.displayName || user.displayName)?.charAt(0).toUpperCase() || (
                      <User className="h-4 w-4" aria-hidden="true" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold leading-none text-stone-900 truncate">
                        {profile?.displayName || user.displayName || 'User'}
                      </p>
                      {isPro ? (
                        <ProBadge size="xs" variant="gradient" />
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-none text-stone-500 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer p-0">
                  <Link
                    href="/profile"
                    className="flex items-center w-full px-2 py-1.5 text-stone-700 hover:text-stone-900 focus-visible:outline-none"
                    aria-label="Profile & Settings"
                  >
                    <Settings className="mr-2 h-4 w-4 text-stone-500" aria-hidden="true" />
                    <span>Profile & Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-0">
                  <Link
                    href="/pricing"
                    className="flex items-center w-full px-2 py-1.5 text-stone-700 hover:text-stone-900 focus-visible:outline-none"
                    aria-label={isPro ? 'Subscription & Pricing' : 'Pricing & Upgrade'}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" aria-hidden="true" />
                    <span>{isPro ? 'Subscription & Pricing' : 'Pricing & Upgrade'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-600 focus:text-red-600 cursor-pointer px-2 py-1.5"
                  aria-label="Log out of PlateUp"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="text-xs font-semibold text-stone-600 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1.5 py-1 min-h-[36px] flex items-center"
                aria-label="View pricing plans"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-xs font-semibold text-primary hover:text-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1.5 py-1 min-h-[36px] flex items-center"
                aria-label="Log in to your account"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Navigation (Top) */}
      <nav 
        className="hidden md:flex sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        aria-label="Main Navigation"
      >
        <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 md:gap-8">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              aria-label="PlateUp Home"
            >
              <div className="bg-primary p-1.5 rounded-xl text-primary-foreground shadow-xs">
                <ChefHat className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-extrabold inline-block text-xl tracking-tight text-stone-900">PlateUp</span>
            </Link>
            <div className="flex gap-1 items-center" role="menubar">
              {desktopNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/pricing' && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:text-primary hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive ? 'bg-orange-50 text-primary shadow-2xs' : 'text-stone-600'
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPro && (
              <Link
                href="/pricing"
                className="transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                aria-label="PlateUp Pro Plan"
              >
                <ProBadge size="sm" variant="gradient" />
              </Link>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="relative h-9 w-9 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  aria-label="User account menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.photoURL || user.photoURL || ''}
                      alt={profile?.displayName || user.displayName || 'User profile'}
                    />
                    <AvatarFallback className="bg-orange-100 text-primary font-bold">
                      {(profile?.displayName || user.displayName)?.charAt(0).toUpperCase() || (
                        <User className="h-4 w-4" aria-hidden="true" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold leading-none text-stone-900 truncate">
                          {profile?.displayName || user.displayName || 'User'}
                        </p>
                        {isPro ? (
                          <ProBadge size="xs" variant="gradient" />
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-none text-stone-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link
                      href="/profile"
                      className="flex items-center w-full px-2 py-1.5 text-stone-700 hover:text-stone-900 focus-visible:outline-none"
                      aria-label="Profile & Settings"
                    >
                      <Settings className="mr-2 h-4 w-4 text-stone-500" aria-hidden="true" />
                      <span>Profile & Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link
                      href="/pricing"
                      className="flex items-center w-full px-2 py-1.5 text-stone-700 hover:text-stone-900 focus-visible:outline-none"
                      aria-label={isPro ? 'Subscription & Pricing' : 'Pricing & Upgrade'}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" aria-hidden="true" />
                      <span>{isPro ? 'Subscription & Pricing' : 'Pricing & Upgrade'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer px-2 py-1.5"
                    aria-label="Log out of PlateUp"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-stone-600 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
                  aria-label="View pricing plans"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-orange-700 text-primary-foreground text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Log in to your account"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (Bottom) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-stone-200 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="flex justify-around items-center h-16 px-1 max-w-full">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/pricing' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 space-y-0.5 text-[10px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation select-none',
                  isActive ? 'text-primary' : 'text-stone-500 hover:text-stone-900'
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'fill-orange-100')} aria-hidden="true" />
                <span className="truncate max-w-[54px] text-center leading-tight">{item.mobileName || item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
