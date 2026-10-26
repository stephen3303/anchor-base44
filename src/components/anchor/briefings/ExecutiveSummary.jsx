import { FileSearch } from 'lucide-react';
import { SAMPLE_MESSAGES, formatZulu } from '@/data/anchorSampleData';
import { priorityTraffic, summaryLine } from '@/lib/briefing';

/**
 * The executive summary states the traffic position. Where an AI summary is
 * shown it stays in its own labelled panel and is excluded from print.
 */
export default function ExecutiveSummary({ messages = SAMPLE_MESSAGES, generatedAt }) {
  const top = priorityTraffic(messages)[0];

  return (
    <div>
      <p className="text-[13.5px] leading-relaxed text-ink">{summaryLine(messages)}</p>
      {top && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink">
          Highest precedence held: <span className="font-semibold">{top.subject}</span> ({top.reference}, {top.originator}),
          received {formatZulu(top.received)}.
        </p>
      )}

      {top?.ai_summary && (
        <div className="anchor-ai-panel mt-3 rounded-md border border-dashed border-ai/55 bg-ai/[0.04] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ai">
            <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
            AI-generated summary — not authoritative
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{top.ai_summary}</p>
        </div>
      )}

      <p className="mt-2 text-[11px] text-mutedink">Briefing generated {formatZulu(generatedAt)} from the held traffic set.</p>
    </div>
  );
}