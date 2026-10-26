import { useState } from 'react';
import { AlertTriangle, CornerUpLeft, Save, Send, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentRouteStep, isEditable, releaseAuthorityFor } from '@/lib/drafting';
import ReturnDialog from './ReturnDialog';

/**
 * The actions available on a draft, driven by where it sits in the route and by
 * whether the signed-in user holds the release authority for the current step.
 */
export default function RouteActionPanel({
  draft,
  authorities,
  user,
  workflowPreview,
  busy,
  onSave,
  onSubmit,
  onAdvance,
  onRelease,
  onReturn,
  onWithdraw,
  blockedReason,
}) {
  const [returnOpen, setReturnOpen] = useState(false);

  const editable = isEditable(draft);
  const inRouting = draft?.draft_status === 'in_routing';
  const step = currentRouteStep(draft);
  const authority = releaseAuthorityFor(authorities, user?.email);
  const isOwner = draft?.created_by_id === user?.id || (user?.email && draft?.created_by === user.email);
  const releaseStep = step?.action === 'release';

  return (
    <div className="space-y-3">
      {blockedReason && (
        <p className="rounded-sm border border-gold/50 bg-[#FFF6DE] px-3 py-2 text-[11.5px] leading-snug text-ink">
          {blockedReason}
        </p>
      )}

      {editable && (
        <div className="space-y-2">
          {workflowPreview ? (
            <div className="rounded-sm border border-line bg-secondary/50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Route to be applied</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-ink">{workflowPreview.name}</p>
              <p className="mt-0.5 text-[11.5px] text-mutedink">
                {workflowPreview.steps.map((s) => `${s.title}${s.action === 'release' ? ' (release)' : ''}`).join(' → ')}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-sm border border-precedence-immediate/40 bg-precedence-immediate/10 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-precedence-immediate" aria-hidden="true" />
              <p className="text-[11.5px] leading-snug text-ink">
                No routing workflow matches this message type and originator. An administrator must define one before
                this can be submitted.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={busy} className="gap-1.5 text-[12.5px]">
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save draft
            </Button>
            <Button type="button" size="sm" onClick={onSubmit} disabled={busy || !workflowPreview} className="gap-1.5 text-[12.5px]">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Submit for routing
            </Button>
          </div>
        </div>
      )}

      {inRouting && step && (
        <div className="space-y-2">
          <div className="rounded-sm border border-line bg-secondary/50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Held by</p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-ink">
              {step.title} · {step.assignee_name || 'unassigned'}
              {step.duty ? ` (${step.duty})` : ''}
            </p>
            <p className="mt-0.5 text-[11.5px] text-mutedink">
              The text is frozen while in routing. Any change sends it back to the drafter.
            </p>
          </div>

          {releaseStep ? (
            <div className="space-y-1.5">
              <Button
                type="button"
                size="sm"
                onClick={onRelease}
                disabled={busy || !authority || Boolean(blockedReason)}
                className="w-full gap-1.5 text-[12.5px]"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Release message
              </Button>
              {blockedReason && (
                <p className="text-[11.5px] leading-snug text-mutedink">
                  Release transmits the message, so it needs the network. Leave EMCON to release.
                </p>
              )}
              {!authority && (
                <p className="text-[11.5px] leading-snug text-mutedink">
                  Only the commanding officer or a designated release authority may release. Release authority is
                  designated in Admin · Routing &amp; Release.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onAdvance} disabled={busy} className="gap-1.5 text-[12.5px]">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Endorse and advance
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReturnOpen(true)}
                disabled={busy}
                className="gap-1.5 text-[12.5px]"
              >
                <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Return for correction
              </Button>
            </div>
          )}
        </div>
      )}

      {(draft?.draft_status === 'released' || draft?.draft_status === 'withdrawn') && (
        <p className="rounded-sm border border-line bg-secondary/50 px-3 py-2.5 text-[11.5px] leading-snug text-mutedink">
          {draft.draft_status === 'released'
            ? 'Released. The record is frozen — the transmitted text cannot be edited, and any change must be issued as a corrected copy or an update.'
            : 'Withdrawn before release and retained for the record.'}
        </p>
      )}

      {isOwner && draft?.draft_status !== 'released' && draft?.draft_status !== 'withdrawn' && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onWithdraw}
          disabled={busy}
          className="gap-1.5 text-[12px] text-mutedink"
        >
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Withdraw draft
        </Button>
      )}

      <ReturnDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        busy={busy}
        onConfirm={(comment) => {
          setReturnOpen(false);
          onReturn(comment);
        }}
      />
    </div>
  );
}