import AuthGuard from '@/components/auth/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-stone-50">
        <Navbar />
        {/* pb-20 accounts for the mobile bottom nav bar (h-16 + padding) */}
        <main className="flex-1 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
