import { useRef } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSize } from '@/hooks/use-size';
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
    ? 'min-w-0 break-words text-[13.5px] leading-snug text-mutedink line-through decoration-lifecycle-cancelled decoration-2'
    : 'min-w-0 break-words text-[13.5px] font-medium leading-snug text-ink';

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

// The list sizes itself to the space it is given, not to the window. Next to the preview
// pane it has less room than the window suggests, so columns retract as the container narrows.
const CARDS_BELOW = 640;
const ORIGINATOR_FROM = 900;
const DTG_FROM = 1040;

function Cards({ messages, selectedId, onSelect, onToggleStar }) {
  return (
    <ul className="space-y-2">
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
              <div className="flex flex-wrap items-center gap-2">
                <PrecedenceBadge precedence={m.precedence} />
                <span className="anchor-mono text-[10.5px] text-mutedink">{m.reference}</span>
              </div>
              <div className="mt-1.5 flex items-start gap-2">
                <ReadDot state={m.read_state} />
                <span className={subjectClass(m.lifecycle)}>{m.subject}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
  );
}

function Table({ messages, selectedId, onSelect, onToggleStar, width }) {
  const showOriginator = width >= ORIGINATOR_FROM;
  const showDtg = width >= DTG_FROM;
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white shadow-sm anchor-scroll">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Inbox of official naval message traffic</caption>
        <thead>
          <tr className="border-b border-line bg-navy-100/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">
            <th scope="col" className="w-[128px] px-3 py-2">Precedence</th>
            <th scope="col" className="w-[152px] px-3 py-2">Reference</th>
            <th scope="col" className="px-3 py-2">Subject</th>
            {showOriginator && <th scope="col" className="w-[168px] px-3 py-2">Originator</th>}
            {showDtg && <th scope="col" className="w-[128px] px-3 py-2">DTG</th>}
            <th scope="col" className="w-[124px] px-3 py-2">Lifecycle</th>
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
              <td className="anchor-mono break-words px-3 py-2.5 align-top text-[11px] text-mutedink">{m.reference}</td>
              <td className="px-3 py-2.5 align-top">
                <div className="flex items-start gap-2">
                  <ReadDot state={m.read_state} />
                  <span className={subjectClass(m.lifecycle)}>{m.subject}</span>
                  <StarButton message={m} onToggleStar={onToggleStar} />
                </div>
              </td>
              {showOriginator && (
                <td className="break-words px-3 py-2.5 align-top text-[12px] text-mutedink">{m.originator}</td>
              )}
              {showDtg && (
                <td className="anchor-mono px-3 py-2.5 align-top text-[11px] text-mutedink">{m.dtg}</td>
              )}
              <td className="px-3 py-2.5 align-top">
                <LifecycleBadge lifecycle={m.lifecycle} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MessageTable({ messages, selectedId, onSelect, onToggleStar }) {
  const ref = useRef(null);
  const size = useSize(ref);
  const width = size?.width ?? 0;

  return (
    <div ref={ref} className="min-w-0">
      {!messages.length ? (
        <div className="rounded-md border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="text-[13.5px] font-medium text-ink">No traffic matches these filters</p>
          <p className="mt-1 text-[12px] text-mutedink">
            Widen the date range or clear a filter. Mandatory traffic is always delivered regardless of filters.
          </p>
        </div>
      ) : width >= CARDS_BELOW ? (
        <Table
          messages={messages}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
          width={width}
        />
      ) : (
        <Cards messages={messages} selectedId={selectedId} onSelect={onSelect} onToggleStar={onToggleStar} />
      )}
    </div>
  );
}