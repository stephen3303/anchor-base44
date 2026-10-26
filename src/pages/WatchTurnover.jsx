import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Printer, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/anchor/SectionCard';
import PrintWatermark from '@/components/anchor/PrintWatermark';
import ClassificationStrip from '@/components/anchor/ClassificationStrip';
import TurnoverEditor from '@/components/anchor/turnover/TurnoverEditor';
import TurnoverPackage from '@/components/anchor/turnover/TurnoverPackage';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import useAcknowledgements from '@/hooks/useAcknowledgements';
import { recordAudit } from '@/lib/audit';
import { DEFAULT_CHECKLIST, currentWatch } from '@/lib/watch';
import { SAMPLE_MESSAGES, openActionItems } from '@/data/anchorSampleData';

const EMPTY_FORM = { situation: '', ongoing_topics: [], watch_notes: '' };

export default function WatchTurnover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const watch = useMemo(() => currentWatch(), []);
  const { pending } = useAcknowledgements(user);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [newItem, setNewItem] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const found = await base44.entities.WatchTurnover.filter({ watch_label: watch.label });
        const items = Array.isArray(found) ? found : found?.items || [];
        if (!alive) return;
        setRows(items);
        const mine = items.find((row) => row.created_by === user?.email);
        if (mine) {
          setForm({
            situation: mine.situation || '',
            ongoing_topics: mine.ongoing_topics || [],
            watch_notes: mine.watch_notes || '',
          });
          setChecklist(mine.checklist?.length ? mine.checklist : DEFAULT_CHECKLIST);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [watch.label, user?.email]);

  const mine = rows.find((row) => row.created_by === user?.email) || null;
  const others = rows.find((row) => row.created_by !== user?.email) || null;
  const readOnly = !mine && Boolean(others);

  const sinceWatchStart = useMemo(
    () =>
      SAMPLE_MESSAGES.filter(
        (message) =>
          (message.precedence === 'FLASH' || message.precedence === 'IMMEDIATE') &&
          moment.utc(message.received).isSameOrAfter(moment.utc(watch.started_at)),
      ),
    [watch.started_at],
  );

  const actions = useMemo(() => openActionItems(), []);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        watch_label: watch.label,
        watch_started_at: watch.started_at,
        author_name: user?.full_name || '',
        author_email: user?.email || '',
        situation: form.situation,
        ongoing_topics: form.ongoing_topics,
        watch_notes: form.watch_notes,
        checklist,
        status: 'draft',
      };
      const saved = mine
        ? await base44.entities.WatchTurnover.update(mine.id, payload)
        : await base44.entities.WatchTurnover.create(payload);
      setRows((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)]);
      await recordAudit({
        action: 'turnover_saved',
        target_type: 'watch_turnover',
        target_id: saved.id,
        target_reference: watch.label,
        detail: `${checklist.filter((item) => item.done).length} of ${checklist.length} checklist items complete`,
      });
      toast({ title: 'Turnover saved', description: `${watch.label} · ${watch.name} recorded for the relief.` });
    } finally {
      setBusy(false);
    }
  };

  const packageTurnover = mine || others || { watch_label: watch.label, author_name: user?.full_name, ...form, checklist };

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 anchor-fade-in">
      <PrintWatermark label="Turnover copy" user={user} />
      <ClassificationStrip />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Act</p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
            Watch turnover
          </h1>
          <p className="mt-1 text-[13px] text-mutedink">
            {watch.label} · one turnover per watch, authored by the watch officer on duty
          </p>
        </div>
        <div className="flex flex-wrap gap-2 anchor-no-print">
          {!readOnly && (
            <Button size="sm" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={save} disabled={busy}>
              <Save className="h-3.5 w-3.5" />
              {busy ? 'Saving…' : 'Save turnover'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-line text-[12.5px]"
            onClick={async () => {
              await recordAudit({
                action: 'record_printed',
                target_type: 'watch_turnover',
                target_reference: watch.label,
                detail: 'Turnover package printed with classification markings',
              });
              window.print();
            }}
          >
            <Printer className="h-3.5 w-3.5" />
            Print package
          </Button>
        </div>
      </header>

      {readOnly && (
        <div className="rounded-sm border border-gold/50 bg-[#FFF6DE] px-3 py-2 text-[12.5px] text-ink">
          This watch's turnover was authored by {others.author_name || 'another officer'}. One turnover is held per watch;
          you are seeing the record rather than a second copy.
        </div>
      )}

      {loading ? (
        <SectionCard title="Turnover" hint="Reading the watch record">
          <p className="text-[13px] text-mutedink">Loading…</p>
        </SectionCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {!readOnly && (
            <SectionCard title="Author the turnover" hint="Saved against this watch and audited">
              <TurnoverEditor
                form={form}
                onChange={setForm}
                checklist={checklist}
                onChecklistChange={setChecklist}
                onAddItem={() => {
                  setChecklist((prev) => [...prev, { label: newItem.trim(), done: false }]);
                  setNewItem('');
                }}
                onRemoveItem={(index) => setChecklist((prev) => prev.filter((_, i) => i !== index))}
                newItem={newItem}
                setNewItem={setNewItem}
              />
            </SectionCard>
          )}

          <SectionCard title="Turnover package" hint="What the relief receives">
            <TurnoverPackage
              turnover={packageTurnover}
              traffic={sinceWatchStart}
              actions={actions}
              pendingAcks={pending.length}
            />
          </SectionCard>
        </div>
      )}

      <ClassificationStrip />
    </div>
  );
}