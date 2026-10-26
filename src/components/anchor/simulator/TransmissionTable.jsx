import { formatZulu } from '@/data/anchorSampleData';

/** What the local server is holding for transmit, and what the circuit has taken. */
export default function TransmissionTable({ transmissions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Released message</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Released by</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Status</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {transmissions.map((item) => (
            <tr key={item.id} className="border-b border-line/60 align-top anchor-row hover:bg-navy-100/40">
              <td className="px-3 py-2">
                <p className="text-[12.5px] font-medium leading-snug text-ink">{item.subject || 'Untitled'}</p>
                <span className="anchor-mono text-[10.5px] text-mutedink">{item.reference || '—'}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[12px] text-ink">{item.released_by_name || '—'}</span>
                <span className="anchor-mono mt-0.5 block text-[10.5px] text-mutedink">
                  {item.released_at ? formatZulu(item.released_at) : ''}
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] ${
                    item.status === 'transmitted'
                      ? 'border-lifecycle-active/40 bg-lifecycle-active/10 text-lifecycle-active'
                      : 'border-gold/70 bg-gold/15 text-navy-800'
                  }`}
                >
                  {item.status === 'transmitted' ? 'Transmitted' : 'Held'}
                </span>
                <span className="anchor-mono mt-0.5 block text-[10.5px] text-mutedink">
                  {item.attempts || 0} attempt{(item.attempts || 0) === 1 ? '' : 's'}
                </span>
                {item.last_error && (
                  <p className="mt-1 max-w-[200px] text-[10.5px] leading-snug text-lifecycle-cancelled">
                    {item.last_error}
                  </p>
                )}
              </td>
              <td className="px-3 py-2">
                <span className="anchor-mono text-[11px] text-ink">{item.receipt || '—'}</span>
                {item.transmitted_at && (
                  <span className="anchor-mono mt-0.5 block text-[10.5px] text-mutedink">
                    {formatZulu(item.transmitted_at)}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {transmissions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-mutedink">
                Nothing has been released for transmit yet. A released message is held here until the circuit takes it.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}