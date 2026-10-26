import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const toCsv = (list) => (list || []).join(', ');

/** The watch officer's own record of the watch: situation, topics, notes, checklist. */
export default function TurnoverEditor({ form, onChange, checklist, onChecklistChange, onAddItem, onRemoveItem, newItem, setNewItem }) {
  const set = (patch) => onChange({ ...form, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
          Situation overview
        </Label>
        <Textarea
          value={form.situation}
          onChange={(e) => set({ situation: e.target.value })}
          rows={4}
          placeholder="What the relief needs to know first"
          className="mt-1 border-line text-[12.5px]"
        />
      </div>

      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
          Ongoing topics (comma separated)
        </Label>
        <Input
          value={toCsv(form.ongoing_topics)}
          onChange={(e) =>
            set({
              ongoing_topics: e.target.value
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean),
            })
          }
          placeholder="Safety stand-down reporting, Port visit coordination"
          className="mt-1 h-9 border-line text-[12.5px]"
        />
      </div>

      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Watch notes</Label>
        <Textarea
          value={form.watch_notes}
          onChange={(e) => set({ watch_notes: e.target.value })}
          rows={3}
          placeholder="Anything the relief should not have to ask about"
          className="mt-1 border-line text-[12.5px]"
        />
      </div>

      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
          Handover checklist
        </Label>
        <ul className="mt-2 space-y-1.5">
          {checklist.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(item.done)}
                onCheckedChange={(checked) =>
                  onChecklistChange(
                    checklist.map((entry, i) => (i === index ? { ...entry, done: Boolean(checked) } : entry)),
                  )
                }
              />
              <span className="text-[12.5px] text-ink">{item.label}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2 text-mutedink hover:text-lifecycle-cancelled"
                onClick={() => onRemoveItem(index)}
                aria-label={`Remove ${item.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a checklist item"
            className="h-9 flex-1 border-line text-[12.5px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-line text-[12.5px]"
            onClick={onAddItem}
            disabled={!newItem.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}