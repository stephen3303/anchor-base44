import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import AlertStrip from './AlertStrip';
import IngestStatusBanner from './IngestStatusBanner';
import { formatShort, isOverdue } from '@/data/anchorSampleData';
import { useAuth } from '@/lib/AuthContext';
import useAcknowledgements from '@/hooks/useAcknowledgements';
import useEmcon from '@/hooks/useEmcon';

export default function AppLayout() {
  const [emcon, setEmcon] = useEmcon();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const { pending } = useAcknowledgements(user);
  const overdue = pending.filter(isOverdue).length;
  const nextDue = pending.length ? formatShort(pending[0].ack_due) : null;

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <AppHeader onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <AppSidebar className="sticky top-[94px] hidden h-[calc(100vh-94px)] border-r border-navy-800/70 lg:flex" />

        <div className="flex min-w-0 flex-1 flex-col">
          {emcon && (
            <div className="border-b border-gold/45 bg-gold/20 px-4 py-2 text-[12.5px] text-ink anchor-no-print">
              <span className="font-semibold uppercase tracking-[0.1em]">EMCON / Offline.</span> Network-only actions
              are disabled with a reason. Traffic already received stays readable, and acknowledgements are queued on this
              workstation until they can be recorded.
            </div>
          )}

          <AlertStrip pending={pending.length} overdue={overdue} nextDue={nextDue} />
          <IngestStatusBanner />

          <main className={cn('flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7')}>
            <Outlet />
          </main>

          <AppFooter emcon={emcon} />
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[284px] border-0 bg-navy-950 p-0">
          <AppSidebar className="flex h-full w-full" onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}