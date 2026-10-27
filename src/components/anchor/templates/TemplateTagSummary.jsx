import { cn } from '@/lib/utils';
import { populatedTagGroups, tagValues, USE_LABEL, templateUse } from '@/lib/templateMatch';

/** The tags that identify a template's traffic, condensed to one line. */
export default function TemplateTagSummary({ template, showUse = false, className }) {
  const groups = populatedTagGroups(template);

  if (groups.length === 0) {
    return <span className={cn('text-[11px] text-mutedink', className)}>No tags — claims no traffic</span>;
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {groups.map((group) => (
        <span
          key={group.key}
          className="inline-flex items-center gap-1 rounded-sm border border-line bg-secondary/60 px-1.5 py-[1px] text-[10.5px] text-ink"
        >
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-mutedink">{group.label}</span>
          <span className="anchor-mono">{tagValues(template, group.key).join(', ')}</span>
        </span>
      ))}
      {showUse && (
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-navy-600">
          {USE_LABEL[templateUse(template)]}
        </span>
      )}
    </span>
  );
}