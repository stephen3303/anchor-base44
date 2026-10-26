import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';
import { keyTakeaways } from '@/lib/briefing';

export default function KeyTakeaways({ messages = SAMPLE_MESSAGES }) {
  const lines = keyTakeaways(messages);

  if (lines.length === 0) {
    return <p className="text-[13px] text-mutedink">No status change or action item needs carrying forward.</p>;
  }

  return (
    <ol className="space-y-2">
      {lines.map((line, index) => (
        <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-ink">
          <span className="anchor-mono shrink-0 text-[11.5px] font-semibold text-navy-600">{index + 1}.</span>
          <span>{line}</span>
        </li>
      ))}
    </ol>
  );
}