import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { recordAudit } from '@/lib/audit';
import { PERSONNEL_STATUS, fullName, matchesSearch, shortName } from '@/lib/personnel';
import PersonnelEditor from './PersonnelEditor';
import PersonnelRoster from './PersonnelRoster';

const PAGE_SIZE = 100;

/** The command roster: who is on staff, in what rank and position. */
export default function PersonnelPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const options = { sort: 'last_name', limit: PAGE_SIZE };
      const page =
        status === 'all'
          ? await base44.entities.Personnel.list(options)
          : await base44.entities.Personnel.filter({ status }, options);
      setRows(page.items || []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => rows.filter((person) => matchesSearch(person, search)), [rows, search]);

  const remove = async () => {
    setBusy(true);
    try {
      await base44.entities.Personnel.delete(removing.id);
      await recordAudit({
        action: 'personnel_changed',
        target_type: 'personnel',
        target_id: removing.id,
        target_reference: shortName(removing),
        detail: `Removed ${fullName(removing)} from the command roster`,
      });
      toast({ title: 'Removed from roster', description: `${shortName(removing)} is no longer listed.` });
      setRemoving(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink">
          <Users className="h-4 w-4 text-navy-600" aria-hidden="true" />
          {rows.length} {rows.length === 1 ? 'person' : 'people'} on the roster
        </span>
        <Button
          size="sm"
          className="ml-auto h-8 gap-1.5 bg-navy-800 text-[12px] hover:bg-navy-600"
          onClick={() => setEditing({ person: null })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add person
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, rank or position"
          className="h-9 max-w-[280px] text-[13px]"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[170px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">
              All statuses
            </SelectItem>
            {PERSONNEL_STATUS.map((entry) => (
              <SelectItem key={entry.value} value={entry.value} className="text-[13px]">
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search && (
          <span className="text-[11.5px] text-mutedink">
            {visible.length} of {rows.length} shown
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-6 text-center text-[12.5px] text-mutedink">Loading roster…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-sm border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-mutedink">
          {rows.length === 0
            ? 'No personnel recorded yet. Add the first person to the command roster.'
            : 'No one on the roster matches that search.'}
        </p>
      ) : (
        <PersonnelRoster
          rows={visible}
          onEdit={(person) => setEditing({ person })}
          onRemove={(person) => setRemoving(person)}
        />
      )}

      <p className="text-[11.5px] text-mutedink">
        The roster is the command&apos;s record of its people and is kept separately from app accounts — a person may
        be listed here without holding a login.
      </p>

      <PersonnelEditor
        person={editing?.person || null}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={load}
      />

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent className="border-line">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-[17px] text-ink">Remove from the roster?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-mutedink">
              {removing ? `${fullName(removing)} — ${removing.rank} ${removing.position}.` : ''} The record is removed
              from the roster and the removal is written to the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[12.5px]" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 bg-lifecycle-cancelled text-[12.5px] text-white hover:bg-lifecycle-cancelled/90"
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
              disabled={busy}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}