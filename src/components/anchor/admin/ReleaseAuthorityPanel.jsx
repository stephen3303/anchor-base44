import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MESSAGE_TYPES } from '@/data/draftOptions';

/**
 * Who may release. The commanding officer holds it inherently and may designate
 * subordinates, optionally limited to a set of message types.
 */
export default function ReleaseAuthorityPanel({ authorities, users, onAdd, onRemove, busy }) {
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [scope, setScope] = useState('all');
  const [isCo, setIsCo] = useState(false);
  const [error, setError] = useState('');

  const add = () => {
    const person = users.find((u) => u.email === email);
    if (!person || !designation.trim()) {
      setError('Select a user and give the designation they hold.');
      return;
    }
    setError('');
    onAdd({
      user_email: person.email,
      user_name: person.full_name || person.email,
      designation: designation.trim(),
      is_commanding_officer: isCo,
      scope_message_types: scope === 'all' ? [] : [scope],
      active: true,
    });
    setEmail('');
    setDesignation('');
    setScope('all');
    setIsCo(false);
  };

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <header className="border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-navy-600" aria-hidden="true" />
          Release authority
        </h3>
      </header>

      <ul className="divide-y divide-line/70">
        {authorities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink">
                {a.user_name}
                {a.is_commanding_officer ? ' · commanding officer' : ''}
                {a.active === false ? ' · inactive' : ''}
              </p>
              <p className="text-[11.5px] text-mutedink">
                {a.designation} · {(a.scope_message_types || []).length ? a.scope_message_types.join(', ') : 'all message types'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(a)} disabled={busy} className="h-8 px-2" title="Remove designation">
              <Trash2 className="h-4 w-4 text-lifecycle-cancelled" />
            </Button>
          </li>
        ))}
        {authorities.length === 0 && (
          <li className="px-4 py-4 text-[12px] text-mutedink">
            No release authority designated. Nothing can be released until one is set.
          </li>
        )}
      </ul>

      <div className="space-y-3 border-t border-line bg-secondary/40 px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">User</Label>
            <Select value={email} onValueChange={setEmail}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Select an app user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.email} value={u.email} className="text-[13px]">
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Designation</Label>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Commanding Officer, XO, CDO"
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Authority scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">
                  All message types
                </SelectItem>
                {MESSAGE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-[13px]">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2 pb-1">
            <Switch id="co-flag" checked={isCo} onCheckedChange={setIsCo} />
            <Label htmlFor="co-flag" className="text-[12.5px] text-ink">
              This is the commanding officer
            </Label>
          </div>
        </div>

        {error && <p className="text-[11.5px] font-semibold text-lifecycle-cancelled">{error}</p>}

        <Button type="button" size="sm" onClick={add} disabled={busy} className="gap-1.5 text-[12.5px]">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Designate release authority
        </Button>
      </div>
    </section>
  );
}