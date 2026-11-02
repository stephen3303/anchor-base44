import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CommaListInput from '@/components/anchor/drafting/CommaListInput';
import { MESSAGE_TYPES, PRECEDENCES } from '@/data/draftOptions';
import { COMMUNITIES } from '@/data/anchorSampleData';
import { USE_LABEL } from '@/lib/templateMatch';
import { cn } from '@/lib/utils';

const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink';

const Chip = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-1 rounded-sm border px-2 py-[3px] text-[11px] transition-colors',
      active
        ? 'border-navy-800 bg-navy-800 font-semibold text-white'
        : 'border-line bg-white text-mutedink hover:border-navy-600/50 hover:text-ink',
    )}
  >
    {active && <Check className="h-3 w-3" aria-hidden="true" />}
    {children}
  </button>
);

/**
 * The terms and tags a template uses to claim traffic. Subject and body terms
 * identify traffic by its content; a list left empty places no condition, and a
 * template with nothing set at all claims nothing.
 */
export default function TemplateTriggerEditor({ value, onChange }) {
  const list = (key) => value[key] || [];

  const toggle = (key, item) =>
    onChange({ [key]: list(key).includes(item) ? list(key).filter((entry) => entry !== item) : [...list(key), item] });

  const taggedAnywhere = [
    'tag_message_types',
    'tag_originators',
    'tag_communities',
    'tag_precedence',
    'tag_subject_keywords',
    'tag_body_keywords',
  ].some((key) => list(key).length > 0);

  return (
    <div className="space-y-3 rounded-sm border border-line bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={LABEL}>Identifies traffic by content</p>
        <Select value={value.trigger_use || 'both'} onValueChange={(v) => onChange({ trigger_use: v })}>
          <SelectTrigger className="h-7 w-[168px] text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(USE_LABEL).map(([option, label]) => (
              <SelectItem key={option} value={option}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Message type</Label>
        <div className="flex flex-wrap gap-1">
          {MESSAGE_TYPES.map((type) => (
            <Chip key={type} active={list('tag_message_types').includes(type)} onClick={() => toggle('tag_message_types', type)}>
              {type}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Community</Label>
        <div className="flex flex-wrap gap-1">
          {COMMUNITIES.map((community) => (
            <Chip
              key={community}
              active={list('tag_communities').includes(community)}
              onClick={() => toggle('tag_communities', community)}
            >
              {community}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Precedence</Label>
        <div className="flex flex-wrap gap-1">
          {PRECEDENCES.map((precedence) => (
            <Chip
              key={precedence}
              active={list('tag_precedence').includes(precedence)}
              onClick={() => toggle('tag_precedence', precedence)}
            >
              {precedence}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Originator (FM)</Label>
        <CommaListInput
          value={list('tag_originators')}
          onChange={(next) => onChange({ tag_originators: next })}
          placeholder="COMSUBLANT NORFOLK VA, CNO WASHINGTON DC"
        />
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Subject terms</Label>
        <CommaListInput
          value={list('tag_subject_keywords')}
          onChange={(next) => onChange({ tag_subject_keywords: next })}
          placeholder="READINESS, DEPLOYMENT"
        />
        <p className="text-[10.5px] leading-snug text-mutedink">
          Any one of these terms in the subject claims the message. Terms are matched without regard to case.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL}>Body terms</Label>
        <CommaListInput
          value={list('tag_body_keywords')}
          onChange={(next) => onChange({ tag_body_keywords: next })}
          placeholder="REPORTING MATRIX, INTERIM REPORT"
        />
        <p className="text-[10.5px] leading-snug text-mutedink">
          Any one of these terms in the message text claims the message, matched without regard to case. Subject and body
          terms identify traffic by what it says, not by who sent it.
        </p>
      </div>

      {!taggedAnywhere && (
        <p className="text-[11px] font-semibold text-precedence-immediate">
          No tag set — this template claims no traffic, so it can neither receive feeds nor validate a message.
        </p>
      )}
    </div>
  );
}