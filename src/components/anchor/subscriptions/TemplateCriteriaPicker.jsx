import { useState } from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import TemplateTagSummary from '@/components/anchor/templates/TemplateTagSummary';
import { USE_LABEL, populatedTagGroups, templateUse } from '@/lib/templateMatch';

/**
 * A feed is defined by the templates whose tags claim its traffic, so it keeps
 * working when a subject line is reworded.
 */
export default function TemplateCriteriaPicker({ templates = [], selected = [], onToggle }) {
  const [q, setQ] = useState('');
  const active = templates.filter((template) => template.active !== false);
  const tagged = active.filter((template) => populatedTagGroups(template).length > 0);
  const visible = tagged.filter((template) =>
    `${template.name} ${template.description || ''}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-2 rounded-sm border border-line bg-white p-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mutedink" aria-hidden="true" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tagged templates"
          className="h-8 border-line pl-8 text-[12px]"
        />
      </div>

      {tagged.length === 0 ? (
        <p className="px-1 py-1.5 text-[11.5px] leading-snug text-mutedink">
          No template is tagged yet. An administrator tags templates on the routing administration panel.
        </p>
      ) : (
        <ul className="max-h-[188px] space-y-1 overflow-y-auto anchor-scroll pr-1">
          {visible.map((template) => (
            <li key={template.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-1.5 hover:bg-navy-100/50">
                <Checkbox
                  checked={selected.includes(template.id)}
                  onCheckedChange={() => onToggle(template.id)}
                  className="mt-[2px]"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12.5px] font-semibold text-ink">{template.name}</span>
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-mutedink">
                      {USE_LABEL[templateUse(template)]}
                    </span>
                  </span>
                  <TemplateTagSummary template={template} className="mt-0.5" />
                </span>
              </label>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-1 py-2 text-[11.5px] text-mutedink">No tagged template matches that search.</li>
          )}
        </ul>
      )}
    </div>
  );
}