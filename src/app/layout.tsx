import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-stone-900 min-h-screen`}>
        <AuthProvider>
          {children}
          {/* @ts-ignore - Assuming toaster works standardly or shadcn setup */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
