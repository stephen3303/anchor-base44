import { useEffect, useState } from 'react';
import { Power, Radio, RefreshCw, Send, ShieldAlert, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SectionCard from '@/components/anchor/SectionCard';
import ServerCard from '@/components/anchor/simulator/ServerCard';
import RepositoryTable from '@/components/anchor/simulator/RepositoryTable';
import TransmissionTable from '@/components/anchor/simulator/TransmissionTable';
import useSimulator from '@/hooks/useSimulator';
import { c2oix, localServer } from '@/lib/simulator';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatZulu } from '@/data/anchorSampleData';
import { cn } from '@/lib/utils';

const PULSE_MS = 20000;
const BUTTON = 'h-9 gap-1.5 border-line text-[12.5px]';

/**
 * The two server simulators, and the traffic moving between them.
 *
 * The external C2OIX server holds the example repository and hands messages over at
 * random intervals; the local ANCHOR server beats the circuit, ingests what arrives,
 * and holds every release for transmit until the circuit takes it. Disconnect the
 * local server and the external one defers; reconnect and it asks for the whole
 * backlog and then pushes the held releases.
 */
export default function Simulators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { servers, messages, transmissions, busy, lastPulse, load, run, pulse } = useSimulator();
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return undefined;
    const id = window.setInterval(() => {
      pulse().catch(() => {});
    }, PULSE_MS);
    return () => window.clearInterval(id);
  }, [auto, pulse]);

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto w-full max-w-[680px] anchor-fade-in">
        <div className="rounded-md border border-line bg-white p-6 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-sm border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedink">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Administrator access
          </span>
          <h1 className="mt-3 font-heading text-[22px] font-semibold tracking-tight text-ink">Server simulators</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mutedink">
            The simulators stand in for the two servers at this command and are driven by an administrator. Link state
            and the transmission queue are shown to everyone under Connectivity.
          </p>
        </div>
      </div>
    );
  }

  const external = servers.c2oix;
  const internal = servers.local;
  const linkUp = internal ? internal.online !== false : true;
  const feedOn = Boolean(external?.feed_active);
  const counts = messages.reduce(
    (total, message) => ({ ...total, [message.status]: (total[message.status] || 0) + 1 }),
    { queued: 0, deferred: 0, ingested: 0 },
  );
  const held = transmissions.filter((item) => item.status === 'held').length;

  const act = async (key, work, failure) => {
    try {
      return await run(key, work);
    } catch (error) {
      toast({ title: failure, description: 'The simulator did not answer. Try again.' });
      return null;
    }
  };

  const resetBoth = () =>
    act(
      'reset',
      async () => {
        await c2oix('reset');
        await localServer('reset');
      },
      'Could not clear the simulators',
    );

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
            Server simulators
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-mutedink">
            Two stand-in servers. The external one holds the example traffic and hands the next message over when an
            operator releases it; the local one beats the circuit, ingests what arrives and holds every release for
            transmit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-pulse" className="text-[11.5px] text-mutedink">
              Auto pulse
            </Label>
            <Switch id="auto-pulse" checked={auto} onCheckedChange={setAuto} />
          </div>
          <Button size="sm" className="h-9 gap-1.5 text-[12.5px]" onClick={() => act('pulse', pulse, 'Pulse failed')} disabled={busy === 'pulse'}>
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {busy === 'pulse' ? 'Pulsing…' : 'Pulse both'}
          </Button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <ServerCard
          title="External C2OIX server"
          stateLabel={feedOn ? 'Feed running' : 'Feed stopped'}
          tone={feedOn ? 'up' : 'attention'}
          meta={external?.last_beat_at ? `beat ${formatZulu(external.last_beat_at)}` : 'no beat yet'}
          subtitle="Holds the repository of example messages and hands the next one to the local server when an operator releases it. Nothing is handed over on the beat. Anything the local server cannot take is held here as deferred."
          facts={[
            { label: 'Queued', value: counts.queued },
            { label: 'Deferred here', value: counts.deferred },
            { label: 'Ingested by local', value: counts.ingested },
            { label: 'Transmissions received', value: external?.received || 0 },
          ]}
          error={external?.last_error}
        >
          <Button
            size="sm"
            variant="outline"
            className={BUTTON}
            onClick={() => act('feed', () => c2oix('feed', { active: !feedOn }), 'Could not change the feed')}
            disabled={busy === 'feed'}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {feedOn ? 'Stop the feed' : 'Start the feed'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={BUTTON}
            onClick={() => act('seed', () => c2oix('seed', { force: messages.length > 0 }), 'Could not load the traffic')}
            disabled={busy === 'seed'}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', busy === 'seed' && 'animate-spin')} aria-hidden="true" />
            {messages.length ? 'Reload example traffic' : 'Load example traffic'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={BUTTON}
            onClick={() => act('c2oix', () => c2oix('release'), 'The C2OIX server did not answer')}
            disabled={busy === 'c2oix'}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Release next message
          </Button>
        </ServerCard>

        <ServerCard
          title="Local ANCHOR server"
          stateLabel={linkUp ? 'Connected to C2OIX' : 'Disconnected'}
          tone={linkUp ? 'up' : 'error'}
          meta={internal?.last_beat_at ? `beat ${formatZulu(internal.last_beat_at)}` : 'no beat yet'}
          subtitle="Beats the C2OIX circuit, ingests what is handed over, and holds every released message until the circuit takes it. Disconnect it to hold traffic, then reconnect: it asks for the whole deferred backlog and then pushes the releases."
          facts={[
            { label: 'Circuit', value: linkUp ? 'up' : 'down' },
            { label: 'Peer', value: `${internal?.peer_state || 'unknown'}${internal?.peer_latency_ms != null ? ` · ${internal.peer_latency_ms} ms` : ''}` },
            { label: 'Beats', value: internal?.beats || 0 },
            { label: 'Messages received', value: internal?.received || 0 },
            { label: 'Held for transmit', value: held },
            { label: 'Releases transmitted', value: transmissions.filter((item) => item.status === 'transmitted').length },
          ]}
          error={internal?.last_error}
        >
          <Button
            size="sm"
            variant="outline"
            className={BUTTON}
            onClick={() =>
              act('link', () => localServer(linkUp ? 'disconnect' : 'connect'), 'The local server did not answer')
            }
            disabled={busy === 'link'}
          >
            <Power className="h-3.5 w-3.5" aria-hidden="true" />
            {linkUp ? 'Disconnect from C2OIX' : 'Reconnect and drain'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={BUTTON}
            onClick={() => act('local', () => localServer('tick'), 'The local server did not answer')}
            disabled={busy === 'local'}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Beat and hold
          </Button>
        </ServerCard>
      </div>

      <p className="text-[11.5px] leading-relaxed text-mutedink">
        {lastPulse
          ? `Last pulse ${formatZulu(lastPulse.at)} — ${lastPulse.result?.skipped ? lastPulse.result.skipped : `${lastPulse.result?.handed || 0} handed over, ${lastPulse.result?.deferred || 0} deferred`}.`
          : 'No pulse yet on this screen.'}{' '}
        A pulse runs every twenty seconds while this screen is open, and the scheduled heartbeat pulses both servers
        every five minutes whether or not anyone is watching.
      </p>

      <SectionCard title="C2OIX repository" hint={`${messages.length} example messages held by the external server`}>
        <RepositoryTable messages={messages} />
      </SectionCard>

      <SectionCard title="Release queue" hint="Held by the local server, pushed on reconnect">
        <TransmissionTable transmissions={transmissions} />
      </SectionCard>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className={cn(BUTTON, 'text-lifecycle-cancelled')}
          onClick={resetBoth}
          disabled={busy === 'reset'}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear the repository and the queue
        </Button>
        <Button size="sm" variant="ghost" className="h-9 text-[12.5px] text-mutedink" onClick={load} disabled={Boolean(busy)}>
          Refresh
        </Button>
      </div>
    </div>
  );
}