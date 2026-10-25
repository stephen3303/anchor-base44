import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const ROW = {
  error: { Icon: XCircle, tone: 'text-precedence-flash' },
  warning: { Icon: AlertTriangle, tone: 'text-precedence-immediate' },
};

/** Findings from checking the draft against NTP 3(J). Errors block submission and release. */
export default function NtpCheckPanel({ issues }) {
  const errors = issues.filter((i) => i.severity === 'error');
  const sorted = [...errors, ...issues.filter((i) => i.severity === 'warning')];

  if (!sorted.length) {
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-lifecycle-active">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        No findings. The draft conforms to NTP 3(J) GENADMIN format.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[12px] text-mutedink">
        <strong className="text-ink">{errors.length}</strong> error{errors.length === 1 ? '' : 's'} block submission ·{' '}
        <strong className="text-ink">{sorted.length - errors.length}</strong> advisory
      </p>
      <ul className="space-y-1.5">
        {sorted.map((issue, i) => {
          const { Icon, tone } = ROW[issue.severity];
          return (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-snug text-ink">
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} aria-label={issue.severity} />
              <span className="min-w-0 flex-1">{issue.message}</span>
              <span className="anchor-mono shrink-0 text-[10px] text-mutedink">{issue.ref}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}