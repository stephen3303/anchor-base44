import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import NewTemplateDialog from '@/components/anchor/NewTemplateDialog';
import SourceMessageActions from '@/components/anchor/drafting/SourceMessageActions';
import TemplateTagSummary from '@/components/anchor/templates/TemplateTagSummary';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';
import { BASE_DRAFT, derivationDraft, responseDraft } from '@/lib/draftPrefill';
import { templateDraft, templateUse } from '@/lib/templateMatch';
import { useToast } from '@/components/ui/use-toast';

export default function DraftNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const loadTemplates = async () => {
    const list = await base44.entities.MessageTemplate.list();
    setTemplates(list.filter((t) => t.active !== false && templateUse(t) !== 'validate'));
  };

  useEffect(() => {
    (async () => {
      const [me] = await Promise.all([base44.auth.me(), loadTemplates()]);
      setUser(me);
    })();
  }, []);

  const isAdmin = user?.role === 'admin';

  const create = async (draft) => {
    setBusy(true);
    try {
      const record = await base44.entities.DraftMessage.create({ ...BASE_DRAFT, ...draft, creator_name: user?.full_name || '' });
      navigate(`/drafting/${record.id}`);
    } catch (error) {
      toast({ title: 'Could not start the draft', description: 'The draft was not created. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const fromTemplate = (template) => create(templateDraft(template));

  const fromMessage = (message, type) => create(derivationDraft(message, type));

  const fromResponse = (message) => create(responseDraft(message));

  const messages = SAMPLE_MESSAGES.filter((m) =>
    `${m.reference} ${m.subject} ${m.originator}`.toLowerCase().includes(q.toLowerCase()),
  ).slice(0, 30);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 anchor-fade-in">
      <header>
        <Link to="/drafting" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-navy-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Drafting
        </Link>
        <h1 className="mt-2 font-heading text-[24px] font-semibold tracking-tight text-ink">Start a draft</h1>
        <p className="mt-1 text-[13px] text-mutedink">
          Begin from a standard template, or choose an existing message to answer, capture as a template, or derive a
          corrected copy, update, final or cancellation from one your command originated.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">From a template</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={busy}
              onClick={() => fromTemplate(template)}
              className="rounded-md border border-line bg-white p-4 text-left shadow-sm transition-colors hover:border-navy-600/50 hover:bg-navy-100/40 disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-navy-600" aria-hidden="true" />
                <p className="text-[13.5px] font-semibold text-ink">{template.name}</p>
                <span className="rounded-sm border border-line bg-secondary px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
                  {template.template_class}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-mutedink">{template.description}</p>
              <TemplateTagSummary template={template} showUse className="mt-1.5" />
              <p className="mt-2 text-[11.5px] leading-snug text-mutedink">{template.guidance}</p>
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setTemplateOpen(true)}
              className="flex flex-col justify-center rounded-md border border-dashed border-navy-600/50 bg-navy-100/20 p-4 text-left transition-colors hover:border-navy-600 hover:bg-navy-100/50 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-[13.5px] font-semibold text-navy-600">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New template from scratch
              </span>
              <span className="mt-1.5 text-[12px] leading-snug text-mutedink">
                Build an empty template — setlines, addressees and paragraph prompts — without capturing a message.
              </span>
            </button>
          )}
          {templates.length === 0 && (
            <p className="text-[12px] text-mutedink">No templates available. An administrator must publish one.</p>
          )}
        </div>
      </section>

      <NewTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} onCreated={loadTemplates} />

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">
          From an existing message
        </h2>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-mutedink" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the message set"
            className="pl-8 text-[13px]"
          />
        </div>

        <ul className="divide-y divide-line/70 rounded-md border border-line bg-white shadow-sm">
          {messages.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m)}
                className={`w-full px-3 py-2.5 text-left anchor-row hover:bg-navy-100/50 ${
                  selected?.id === m.id ? 'bg-navy-100/70' : ''
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PrecedenceBadge precedence={m.precedence} />
                  <span className="anchor-mono text-[10.5px] text-mutedink">{m.reference}</span>
                  <span className="anchor-mono text-[10.5px] text-mutedink">· {m.dtg}</span>
                  <span className="text-[10.5px] uppercase tracking-[0.08em] text-mutedink">{m.lifecycle}</span>
                </div>
                <p className="mt-1 text-[12.5px] font-medium leading-snug text-ink">{m.subject}</p>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <SourceMessageActions
            message={selected}
            busy={busy}
            canTemplate={isAdmin}
            onResponse={fromResponse}
            onDerive={fromMessage}
          />
        )}
      </section>
    </div>
  );
}