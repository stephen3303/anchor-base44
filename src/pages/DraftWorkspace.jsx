import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import StatusChip from '@/components/anchor/drafting/StatusChip';
import DraftHeaderFields from '@/components/anchor/drafting/DraftHeaderFields';
import DraftReferenceEditor from '@/components/anchor/drafting/DraftReferenceEditor';
import DraftParagraphEditor from '@/components/anchor/drafting/DraftParagraphEditor';
import DraftPreview from '@/components/anchor/drafting/DraftPreview';
import RoutingTimeline from '@/components/anchor/drafting/RoutingTimeline';
import RouteActionPanel from '@/components/anchor/drafting/RouteActionPanel';
import DerivationNotice from '@/components/anchor/drafting/DerivationNotice';
import { buildBodyText, dtgNow, renderMessage } from '@/lib/ntp';
import { buildRoute, currentRouteStep, isEditable, releaseAuthorityFor, routeEmails, selectWorkflow } from '@/lib/drafting';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';

const Panel = ({ title, hint, children }) => (
  <section className="rounded-md border border-line bg-white shadow-sm">
    <header className="border-b border-line px-4 py-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">{title}</h2>
      {hint && <p className="mt-1 text-[11.5px] leading-snug text-mutedink">{hint}</p>}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export default function DraftWorkspace() {
  const { id } = useParams();
  const { toast } = useToast();
  const [draft, setDraft] = useState(null);
  const [events, setEvents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadEvents = useCallback(async () => {
    const { items } = await base44.entities.RoutingEvent.filter(
      { draft_id: id },
      { sort: 'created_date', limit: 200 },
    );
    setEvents(items || []);
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [record, ev, wf, auth, me] = await Promise.all([
          base44.entities.DraftMessage.get(id),
          base44.entities.RoutingEvent.filter({ draft_id: id }, { sort: 'created_date', limit: 200 }),
          base44.entities.RoutingWorkflow.list(),
          base44.entities.ReleaseAuthority.list(),
          base44.auth.me(),
        ]);
        if (!alive) return;
        setDraft(record);
        setEvents(ev.items || []);
        setWorkflows(wf || []);
        setAuthorities(auth || []);
        setUser(me);
      } catch (error) {
        if (alive) setMissing(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const patch = (fields) => setDraft((prev) => ({ ...prev, ...fields }));

  const persist = async (fields) => {
    const next = { ...draft, ...fields };
    await base44.entities.DraftMessage.update(id, { ...fields, body_text: buildBodyText(next) });
    setDraft(next);
    return next;
  };

  const logEvent = (payload, routedTo) =>
    base44.entities.RoutingEvent.create({
      draft_id: id,
      draft_subject: draft.subject,
      draft_reference: draft.message_type || 'DRAFT',
      routed_to_emails: routedTo || draft.routed_to_emails || [],
      actor_email: user?.email || '',
      actor_name: user?.full_name || '',
      ...payload,
    });

  const save = async () => {
    setBusy(true);
    try {
      await persist({});
      toast({ title: 'Draft saved', description: 'The text and routing data are stored on the draft.' });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!draft.subject?.trim()) {
      toast({ title: 'Subject required', description: 'A message needs a subject line before it can be submitted.' });
      return;
    }
    if (!draft.originator?.trim()) {
      toast({ title: 'Originator required', description: 'The FM line must name the releasing command.' });
      return;
    }
    if (!(draft.action_addressees || []).length) {
      toast({ title: 'Action addressees required', description: 'At least one TO addressee is needed.' });
      return;
    }
    if (!(draft.paragraphs || []).some((p) => String(p).trim())) {
      toast({ title: 'No remarks', description: 'The message body has no paragraphs.' });
      return;
    }
    const workflow = selectWorkflow(workflows, draft);
    if (!workflow) {
      toast({
        title: 'No routing workflow matches',
        description: 'An administrator must define a chain for this message type and originator.',
      });
      return;
    }

    setBusy(true);
    try {
      const route = buildRoute(workflow);
      const routedTo = [...new Set([...routeEmails(route), draft.created_by].filter(Boolean))];
      const dtg = dtgNow();
      const fields = {
        dtg,
        rendered_text: renderMessage({ ...draft, dtg }),
        draft_status: 'in_routing',
        routing_workflow_id: workflow.id,
        routing_workflow_name: workflow.name,
        routing_steps: route,
        current_step: 1,
        assigned_to_email: route[0].assignee_email,
        assigned_to_name: route[0].assignee_name,
        assigned_duty: route[0].duty,
        routed_to_emails: routedTo,
        return_comment: '',
      };
      await persist(fields);
      await logEvent(
        {
          event_type: 'submitted',
          from_status: draft.draft_status,
          to_status: 'in_routing',
          step_order: 1,
          step_title: route[0].title,
          comment: '',
        },
        routedTo,
      );
      await loadEvents();
      toast({
        title: 'Submitted for routing',
        description: `Route: ${route.map((s) => s.title).join(' → ')}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    const step = currentRouteStep(draft);
    const next = (draft.routing_steps || []).find((s) => s.order === (step?.order || 0) + 1);
    if (!step || !next) {
      toast({ title: 'No further step', description: 'This chain has no step after the current one.' });
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const steps = draft.routing_steps.map((s) => {
        if (s.order === step.order) return { ...s, status: 'endorsed', acted_at: now };
        if (s.order === next.order) return { ...s, status: 'current' };
        return s;
      });
      await persist({
        routing_steps: steps,
        current_step: next.order,
        assigned_to_email: next.assignee_email,
        assigned_to_name: next.assignee_name,
        assigned_duty: next.duty,
      });
      await logEvent({
        event_type: 'advanced',
        from_status: 'in_routing',
        to_status: 'in_routing',
        step_order: step.order,
        step_title: step.title,
        comment: '',
      });
      await loadEvents();
      toast({ title: 'Advanced', description: `Now with ${next.assignee_name || next.title}.` });
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    const step = currentRouteStep(draft);
    const authority = releaseAuthorityFor(authorities, user?.email);
    if (!step || step.action !== 'release') {
      toast({ title: 'Not at the release step', description: 'The chain has not reached the release authority yet.' });
      return;
    }
    if (!authority) {
      toast({
        title: 'Release authority required',
        description: 'Only the commanding officer or a designated release authority may release this message.',
      });
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const steps = draft.routing_steps.map((s) =>
        s.order === step.order ? { ...s, status: 'released', acted_at: now } : s,
      );
      const rendered = renderMessage(draft);
      await persist({
        routing_steps: steps,
        draft_status: 'released',
        rendered_text: rendered,
        released_at: now,
        released_by_email: user.email,
        released_by_name: user.full_name || user.email,
        release_authority_designation: authority.designation,
        assigned_to_email: '',
        assigned_to_name: '',
        assigned_duty: '',
      });
      await logEvent({
        event_type: 'released',
        from_status: 'in_routing',
        to_status: 'released',
        step_order: step.order,
        step_title: step.title,
        comment: `Released as ${authority.designation}. The transmitted text is frozen.`,
        visible_to_all: true,
      });
      await loadEvents();
      toast({ title: 'Released', description: 'The record is frozen and the transmitted text is fixed.' });
    } finally {
      setBusy(false);
    }
  };

  const returnForCorrection = async (comment) => {
    const step = currentRouteStep(draft);
    if (!step) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const steps = draft.routing_steps.map((s) =>
        s.order === step.order ? { ...s, status: 'returned', acted_at: now, comment } : s,
      );
      await persist({
        routing_steps: steps,
        draft_status: 'returned',
        return_comment: comment,
        assigned_to_email: draft.created_by,
        assigned_to_name: draft.creator_name || draft.created_by,
        assigned_duty: 'Drafter',
      });
      await logEvent({
        event_type: 'returned',
        from_status: 'in_routing',
        to_status: 'returned',
        step_order: step.order,
        step_title: step.title,
        comment,
      });
      await loadEvents();
      toast({ title: 'Returned to drafter', description: 'The comment is on the route log.' });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await persist({ draft_status: 'withdrawn' });
      await logEvent({
        event_type: 'withdrawn',
        from_status: draft.draft_status,
        to_status: 'withdrawn',
        comment: 'Withdrawn by the drafter.',
      });
      await loadEvents();
      toast({ title: 'Draft withdrawn', description: 'Retained for the record; it was never released.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-10 text-[12.5px] text-mutedink">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-navy-600" />
        Loading draft…
      </div>
    );
  }

  if (missing || !draft) {
    return (
      <div className="mx-auto w-full max-w-[640px] anchor-fade-in">
        <div className="rounded-md border border-line bg-white p-6 shadow-sm">
          <h1 className="font-heading text-[20px] font-semibold text-ink">Draft not available</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mutedink">
            This draft does not exist, or it is not shared with you. Drafts are visible to the drafter, the users on
            its route, and administrators.
          </p>
          <Link to="/drafting" className="mt-4 inline-block text-[12.5px] font-semibold text-navy-600 underline underline-offset-2">
            Back to Drafting
          </Link>
        </div>
      </div>
    );
  }

  const editable = isEditable(draft);
  const source = SAMPLE_MESSAGES.find((m) => m.id === draft.derived_from_message_id) || null;
  const preview = editable ? selectWorkflow(workflows, draft) : null;
  const workflowPreview = preview
    ? { name: preview.name, steps: buildRoute(preview) }
    : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 anchor-fade-in">
      <header>
        <Link to="/drafting" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-navy-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Drafting
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PrecedenceBadge precedence={draft.precedence} />
          <StatusChip status={draft.draft_status} />
          <span className="anchor-mono text-[10.5px] text-mutedink">{draft.message_type || 'DRAFT'}</span>
          {draft.dtg && <span className="anchor-mono text-[10.5px] text-mutedink">· {draft.dtg}</span>}
          {draft.template_name && <span className="text-[10.5px] text-mutedink">· from {draft.template_name}</span>}
        </div>
        <h1 className="mt-2 font-heading text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[25px]">
          {draft.subject || 'Untitled draft'}
        </h1>
      </header>

      <DerivationNotice draft={draft} sourceMessage={source} />

      {draft.draft_status === 'returned' && draft.return_comment && (
        <div className="rounded-sm border border-precedence-immediate/40 bg-precedence-immediate/10 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-precedence-immediate">
            Returned for correction
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink">{draft.return_comment}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <div className="space-y-4">
          <Panel
            title="Message header"
            hint={
              editable
                ? 'Setlines as they will appear on the transmitted message.'
                : 'Frozen while in routing. Any change sends the draft back to the drafter.'
            }
          >
            <DraftHeaderFields draft={draft} onChange={patch} disabled={!editable} />
          </Panel>

          <Panel title="References" hint="A linked reference becomes a link to that message in the record.">
            <DraftReferenceEditor
              references={draft.references}
              onChange={(refs) => patch({ references: refs })}
              disabled={!editable}
            />
          </Panel>

          <Panel title="Remarks" hint="Paragraphs are numbered automatically in the transmitted text.">
            <DraftParagraphEditor
              paragraphs={draft.paragraphs}
              prompts={null}
              onChange={(paragraphs) => patch({ paragraphs })}
              disabled={!editable}
            />
          </Panel>

          <DraftPreview draft={draft} />
        </div>

        <div className="space-y-4">
          <Panel title="Route and release">
            <RouteActionPanel
              draft={draft}
              authorities={authorities}
              user={user}
              workflowPreview={workflowPreview}
              busy={busy}
              onSave={save}
              onSubmit={submit}
              onAdvance={advance}
              onRelease={release}
              onReturn={returnForCorrection}
              onWithdraw={withdraw}
            />
          </Panel>

          <Panel title="Routing and audit">
            <RoutingTimeline draft={draft} events={events} />
          </Panel>
        </div>
      </div>
    </div>
  );
}