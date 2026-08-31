import Link from 'next/link';
import { 
  ChefHat, 
  LayoutDashboard, 
  BookOpen, 
  Compass, 
  Calendar, 
  ArrowRight,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  const quickLinks = [
    {
      title: 'Dashboard',
      description: 'Your cooking overview, weekly meals, and fast actions.',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Recipes',
      description: 'Access and search your personal extracted recipe collection.',
      href: '/recipes',
      icon: BookOpen,
    },
    {
      title: 'Discover Recipes',
      description: 'Browse thousands of curated dishes across global cuisines.',
      href: '/discover',
      icon: Compass,
    },
    {
      title: 'Meal Planner',
      description: 'Plan your weekly breakfast, lunch, and dinner schedule.',
      href: '/meal-plan',
      icon: Calendar,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      {/* Top Brand Bar */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          aria-label="PlateUp Home"
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-xs">
            <ChefHat className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-bold text-lg text-stone-900 tracking-tight">PlateUp</span>
        </Link>

        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="rounded-xl border-stone-200 hover:bg-stone-100 text-xs font-semibold cursor-pointer">
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full max-w-2xl text-center space-y-8">
          
          {/* Visual Illustration / Badge */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-orange-100 text-primary flex items-center justify-center shadow-md shadow-orange-100/50 border border-orange-200/60 animate-pulse">
                <ChefHat className="w-12 h-12 sm:w-14 sm:h-14" />
              </div>
              <span className="absolute -bottom-2.5 -right-2.5 px-2.5 py-0.5 bg-primary text-primary-foreground font-black text-xs sm:text-sm rounded-full shadow-xs">
                404
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-orange-50 border border-orange-200/80 px-3 py-1 rounded-full">
                Page Not Found
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Oops! We Couldn&apos;t Find That Recipe.
              </h1>
              <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                The page you are looking for might have been moved, removed, or never simmered up in our kitchen. Let&apos;s get you back on track.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto px-6 bg-primary hover:bg-orange-700 text-primary-foreground font-semibold rounded-xl shadow-xs cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/discover" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto px-6 rounded-xl border-stone-300 hover:bg-stone-100 font-semibold cursor-pointer">
                <Compass className="mr-2 h-4 w-4" />
                Discover Recipes
              </Button>
            </Link>
          </div>

          {/* Quick Helpful Navigation Cards */}
          <div className="pt-6 border-t border-stone-200">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-4 text-left">
              Helpful Destinations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-orange-50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900 group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
