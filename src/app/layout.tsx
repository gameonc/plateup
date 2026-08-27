import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'PlateUp | AI Recipe & Meal Planner',
  description: 'Extract recipes from YouTube and smart meal plan with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-stone-50 text-stone-900 min-h-screen">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
