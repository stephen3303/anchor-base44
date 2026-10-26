import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Anchor, ChevronDown, Menu, UserCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ClassificationStrip from './ClassificationStrip';
import LinkStatus from './LinkStatus';
import { useAuth } from '@/lib/AuthContext';
import useConnectivity from '@/hooks/useConnectivity';
import { CURRENT_USER } from '@/data/anchorSampleData';

export default function AppHeader({ onOpenMenu }) {
  const { user } = useAuth();
  const [zulu, setZulu] = useState(() => moment.utc());
  const { offline } = useConnectivity();

  // Identity comes from the signed-in user; the sample identity stands in for a
  // user who has not filled in their rank, unit or duty yet.
  const identity = {
    full_name: user?.full_name || CURRENT_USER.full_name,
    rank: user?.rank || CURRENT_USER.rank,
    unit: user?.unit || CURRENT_USER.unit,
    duty: user?.duty || user?.role || CURRENT_USER.role,
  };

  useEffect(() => {
    const id = setInterval(() => setZulu(moment.utc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <ClassificationStrip className="sticky top-0 z-50 anchor-no-print" />
      <header
        className={cn(
          'sticky top-[22px] z-50 h-[72px] border-b transition-colors duration-300',
          offline
            ? 'border-gold/45 bg-gradient-to-r from-[#3B2A05] to-[#5D4407]'
            : 'border-navy-600/40 bg-gradient-to-r from-navy-950 to-navy-800',
        )}
      >
        <div className="flex h-full items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation"
            className="rounded-sm p-2 text-navy-100/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Anchor className="h-6 w-6 shrink-0 text-gold sm:h-7 sm:w-7" aria-hidden="true" />

          <div className="flex min-w-0 items-center gap-3">
            <span className="font-heading text-[17px] font-semibold tracking-[0.2em] text-white sm:text-[19px]">
              ANCHOR
            </span>
            <span className="hidden h-7 w-px bg-gold/60 xl:block" aria-hidden="true" />
            <span className="hidden max-w-[420px] truncate text-[10.5px] font-medium uppercase tracking-[0.16em] text-navy-100/65 xl:block">
              Authoritative Naval Communications Hub for Official Records
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <LinkStatus />

            <div className="hidden items-center gap-3 border-l border-white/10 pl-4 md:flex">
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-navy-100/80">
                  {identity.unit} Staff
                </p>
                <p className="anchor-mono text-[11px] text-navy-100/60">
                  {zulu.format('DD MMM YY')} · {zulu.format('HH:mm:ss')}Z
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-sm border border-white/15 py-1 pl-1 pr-2 transition-colors hover:border-white/35"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-gold/50 bg-navy-900 font-heading text-[11px] font-semibold text-gold">
                    {identity.rank}
                  </span>
                  <span className="hidden text-[12px] font-medium text-navy-100/90 sm:inline">
                    {identity.full_name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-navy-100/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block text-[13px] font-semibold text-ink">{identity.full_name}</span>
                  <span className="block text-[11px] font-normal text-mutedink">
                    {identity.duty} · {identity.unit} Staff
                  </span>
                  <span className="mt-1 block font-mono text-[10px] font-normal text-mutedink">
                    Prototype identity · CAC/PKI not connected
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile &amp; Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-lifecycle-cancelled focus:text-lifecycle-cancelled"
                  onClick={() => base44.auth.logout()}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}