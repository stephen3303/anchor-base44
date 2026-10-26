import { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/anchor/SectionCard';
import IdentityForm from '@/components/anchor/profile/IdentityForm';
import NotificationPreferences from '@/components/anchor/profile/NotificationPreferences';
import TimeZonePanel from '@/components/anchor/profile/TimeZonePanel';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState(null);
  const [prefs, setPrefs] = useState(null);

  const display = { ...user, ...(identity || {}) };

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 anchor-fade-in">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
          Profile and settings
        </h1>
        <p className="mt-1 text-[13px] text-mutedink">
          {display.full_name || user?.email} · {display.rank || 'rank not set'} {display.unit ? `· ${display.unit}` : ''}
        </p>
      </header>

      <SectionCard title="Identity" hint="User fields — real PKI is not connected in the pilot">
        <IdentityForm user={user} onSaved={setIdentity} />
      </SectionCard>

      <SectionCard title="Time" hint="Zulu, and your own clock">
        <TimeZonePanel user={user} />
      </SectionCard>

      <SectionCard title="Notification preferences" hint="Channels, digest and precedence">
        <NotificationPreferences user={user} onSaved={setPrefs} />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Access" hint="Groups and role">
          <dl className="space-y-2 text-[12.5px]">
            <div className="flex gap-3">
              <dt className="w-[110px] shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
                Role
              </dt>
              <dd className="text-ink">{user?.role || 'user'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-[110px] shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
                Groups
              </dt>
              <dd className="text-ink">
                {user?.groups?.length ? user.groups.join(' · ') : 'No access group assigned'}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mutedink">
            Groups and role are set by an administrator. Access-group administration is deferred beyond the pilot, where
            roles carry access.
          </p>
        </SectionCard>

        <SectionCard title="Security" hint="How this session is authenticated">
          <ul className="space-y-2 text-[12.5px] text-ink">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-800" aria-hidden="true" />
              <span>
                Signed in as {user?.email || 'unknown'} through the platform sign-in. CAC/PKI is a gateway integration
                that follows the pilot.
              </span>
            </li>
            <li>• Actions that matter — acknowledging, searching, printing, decisions — are written to the audit chain.</li>
            <li>• Acknowledgements are recorded against your account and cannot be withdrawn by you.</li>
          </ul>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 h-9 gap-1.5 border-line text-[12.5px] text-lifecycle-cancelled"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}