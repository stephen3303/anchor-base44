import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

/**
 * Deliberate scope marker for screens agreed for the next build step.
 * Shows what the screen will hold rather than pretending to be it.
 */
export default function Planned({ title, note }) {
  return (
    <div className="mx-auto w-full max-w-[720px] anchor-fade-in">
      <div className="rounded-md border border-line bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-sm border border-gold/60 bg-gold/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-800">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Next build step
        </span>
        <h1 className="mt-4 font-heading text-[24px] font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mutedink">{note}</p>
        <p className="mt-5 border-t border-line pt-4 text-[12px] text-mutedink">
          This milestone delivered the theme, header, left navigation and the Home and Messages screens against the
          sample traffic set. Remaining screens follow the review recommendations.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block text-[12.5px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2 hover:decoration-navy-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}