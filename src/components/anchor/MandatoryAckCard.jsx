import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PrecedenceBadge, { PRECEDENCE_RULE } from './PrecedenceBadge';
import Countdown from './Countdown';
import { formatZulu, isOverdue } from '@/data/anchorSampleData';

export default function MandatoryAckCard({ message, onAcknowledge }) {
  const overdue = isOverdue(message);

  return (
    <article
      className={cn(
        'rounded-r-md border border-l-[3px] border-line bg-white px-4 py-3.5 shadow-sm',
        PRECEDENCE_RULE[message.precedence],
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PrecedenceBadge precedence={message.precedence} />
        <span className="anchor-mono text-[11px] text-mutedink">{message.reference}</span>
        <Countdown due={message.ack_due} className="ml-auto" />
      </div>

      <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-ink">{message.subject}</h3>
      <p className="mt-1 text-[11.5px] text-mutedink">
        {message.originator} · acknowledgement due {formatZulu(message.ack_due)}
        {message.alert_rule ? ` · ${message.alert_rule}` : ''}
        {overdue ? ` · overdue, escalating to ${message.escalate_to_role}` : ''}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          className="h-8 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={() => onAcknowledge(message)}
        >
          Acknowledge
        </Button>
        <Link
          to="/messages"
          className="text-[12.5px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2 hover:decoration-navy-600"
        >
          Read message
        </Link>
      </div>
    </article>
  );
}