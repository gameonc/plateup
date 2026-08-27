'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, BookOpen, Calendar, ShoppingBag, LogOut, User, ChefHat, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Extract', href: '/extract', icon: Sparkles },
  { name: 'Recipes', href: '/recipes', icon: BookOpen },
  { name: 'Meal Plan', href: '/meal-plan', icon: Calendar },
  { name: 'Shopping List', mobileName: 'Shopping', href: '/shopping-list', icon: ShoppingBag },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile Top Bar (Header with Profile/Logout) */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-stone-200/80 bg-white/95 backdrop-blur px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-xs">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="font-bold inline-block text-lg text-stone-900">PlateUp</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback className="bg-orange-100 text-primary text-xs font-semibold">
                    {user.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-stone-900">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-stone-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer p-0">
                  <Link href="/profile" className="flex items-center w-full px-1.5 py-1 text-stone-700 hover:text-stone-900">
                    <Settings className="mr-2 h-4 w-4 text-stone-500" />
                    <span>Profile & Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Desktop Navigation (Top) */}
      <nav className="hidden md:flex sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="bg-primary p-1.5 rounded-xl text-primary-foreground shadow-xs">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="font-extrabold inline-block text-xl tracking-tight text-stone-900">PlateUp</span>
            </Link>
            <div className="flex gap-1 items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:text-primary hover:bg-orange-50",
                      isActive ? "bg-orange-50 text-primary shadow-2xs" : "text-stone-600"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-orange-100 text-primary font-bold">
                      {user.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-stone-900">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-stone-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link href="/profile" className="flex items-center w-full px-1.5 py-1 text-stone-700 hover:text-stone-900">
                      <Settings className="mr-2 h-4 w-4 text-stone-500" />
                      <span>Profile & Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-stone-200 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-semibold transition-colors",
                  isActive ? "text-primary" : "text-stone-500 hover:text-stone-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "fill-orange-100")} />
                <span>{item.mobileName || item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
