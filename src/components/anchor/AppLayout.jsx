import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';
import { rememberIdentity } from '@/lib/diagnostics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import AlertStrip from './AlertStrip';
import IngestStatusBanner from './IngestStatusBanner';
import { formatShort, isOverdue } from '@/data/anchorSampleData';
import { useAuth } from '@/lib/AuthContext';
import useAcknowledgements from '@/hooks/useAcknowledgements';
import useConnectivity from '@/hooks/useConnectivity';

export default function AppLayout() {
  const { offline, local, external } = useConnectivity();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  // A statement has to name the account even when the command server is unreachable.
  useEffect(() => {
    rememberIdentity(user);
  }, [user]);

  const { pending } = useAcknowledgements(user);
  const overdue = pending.filter(isOverdue).length;
  const nextDue = pending.length ? formatShort(pending[0].ack_due) : null;

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <AppHeader onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <AppSidebar className="sticky top-[94px] hidden h-[calc(100vh-94px)] border-r border-navy-800/70 lg:flex" />

        <div className="flex min-w-0 flex-1 flex-col">
          {local === 'down' ? (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 px-4 py-2.5 text-[12.5px] text-ink anchor-no-print">
              <AlertTriangle className="h-4 w-4 shrink-0 text-lifecycle-cancelled" aria-hidden="true" />
              <span className="font-semibold uppercase tracking-[0.1em] text-lifecycle-cancelled">
                Local ANCHOR server not available.
              </span>
              <span>
                This workstation cannot reach the command server at this command, so traffic cannot be read or written
                and nothing new is recorded. Work already on screen stays visible.
              </span>
              <Link
                to="/offline"
                className="ml-auto shrink-0 font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
              >
                Check connectivity
              </Link>
            </div>
          ) : (
            offline && (
              <div className="border-b border-gold/45 bg-gold/20 px-4 py-2 text-[12.5px] text-ink anchor-no-print">
                <span className="font-semibold uppercase tracking-[0.1em]">Offline mode.</span> The C2OIX circuit is
                down. The local ANCHOR server is up, so work continues: traffic stays readable and drafts can be written,
                routed and released. Transmission — releases and acknowledgements — is held and goes out when the
                circuit is restored.
              </div>
            )
          )}

          <AlertStrip pending={pending.length} overdue={overdue} nextDue={nextDue} />
          <IngestStatusBanner />

          <main className={cn('flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7')}>
            {/* Keyed on the screen, so moving off a stopped screen clears the fault. */}
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>

          <AppFooter local={local} external={external} />
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