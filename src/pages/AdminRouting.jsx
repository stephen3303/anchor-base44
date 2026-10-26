import { useEffect, useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ReleaseAuthorityPanel from '@/components/anchor/admin/ReleaseAuthorityPanel';
import CommandSettingsPanel from '@/components/anchor/admin/CommandSettingsPanel';
import RoutingWorkflowList from '@/components/anchor/admin/RoutingWorkflowList';
import { loadCommandSettings } from '@/lib/commandSettings';
import RoutingWorkflowEditor from '@/components/anchor/admin/RoutingWorkflowEditor';

export default function AdminRouting() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [setting, setSetting] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [wf, auth, roster, me, command] = await Promise.all([
      base44.entities.RoutingWorkflow.list(),
      base44.entities.ReleaseAuthority.list(),
      base44.entities.Personnel.list({ sort: 'last_name', limit: 200 }),
      base44.auth.me(),
      loadCommandSettings(),
    ]);
    setWorkflows(wf || []);
    setAuthorities(auth || []);
    setPersonnel(roster?.items || []);
    setUser(me);
    setSetting(command);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveWorkflow = async (form) => {
    setBusy(true);
    try {
      const steps = form.steps.map((s, i) => ({ ...s, order: i + 1 }));
      const payload = {
        name: form.name.trim(),
        description: form.description,
        active: form.active !== false,
        match_message_types: form.match_message_types,
        match_originators: form.match_originators,
        steps,
        created_by_name: user?.full_name || '',
      };
      if (editing?.id) {
        await base44.entities.RoutingWorkflow.update(editing.id, payload);
      } else {
        await base44.entities.RoutingWorkflow.create(payload);
      }
      await load();
      setEditing(null);
      toast({ title: 'Routing workflow saved', description: 'New submissions will match it immediately.' });
    } finally {
      setBusy(false);
    }
  };

  const toggleWorkflow = async (workflow) => {
    setBusy(true);
    try {
      await base44.entities.RoutingWorkflow.update(workflow.id, { active: workflow.active === false });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const addAuthority = async (record) => {
    setBusy(true);
    try {
      await base44.entities.ReleaseAuthority.create({ ...record, designated_by_name: user?.full_name || '' });
      await load();
      toast({ title: 'Release authority designated', description: `${record.user_name} may now release messages.` });
    } finally {
      setBusy(false);
    }
  };

  const saveCommandSetting = async (form) => {
    setBusy(true);
    try {
      const payload = {
        text_case: form.text_case,
        sequence_prefix: String(form.sequence_prefix ?? '#'),
        sequence_digits: Math.min(8, Math.max(1, Math.trunc(Number(form.sequence_digits) || 4))),
        next_sequence: Math.max(1, Math.trunc(Number(form.next_sequence) || 1)),
        updated_by_name: user?.full_name || '',
      };
      if (setting?.id) await base44.entities.CommandSetting.update(setting.id, payload);
      else await base44.entities.CommandSetting.create(payload);
      await load();
      toast({ title: 'Command settings saved', description: 'The next release follows them.' });
    } finally {
      setBusy(false);
    }
  };

  const removeAuthority = async (record) => {
    setBusy(true);
    try {
      await base44.entities.ReleaseAuthority.delete(record.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-10 text-[12.5px] text-mutedink">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-navy-600" />
        Loading routing configuration…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 anchor-fade-in">
      <header>
        <h1 className="font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
          Routing &amp; Release
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-mutedink">
          Define the chains a message follows by type and originator, designate who holds release authority, and set the
          transmission settings every released message obeys. Routing steps and release authority are drawn from the
          personnel roster, so a step is held by a person in a rank and position rather than by a login. Every advance,
          kick-back and release against these chains is written to an append-only route log.
        </p>
      </header>

      {user?.role !== 'admin' && (
        <div className="flex items-start gap-2 rounded-sm border border-precedence-immediate/40 bg-precedence-immediate/10 px-3 py-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-precedence-immediate" aria-hidden="true" />
          <p className="text-[12px] leading-snug text-ink">
            This configuration is admin-only. You can read it, but changes are refused unless you are an
            administrator.
          </p>
        </div>
      )}

      <ReleaseAuthorityPanel
        authorities={authorities}
        personnel={personnel}
        onAdd={addAuthority}
        onRemove={removeAuthority}
        busy={busy}
      />

      <CommandSettingsPanel
        setting={setting}
        disabled={user?.role !== 'admin'}
        busy={busy}
        onSave={saveCommandSetting}
      />

      <section className="rounded-md border border-line bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold text-ink">Routing workflows</h3>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setEditing({})}
            disabled={busy || Boolean(editing)}
            className="gap-1.5 text-[12.5px]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New workflow
          </Button>
        </header>

        {editing ? (
          <div className="p-4">
            <RoutingWorkflowEditor
              workflow={editing.id ? editing : null}
              personnel={personnel}
              onSave={saveWorkflow}
              onCancel={() => setEditing(null)}
              busy={busy}
            />
          </div>
        ) : (
          <RoutingWorkflowList workflows={workflows} onEdit={setEditing} onToggle={toggleWorkflow} busy={busy} />
        )}
      </section>
    </div>
  );
}