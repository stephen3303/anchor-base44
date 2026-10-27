import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerUpLeft, LayoutTemplate } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { BASE_DRAFT, responseDraft } from '@/lib/draftPrefill';
import CreateTemplateDialog from './CreateTemplateDialog';

const PILL =
  'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-semibold text-navy-600 transition-colors hover:border-navy-600/50 hover:bg-navy-100/50 disabled:opacity-60';

/** What a record supports: answer it, or capture it as a template. */
export default function MessageActionBar({ message }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.auth
      .me()
      .then((record) => {
        if (alive) setMe(record);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const draftResponse = async () => {
    setBusy(true);
    try {
      const record = await base44.entities.DraftMessage.create({
        ...BASE_DRAFT,
        ...responseDraft(message),
        creator_name: me?.full_name || '',
      });
      navigate(`/drafting/${record.id}`);
    } catch (error) {
      toast({ title: 'Could not start the response', description: 'The draft was not created. Try again.' });
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={draftResponse} disabled={busy} className={PILL}>
        <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Draft response
      </button>
      <button type="button" onClick={() => setTemplateOpen(true)} disabled={busy} className={PILL}>
        <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
        Create template
      </button>
      <CreateTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} message={message} />
    </div>
  );
}