import moment from 'moment';
import { Link } from 'react-router-dom';
import PrecedenceBadge from '../PrecedenceBadge';
import { formatShort, formatZulu } from '@/data/anchorSampleData';

/** What the relief reads: the turnover plus the traffic that drove it. */
export default function TurnoverPackage({ turnover, traffic, actions, pendingAcks }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedink">Watch</dt>
          <dd className="anchor-mono mt-0.5 text-[12px] text-ink">{turnover.watch_label}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedink">Authored by</dt>
          <dd className="mt-0.5 text-[12px] text-ink">{turnover.author_name || '—'}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">Situation</h3>
        <p className="official-text mt-1 text-[12.5px] text-ink">{turnover.situation || 'Not recorded.'}</p>
      </div>

      {turnover.ongoing_topics?.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">Ongoing topics</h3>
          <ul className="mt-1 space-y-0.5 text-[12.5px] text-ink">
            {turnover.ongoing_topics.map((topic) => (
              <li key={topic}>• {topic}</li>
            ))}
          </ul>
        </div>
      )}

      {turnover.watch_notes && (
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">Watch notes</h3>
          <p className="official-text mt-1 text-[12.5px] text-ink">{turnover.watch_notes}</p>
        </div>
      )}

      {turnover.checklist?.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">Handover checklist</h3>
          <ul className="mt-1 space-y-0.5 text-[12.5px] text-ink">
            {turnover.checklist.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.done ? '☑' : '☐'} {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-line pt-3">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">
          High-priority traffic since the watch began
        </h3>
        {traffic.length === 0 ? (
          <p className="mt-1 text-[12.5px] text-mutedink">No FLASH or IMMEDIATE traffic received on this watch.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {traffic.map((message) => (
              <li key={message.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <PrecedenceBadge precedence={message.precedence} />
                <Link to={`/messages/${message.id}`} className="font-semibold text-ink underline decoration-line underline-offset-2">
                  {message.subject}
                </Link>
                <span className="anchor-mono text-[11px] text-mutedink">
                  {message.reference} · {formatShort(message.received)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line pt-3">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-mutedink">Carried forward</h3>
        <p className="mt-1 text-[12.5px] text-ink">
          {actions.length} open action item{actions.length === 1 ? '' : 's'} · {pendingAcks} mandatory acknowledgement
          {pendingAcks === 1 ? '' : 's'} outstanding
        </p>
        {actions.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-ink">
            {actions.map((message) => (
              <li key={message.id}>
                • {message.action_item.text} — {message.action_item.assigned_to} — suspense{' '}
                {moment.utc(message.action_item.suspense).format('DD MMM HH:mm')}Z
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="border-t border-line pt-3 text-[11px] text-mutedink">
        Turnover recorded {turnover.updated_date ? formatZulu(turnover.updated_date) : 'this watch'} · one turnover per
        watch, authored by the watch officer on duty.
      </p>
    </div>
  );
}