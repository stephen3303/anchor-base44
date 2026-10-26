import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import { formatZulu } from '@/data/anchorSampleData';

const STATUS = {
  queued: { label: 'Queued', className: 'border-line bg-secondary text-mutedink' },
  deferred: { label: 'Deferred at C2OIX', className: 'border-gold/70 bg-gold/15 text-navy-800' },
  ingested: { label: 'Ingested', className: 'border-lifecycle-active/40 bg-lifecycle-active/10 text-lifecycle-active' },
};

/** The repository the external server holds, and where each message has got to. */
export default function RepositoryTable({ messages }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Reference</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Subject</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Status</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Arrival</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Attempts</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => {
            const status = STATUS[message.status] || STATUS.queued;
            return (
              <tr key={message.id} className="border-b border-line/60 align-top anchor-row hover:bg-navy-100/40">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PrecedenceBadge precedence={message.precedence} />
                    <span className="anchor-mono text-[11px] text-mutedink">{message.reference}</span>
                  </div>
                  <span className="anchor-mono mt-0.5 block text-[10.5px] text-mutedink">{message.dtg}</span>
                </td>
                <td className="px-3 py-2">
                  <p className="text-[12.5px] font-medium leading-snug text-ink">{message.subject}</p>
                  <p className="text-[11px] text-mutedink">{message.originator}</p>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] ${status.className}`}
                  >
                    {status.label}
                  </span>
                  {message.last_error && (
                    <p className="mt-1 max-w-[200px] text-[10.5px] leading-snug text-lifecycle-cancelled">
                      {message.last_error}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="anchor-mono text-[11px] text-ink">
                    {message.ingested_at
                      ? formatZulu(message.ingested_at)
                      : message.scheduled_for
                        ? formatZulu(message.scheduled_for)
                        : '—'}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-mutedink">
                    {message.ingested_at ? 'ingested' : message.scheduled_for ? 'due' : 'not scheduled'}
                  </span>
                </td>
                <td className="px-3 py-2 anchor-mono text-[11.5px] text-mutedink">{message.attempts || 0}</td>
              </tr>
            );
          })}
          {messages.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-mutedink">
                The repository is empty. Load the example traffic to start the feed.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}