import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import KpiCard from '@/components/anchor/KpiCard';
import SectionCard from '@/components/anchor/SectionCard';
import AccountabilityRow from '@/components/anchor/reports/AccountabilityRow';
import VolumeBars from '@/components/anchor/reports/VolumeBars';
import { useAuth } from '@/lib/AuthContext';
import useAlertRules from '@/hooks/useAlertRules';
import { accountabilityFor } from '@/lib/accountability';
import { MESSAGE_TYPES, PRECEDENCE_ORDER, SAMPLE_MESSAGES } from '@/data/anchorSampleData';

export default function Reports() {
  const { user } = useAuth();
  const rules = useAlertRules();
  const [acknowledgements, setAcknowledgements] = useState([]);
  const [readStates, setReadStates] = useState([]);
  const [users, setUsers] = useState([]);
  const commandWide = user?.role === 'admin';

  useEffect(() => {
    let alive = true;
    (async () => {
      const acks = await base44.entities.Acknowledgement.list({ sort: '-acknowledged_at' });
      const reads = await base44.entities.MessageUserState.list({ sort: '-created_date' });
      if (!alive) return;
      setAcknowledgements(Array.isArray(acks) ? acks : acks?.items || []);
      setReadStates(Array.isArray(reads) ? reads : reads?.items || []);
      if (commandWide) {
        try {
          const people = await base44.entities.User.list();
          if (alive) setUsers(Array.isArray(people) ? people : people?.items || []);
        } catch (error) {
          // Without the user list the roster falls back to the signed-in user.
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [commandWide]);

  const rows = useMemo(
    () =>
      accountabilityFor({
        messages: SAMPLE_MESSAGES,
        rules,
        acknowledgements,
        readStates,
        users,
        selfEmail: user?.email,
        selfName: user?.full_name,
      }),
    [rules, acknowledgements, readStates, users, user?.email, user?.full_name],
  );

  const byPrecedence = useMemo(
    () =>
      PRECEDENCE_ORDER.map((precedence) => ({
        label: precedence,
        count: SAMPLE_MESSAGES.filter((m) => m.precedence === precedence).length,
        tone: precedence === 'FLASH' ? 'critical' : 'normal',
      })),
    [],
  );

  const byType = useMemo(
    () =>
      MESSAGE_TYPES.map((type) => ({
        label: type,
        count: SAMPLE_MESSAGES.filter((m) => m.type === type).length,
      })).filter((entry) => entry.count > 0),
    [],
  );

  const overdueOrEscalated = rows.filter((row) => row.state !== 'pending').length;
  const acknowledgedTotal = rows.reduce((sum, row) => sum + row.acknowledgedCount, 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 anchor-fade-in">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
          Acknowledgement accountability
        </h1>
        <p className="mt-1 text-[13px] text-mutedink">
          {commandWide
            ? 'Command-wide counts across the sample traffic set · all times Zulu'
            : 'Your acknowledgement state · the command-wide roster is available to administrators'}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Acknowledgement figures">
        <KpiCard label="Mandatory messages" value={rows.length} note="Matched by an active alert rule" />
        <KpiCard
          label="Acknowledgements recorded"
          value={acknowledgedTotal}
          note={commandWide ? 'Across the command' : 'By you'}
        />
        <KpiCard
          label="Overdue or escalated"
          value={overdueOrEscalated}
          note={overdueOrEscalated ? 'Escalation role named per rule' : 'All within window'}
          tone={overdueOrEscalated ? 'critical' : 'quiet'}
        />
        <KpiCard
          label="Read but not acknowledged"
          value={rows.reduce((sum, row) => sum + row.readOnlyCount, 0)}
          note="Reading is not acknowledging"
          tone={rows.some((row) => row.readOnlyCount > 0) ? 'attention' : 'quiet'}
        />
      </section>

      <SectionCard
        title="Who has not acknowledged"
        hint={`${rows.length} mandatory message${rows.length === 1 ? '' : 's'}`}
      >
        {rows.length === 0 ? (
          <p className="text-[13px] text-mutedink">
            No message in the traffic set currently carries an acknowledgement obligation.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AccountabilityRow key={row.message.id} row={row} commandWide={commandWide} />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Traffic volume" hint={`${SAMPLE_MESSAGES.length} records held`}>
          <div className="space-y-5">
            <VolumeBars title="By precedence" items={byPrecedence} />
            <VolumeBars title="By message type" items={byType} />
          </div>
        </SectionCard>

        <SectionCard title="How to read these figures" hint="Pilot boundaries">
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-mutedink">
            <li>
              • Deadlines are resolved from the alert rule's window against the time a message was received, so a
              message due time is the same for every recipient.
            </li>
            <li>
              • Acknowledged and merely read are counted separately: opening a record writes read state, and only an
              explicit acknowledgement counts.
            </li>
            <li>
              • Escalation is shown from the rule's escalation window. The scheduled job that notifies the escalation
              role needs server-side traffic and follows with C2OIX ingestion.
            </li>
            <li>• The traffic set is local sample data. Nothing here is read from C2OIX.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}