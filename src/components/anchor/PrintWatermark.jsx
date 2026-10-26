import moment from 'moment';
import ClassificationStrip from './ClassificationStrip';

/**
 * Print-only per-copy marking: every printed page carries the classification
 * banner and the copy is attributed, so a printed record can be traced back to
 * the workstation and the time it was produced.
 */
export default function PrintWatermark({ label = 'Copy', user }) {
  const stamp = `${moment.utc().format('DD MMM YY HH:mm')}Z`;

  return (
    <div className="anchor-print-only">
      <ClassificationStrip className="anchor-print-banner" />
      <p className="anchor-print-watermark" aria-hidden="true">
        UNCLASSIFIED // PROTOTYPE
      </p>
      <p className="anchor-print-footer">
        {label} · {user?.full_name || 'Watch Officer'} · printed {stamp} · not a release
      </p>
    </div>
  );
}