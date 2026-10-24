import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrecedenceBadge, { PRECEDENCE_RULE } from './PrecedenceBadge';
import LifecycleBadge from './LifecycleBadge';

const ReadDot = ({ state }) => (
  <span
    title={state === 'read' ? 'Read' : state === 'new' ? 'New since last visit' : 'Unread'}
    className={cn(
      'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
      state === 'read' ? 'bg-line' : state === 'new' ? 'bg-gold ring-2 ring-gold/25' : 'bg-navy-600',
    )}
  />
);

const subjectClass = (lifecycle) =>
  lifecycle === 'CANCELLED'
    ? 'text-[13.5px] leading-snug text-mutedink line-through decoration-lifecycle-cancelled decoration-2'
    : 'text-[13.5px] font-medium leading-snug text-ink';

function StarButton({ message, onToggleStar }) {
  return (
    <button
      type="button"
      aria-label={message.starred ? `Remove star from ${message.reference}` : `Star ${message.reference}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggleStar(message.id);
      }}
      className="ml-auto shrink-0 rounded-sm p-1 text-mutedink transition-colors hover:text-gold-dark"
    >
      <Star className={cn('h-3.5 w-3.5', message.starred && 'fill-gold text-gold-dark')} />
    </button>
  );
}

export default function MessageTable({ messages, selectedId, onSelect, onToggleStar }) {
  if (!messages.length) {
    return (
      <div className="rounded-md border border-dashed border-line bg-white px-6 py-12 text-center">
        <p className="text-[13.5px] font-medium text-ink">No traffic matches these filters</p>
        <p className="mt-1 text-[12px] text-mutedink">
          Widen the date range or clear a filter. Mandatory traffic is always delivered regardless of filters.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet: table with progressive column disclosure */}
      <div className="hidden overflow-hidden rounded-md border border-line bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Inbox of official naval message traffic</caption>
          <thead>
            <tr className="border-b border-line bg-navy-100/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">
              <th scope="col" className="w-[132px] px-3 py-2">
                Precedence
              </th>
              <th scope="col" className="w-[150px] px-3 py-2">
                Reference
              </th>
              <th scope="col" className="px-3 py-2">
                Subject
              </th>
              <th scope="col" className="hidden w-[168px] px-3 py-2 lg:table-cell">
                Originator
              </th>
              <th scope="col" className="hidden w-[124px] px-3 py-2 lg:table-cell">
                DTG
              </th>
              <th scope="col" className="w-[124px] px-3 py-2">
                Lifecycle
              </th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr
                key={m.id}
                onClick={() => onSelect(m)}
                className={cn(
                  'cursor-pointer border-b border-line/70 anchor-row last:border-0',
                  selectedId === m.id ? 'bg-navy-100' : 'hover:bg-navy-100/50',
                )}
              >
                <td className={cn('border-l-[3px] px-3 py-2.5 align-top', PRECEDENCE_RULE[m.precedence])}>
                  <PrecedenceBadge precedence={m.precedence} />
                </td>
                <td className="anchor-mono px-3 py-2.5 align-top text-[11px] text-mutedink">{m.reference}</td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-start gap-2">
                    <ReadDot state={m.read_state} />
                    <span className={subjectClass(m.lifecycle)}>{m.subject}</span>
                    <StarButton message={m} onToggleStar={onToggleStar} />
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 align-top text-[12px] text-mutedink lg:table-cell">
                  {m.originator}
                </td>
                <td className="anchor-mono hidden px-3 py-2.5 align-top text-[11px] text-mutedink lg:table-cell">
                  {m.dtg}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <LifecycleBadge lifecycle={m.lifecycle} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list, never a horizontally scrolled table */}
      <ul className="space-y-2 md:hidden">
        {messages.map((m) => (
          <li key={m.id}>
            <div
              className={cn(
                'relative rounded-md border border-l-[3px] border-line bg-white px-3 py-3 shadow-sm anchor-row',
                PRECEDENCE_RULE[m.precedence],
                selectedId === m.id && 'bg-navy-100',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full pr-8 text-left"
                aria-label={`Open preview: ${m.reference} ${m.subject}`}
              >
                <div className="flex items-center gap-2">
                  <PrecedenceBadge precedence={m.precedence} />
                  <span className="anchor-mono text-[10.5px] text-mutedink">{m.reference}</span>
                </div>
                <div className="mt-1.5 flex items-start gap-2">
                  <ReadDot state={m.read_state} />
                  <span className={subjectClass(m.lifecycle)}>{m.subject}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="anchor-mono text-[10.5px] text-mutedink">{m.dtg}</span>
                  <LifecycleBadge lifecycle={m.lifecycle} className="ml-auto" />
                </div>
              </button>
              <div className="absolute right-1.5 top-1.5">
                <StarButton message={m} onToggleStar={onToggleStar} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}