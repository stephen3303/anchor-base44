import { useEffect, useState } from 'react';
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
import DraftNtpFields from '@/components/anchor/drafting/DraftNtpFields';
import NtpCheckPanel from '@/components/anchor/drafting/NtpCheckPanel';
import { buildBodyText, renderMessage } from '@/lib/ntp';
import { loadCommandSettings } from '@/lib/commandSettings';
import { errorsOf, validateDraft } from '@/lib/ntpValidate';
import { buildRoute, currentRouteStep, editableFields, isEditable, releaseGate, routeEmails, selectWorkflow } from '@/lib/drafting';
import { detachedSteps } from '@/lib/personnel';
import { releaseDraft } from '@/lib/releaseDraft';
import { enqueue, readQueue } from '@/lib/syncQueue';
import { SAMPLE_MESSAGES, formatZulu } from '@/data/anchorSampleData';
import useConnectivity from '@/hooks/useConnectivity';

const sourceOf = (d) => SAMPLE_MESSAGES.find((m) => m.id === d.derived_from_message_id) || null;

const Panel = ({ title, hint, children }) => (
  <section className="rounded-md border border-line bg-white shadow-sm">
    <header className="border-b border-line px-4 py-2.5">
      <h2 className="text-[11px] font-semibold tracking-[0.16em] text-mutedink">{title}</h2>
      {hint && <p className="mt-1 text-[11.5px] leading-snug text-mutedink">{hint}</p>}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export default function DraftWorkspace() {
  const { id } = useParams();
  const { toast } = useToast();
  const { offline } = useConnectivity();
  const [draft, setDraft] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [record, wf, auth, me, command, roster] = await Promise.all([
          base44.entities.DraftMessage.get(id),
          base44.entities.RoutingWorkflow.list(),
          base44.entities.ReleaseAuthority.list(),
          base44.auth.me(),
          loadCommandSettings(),
          base44.entities.Personnel.list({ sort: 'last_name', limit: 200 }),
        ]);
        if (!alive) return;
        setDraft(record);
        setWorkflows(wf || []);
        setAuthorities(auth || []);
        setUser(me);
        setSettings(command);
        setPersonnel(roster?.items || []);
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

  // Editing is written to the draft record itself: every field the drafter can change,
  // and the rendered body, goes to the database a moment after the typing stops.
  const patch = (fields) => {
    setDraft((prev) => ({ ...prev, ...fields }));
    setSaveState('dirty');
  };

  const persist = async (fields) => {
    const next = { ...draft, ...fields };
    await base44.entities.DraftMessage.update(id, { ...fields, body_text: buildBodyText(next) });
    setDraft(next);
    setSaveState('saved');
    return next;
  };

  const saveEditable = async () => {
    if (!draft || !isEditable(draft)) return;
    setSaveState('saving');
    await base44.entities.DraftMessage.update(id, {
      ...editableFields(draft),
      body_text: buildBodyText(draft),
    });
    setSaveState('saved');
    setSavedAt(formatZulu(new Date().toISOString()));
  };

  useEffect(() => {
    if (saveState !== 'dirty' || busy || !draft || !isEditable(draft)) return undefined;
    const timer = setTimeout(() => {
      // A failed write is reported, not retried on a loop: the next edit tries again.
      saveEditable().catch(() => setSaveState('error'));
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, saveState, busy]);

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
      await saveEditable();
      toast({ title: 'Draft saved', description: 'The text and routing data are stored on the draft.' });
    } finally {
      setBusy(false);
    }
  };

  const blockOnErrors = () => {
    const errors = errorsOf(validateDraft(draft, { source: sourceOf(draft) }));
    if (!errors.length) return false;
    toast({
      title: `${errors.length} NTP 3(J) error${errors.length === 1 ? '' : 's'} to fix`,
      description: `${errors[0].message} (${errors[0].ref}) See the NTP 3(J) check panel.`,
    });
    return true;
  };

  const submit = async () => {
    if (blockOnErrors()) return;
    const workflow = selectWorkflow(workflows, draft);
    if (!workflow) {
      toast({
        title: 'No routing workflow matches',
        description: 'An administrator must define a chain for this message type and originator.',
      });
      return;
    }

    // A chain step held by someone detached from the command cannot be worked: the
    // route is refused rather than submitted to a person who is no longer here.
    const route = buildRoute(workflow, personnel);
    const stranded = detachedSteps(route, personnel);
    if (stranded.length) {
      toast({
        title: 'A routing step is held by someone detached',
        description: `${stranded[0].title}: ${stranded[0].assignee_name || 'the recorded holder'} is detached from the command. An administrator must re-hold that step in Admin · Routing & Release.`,
      });
      return;
    }

    setBusy(true);
    try {
      const routedTo = [...new Set([...routeEmails(route), draft.created_by].filter(Boolean))];
      const fields = {
        rendered_text: renderMessage(draft, settings),
        draft_status: 'in_routing',
        routing_workflow_id: workflow.id,
        routing_workflow_name: workflow.name,
        routing_steps: route,
        current_step: 1,
        assigned_to_email: route[0].assignee_email,
        assigned_to_name: route[0].assignee_name,
        assigned_duty: route[0].duty,
        assigned_personnel_id: route[0].personnel_id || '',
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
    if (detachedSteps([step], personnel).length) {
      toast({
        title: 'This step is not held',
        description: `${step.title}: the person recorded is detached from the command. An administrator must re-hold the step before the chain can move.`,
      });
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
        assigned_personnel_id: next.personnel_id || '',
      });
      await logEvent({
        event_type: 'advanced',
        from_status: 'in_routing',
        to_status: 'in_routing',
        step_order: step.order,
        step_title: step.title,
        comment: '',
      });
      toast({ title: 'Advanced', description: `Now with ${next.assignee_name || next.title}.` });
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    const step = currentRouteStep(draft);
    if (!step || step.action !== 'release') {
      toast({ title: 'Not at the release step', description: 'The chain has not reached the release authority yet.' });
      return;
    }
    // Release is checked against the roster: the designation must cover this draft's
    // template, and the person holding it must still be with the command.
    const gate = releaseGate(authorities, user, draft, personnel);
    if (!gate.ok) {
      toast({ title: 'Release authority required', description: gate.reason });
      return;
    }
    const { authority } = gate;
    if (blockOnErrors()) return;

    // Offline mode does not stop the release. The work continues and the transmission
    // is held for the circuit; the DTG and serial are assigned when it actually goes.
    if (offline) {
      if (readQueue().some((item) => item.operation === 'transmission' && item.draft_id === id)) {
        toast({
          title: 'Already held for transmission',
          description: 'This message is in the transmission queue and leaves when the circuit is restored.',
        });
        return;
      }
      const queued = enqueue({
        operation: 'transmission',
        draft_id: id,
        label: `${draft.message_type || 'DRAFT'} ${draft.subject || 'Untitled'}`,
        target_reference: draft.message_type || 'DRAFT',
        payload: {
          authority_designation: authority.designation,
          actor_email: user.email,
          actor_name: user.full_name || user.email,
        },
      });
      toast({
        title: 'Release held for transmission',
        description: `${authority.designation} · held at ${formatZulu(queued.queued_at)}. It leaves the command when the circuit is restored.`,
      });
      return;
    }

    setBusy(true);
    try {
      const result = await releaseDraft({ draft, authority, actor: user, settings });
      setDraft(result.draft);
      if (settings?.id) {
        setSettings((prev) => ({ ...prev, next_sequence: result.assignment.next_sequence }));
      }
      toast({
        title: `Released as ${result.assignment.local_sequence}`,
        description: `DTG ${result.dtg}, MSN ${result.assignment.msn}. The record is frozen and the transmitted text is fixed.`,
      });
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
  const source = sourceOf(draft);
  const issues = validateDraft(draft, { source });
  const hasRoute = (draft.routing_steps || []).length > 0;
  const preview = editable ? selectWorkflow(workflows, draft) : null;
  const workflowPreview = preview
    ? { name: preview.name, steps: buildRoute(preview, personnel) }
    : null;
  const previewStranded = workflowPreview ? detachedSteps(workflowPreview.steps, personnel) : [];

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
          {editable && (
            <span
              className={
                saveState === 'saved'
                  ? 'anchor-mono ml-auto text-[10.5px] text-lifecycle-active'
                  : saveState === 'error'
                    ? 'anchor-mono ml-auto text-[10.5px] font-semibold text-lifecycle-cancelled'
                    : 'anchor-mono ml-auto text-[10.5px] text-mutedink'
              }
            >
              {saveState === 'saving'
                ? 'Saving to the draft record…'
                : saveState === 'dirty'
                  ? 'Unsaved changes'
                  : saveState === 'error'
                    ? 'Not saved — press Save draft'
                    : savedAt
                      ? `Saved ${savedAt}`
                      : 'Saved on the draft record'}
            </span>
          )}
        </div>
        <h1 className="normal-case mt-2 font-heading text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[25px]">
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

          <Panel title="GENADMIN sets" hint="SSIC, point of contact and declassification, required by NTP 3(J).">
            <DraftNtpFields draft={draft} onChange={patch} disabled={!editable} />
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

          <DraftPreview draft={draft} settings={settings} />
        </div>

        <div className="space-y-4">
          {(editable || issues.length > 0) && (
            <Panel title="NTP 3(J) check" hint="Checked live against the Telecommunications Users Manual.">
              <NtpCheckPanel issues={issues} />
            </Panel>
          )}

          <Panel title="Route and release">
            <RouteActionPanel
              draft={draft}
              authorities={authorities}
              user={user}
              personnel={personnel}
              workflowPreview={workflowPreview}
              stranded={previewStranded}
              busy={busy}
              onSave={save}
              onSubmit={submit}
              onAdvance={advance}
              onRelease={release}
              onReturn={returnForCorrection}
              onWithdraw={withdraw}
              linkNotice={
                offline
                  ? 'Offline mode: the C2OIX circuit is down. Work continues — drafts can be written, routed and released — and a release is held for transmission until the circuit is restored.'
                  : null
              }
            />
          </Panel>

          {hasRoute && (
            <Panel title="Routing chain" hint="Each step is held by a person on the roster, read live.">
              <RoutingTimeline draft={draft} personnel={personnel} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}