import { cn } from '@/lib/utils';

const TONE = {
  up: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
  attention: 'border-gold/70 bg-gold/15 text-navy-800',
  error: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
};

const TONE_LABEL = {
  up: 'Reporting normally',
  attention: 'Reporting offline',
  error: 'Reporting a lost link',
};

/** What the command shows, given the state of the links in the diagram above. */
export default function ReportedEffects({ topology }) {
  const { circuitUp, down, links } = topology;
  const lost = down.map((link) => link.label.replace(' link', '')).join(', ');
  const noWorkstation = links.length > 0 && down.length === links.length;

  const rows = [
    {
      where: 'Header — link status',
      tone: circuitUp ? 'up' : 'attention',
      what: circuitUp
        ? 'Both lamps green: ANCHOR SRV up, C2OIX up.'
        : 'The C2OIX lamp goes amber and carries an Offline badge.',
    },
    {
      where: 'Offline mode banner',
      tone: circuitUp ? 'up' : 'attention',
      what: circuitUp
        ? 'Not shown on any screen.'
        : 'Shown at the top of every screen: the circuit is down, work continues, transmission is held.',
    },
    {
      where: 'Offline Mode screen',
      tone: circuitUp ? 'up' : 'attention',
      what: circuitUp
        ? 'Both links up, nothing waiting to leave the command.'
        : 'The circuit is reported down, with the work waiting to leave the command.',
    },
    {
      where: 'Workstation banner',
      tone: down.length ? 'error' : 'up',
      what: down.length
        ? `${lost} cannot reach the ANCHOR server, so those workstations receive no message traffic from it: they show the server-unavailable banner and hold their work locally.`
        : 'No workstation is reporting a lost link to the ANCHOR server.',
    },
    {
      where: 'Inbound traffic',
      tone: noWorkstation ? 'attention' : 'up',
      what: noWorkstation
        ? 'Nothing can take traffic past the ANCHOR server, so received messages wait there — the last node they could reach — until a workstation link is restored.'
        : 'Received traffic passes the ANCHOR server straight on to the workstations that can be reached, and stops there.',
    },
    {
      where: 'Release queue',
      tone: circuitUp ? 'up' : 'attention',
      what: circuitUp
        ? 'Releases leave the command as they are made.'
        : 'Every release is held by the ANCHOR server and goes out when the circuit is restored.',
    },
    {
      where: 'Audit & Integrity',
      tone: 'up',
      what: 'Every break and every restore is appended to the audit chain as a link-state event.',
    },
  ];

  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => (
        <li key={row.where} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
          <span className="w-[190px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-800">
            {row.where}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
              TONE[row.tone],
            )}
          >
            {TONE_LABEL[row.tone]}
          </span>
          <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-mutedink">{row.what}</span>
        </li>
      ))}
    </ul>
  );
}