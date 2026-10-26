import { useMemo, useState } from 'react';
import moment from 'moment';
import { Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/anchor/SectionCard';
import TrafficMiniList from '@/components/anchor/TrafficMiniList';
import OpenActionList from '@/components/anchor/OpenActionList';
import PrintWatermark from '@/components/anchor/PrintWatermark';
import ExecutiveSummary from '@/components/anchor/briefings/ExecutiveSummary';
import KeyTakeaways from '@/components/anchor/briefings/KeyTakeaways';
import ClassificationStrip from '@/components/anchor/ClassificationStrip';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { recordAudit } from '@/lib/audit';
import { briefingLines, priorityTraffic } from '@/lib/briefing';
import { SAMPLE_MESSAGES, openActionItems } from '@/data/anchorSampleData';

export default function Briefings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatedAt] = useState(() => moment.utc().toISOString());

  const priority = useMemo(() => priorityTraffic(SAMPLE_MESSAGES), []);
  const actions = useMemo(() => openActionItems(), []);

  const copy = async () => {
    await navigator.clipboard.writeText(briefingLines({ user, generatedAt }));
    await recordAudit({
      action: 'record_printed',
      target_type: 'briefing',
      target_reference: 'Generated briefing',
      detail: 'Briefing text copied out of the application',
    });
    toast({ title: 'Briefing copied', description: 'Plain text on the clipboard, without the AI panel.' });
  };

  const print = async () => {
    await recordAudit({
      action: 'record_printed',
      target_type: 'briefing',
      target_reference: 'Generated briefing',
      detail: 'Briefing sent to print with classification markings and a per-copy watermark',
    });
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 anchor-fade-in">
      <PrintWatermark label="Briefing copy" user={user} />
      <ClassificationStrip />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Act</p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
            Briefing
          </h1>
          <p className="mt-1 text-[13px] text-mutedink">
            Generated from the held traffic set · read-only · all times Zulu
          </p>
        </div>
        <div className="flex flex-wrap gap-2 anchor-no-print">
          <Button size="sm" variant="outline" className="h-9 gap-1.5 border-line text-[12.5px]" onClick={copy}>
            <Copy className="h-3.5 w-3.5" />
            Copy text
          </Button>
          <Button size="sm" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={print}>
            <Printer className="h-3.5 w-3.5" />
            Print briefing
          </Button>
        </div>
      </header>

      <SectionCard title="Situation" hint="Executive summary">
        <ExecutiveSummary generatedAt={generatedAt} />
      </SectionCard>

      <SectionCard title="Key takeaways" hint="Status changes and obligations">
        <KeyTakeaways />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="High-priority traffic" hint={`${priority.length} FLASH or IMMEDIATE`}>
          <TrafficMiniList messages={priority} />
        </SectionCard>

        <SectionCard title="Action items" hint="Sorted by suspense">
          <OpenActionList messages={actions} />
        </SectionCard>
      </div>

      <p className="text-[11px] leading-snug text-mutedink">
        The tailored briefing builder is deferred beyond the pilot: this briefing is generated from the held traffic and
        cannot yet be filtered by community or date range.
      </p>

      <ClassificationStrip />
    </div>
  );
}