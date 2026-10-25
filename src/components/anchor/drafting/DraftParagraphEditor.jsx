import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** Numbered RMKS paragraphs. Numbering is generated on render, never typed. */
export default function DraftParagraphEditor({ paragraphs, prompts, onChange, disabled }) {
  const rows = paragraphs || [];
  const update = (index, value) => onChange(rows.map((p, i) => (i === index ? value : p)));
  const add = () => onChange([...rows, '']);
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {rows.map((text, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="anchor-mono mt-2 w-5 shrink-0 text-right text-[12px] font-semibold text-mutedink">
            {index + 1}.
          </span>
          <Textarea
            value={text}
            onChange={(e) => update(index, e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder={prompts?.[index] || 'Paragraph text'}
            className="min-h-[92px] text-[13px] leading-relaxed"
          />
          {!disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="mt-1 h-8 px-2" title="Remove paragraph">
              <Trash2 className="h-4 w-4 text-lifecycle-cancelled" />
            </Button>
          )}
        </div>
      ))}

      {rows.length === 0 && (
        <p className="rounded-sm border border-dashed border-line px-3 py-3 text-[12px] text-mutedink">
          No paragraphs yet. The first paragraph carries the purpose or the direction.
        </p>
      )}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 text-[12px]">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add paragraph
        </Button>
      )}
    </div>
  );
}