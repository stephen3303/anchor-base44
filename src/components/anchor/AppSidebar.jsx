import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ClipboardList,
  CloudOff,
  FileText,
  Home,
  Inbox,
  PenLine,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSubscriptions from '@/hooks/useSubscriptions';
import { unreadCount } from '@/data/anchorSampleData';

const GROUPS = [
  {
    label: 'Read',
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/messages', label: 'Messages', icon: Inbox, badge: 'unread' },
    ],
  },
  {
    label: 'Act',
    items: [
      { to: '/drafting', label: 'Drafting', icon: PenLine },
      { to: '/subscriptions', label: 'Subscriptions', icon: Bell },
      { to: '/briefings', label: 'Briefings', icon: FileText },
      { to: '/watch-turnover', label: 'Watch Turnover', icon: ClipboardList },
      { to: '/offline', label: 'Offline Mode', icon: CloudOff },
    ],
  },
  {
    label: 'Govern',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/audit', label: 'Audit & Integrity', icon: ShieldCheck },
      { to: '/admin', label: 'Admin', icon: SlidersHorizontal, badge: 'approvals' },
      { to: '/admin/routing', label: 'Routing & Release', icon: Route },
      { to: '/profile', label: 'Profile & Settings', icon: UserCircle },
    ],
  },
];

export default function AppSidebar({ className, onNavigate }) {
  const { subscriptions } = useSubscriptions();
  const pendingApprovals = subscriptions.filter((subscription) => subscription.status === 'pending').length;
  const badgeCount = (badge) => (badge === 'approvals' ? pendingApprovals : badge === 'unread' ? unreadCount() : 0);

  return (
    <aside
      className={cn(
        'w-[264px] shrink-0 flex-col overflow-y-auto bg-navy-950 anchor-scroll',
        className,
      )}
    >
      <nav className="flex-1 px-3 py-4" aria-label="Primary">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-navy-100/35">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = badgeCount(item.badge);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-2.5 rounded-sm px-3 py-[9px] text-[13px] transition-colors duration-150',
                          isActive
                            ? 'bg-navy-600 font-semibold text-white'
                            : 'text-navy-100/70 hover:bg-navy-900 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full',
                              isActive ? 'bg-gold' : 'bg-transparent',
                            )}
                          />
                          <Icon className="h-[17px] w-[17px] shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {count > 0 && (
                            <span
                              className={cn(
                                'ml-auto min-w-[20px] rounded-full px-1.5 py-[1px] text-center text-[10px] font-semibold',
                                isActive ? 'bg-gold text-navy-950' : 'bg-gold/85 text-navy-950',
                              )}
                            >
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-5 pt-6">
        <div className="mb-3 h-px bg-gold/25" aria-hidden="true" />
        <p className="text-center text-[9px] font-semibold uppercase leading-[1.6] tracking-[0.2em] text-gold/85">
          People · Information
          <br />
          Decisions · Mission Success
        </p>
      </div>
    </aside>
  );
}