import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Route, ShieldAlert } from 'lucide-react';
import SectionCard from '@/components/anchor/SectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovalQueue from '@/components/anchor/admin/ApprovalQueue';
import AlertRuleTable from '@/components/anchor/admin/AlertRuleTable';
import PersonnelPanel from '@/components/anchor/admin/PersonnelPanel';
import { useAuth } from '@/lib/AuthContext';
import useAlertRules from '@/hooks/useAlertRules';

export default function Admin() {
  const { user } = useAuth();
  const loaded = useAlertRules();
  const [saved, setSaved] = useState(null);
  const rules = (saved ? [saved, ...loaded.filter((rule) => rule.id !== saved.id)] : loaded).sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
  );

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto w-full max-w-[680px] anchor-fade-in">
        <div className="rounded-md border border-line bg-white p-6 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-sm border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedink">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Administrator access
          </span>
          <h1 className="mt-3 font-heading text-[22px] font-semibold tracking-tight text-ink">Admin</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mutedink">
            Subscription approvals and alert rules are administrator actions. You can still request a feed from
            Subscriptions, and the acknowledgement obligations that apply to you are shown on Home.
          </p>
          <Link
            to="/subscriptions"
            className="mt-4 inline-block text-[12.5px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
          >
            Go to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 anchor-fade-in">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">Admin</h1>
        <p className="mt-1 text-[13px] text-mutedink">
          Command roster, subscription decisions, mandatory alert rules and the acknowledgement window each rule carries
        </p>
      </header>

      <Tabs defaultValue="personnel">
        <TabsList className="border border-line bg-white">
          <TabsTrigger value="personnel" className="text-[12.5px]">
            Personnel
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-[12.5px]">
            Approvals
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-[12.5px]">
            Alert rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="mt-4">
          <SectionCard title="Command roster" hint="Name, rank and position — administered by the command">
            <PersonnelPanel />
          </SectionCard>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <SectionCard title="Subscription approvals" hint="Approve or deny with a recorded comment">
            <ApprovalQueue />
          </SectionCard>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <SectionCard title="Mandatory delivery and acknowledgement" hint="Conditions, windows, escalation">
            <AlertRuleTable rules={rules} onSaved={setSaved} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <SectionCard title="Routing and release" hint="Drafting authorities">
        <Link
          to="/admin/routing"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
        >
          <Route className="h-4 w-4" aria-hidden="true" />
          Routing workflows, release authorities and command transmission settings
        </Link>
      </SectionCard>
    </div>
  );
}