import { useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/anchor/SectionCard';
import TopologyDiagram from '@/components/anchor/topology/TopologyDiagram';
import ReleaseControls from '@/components/anchor/topology/ReleaseControls';
import ReportedEffects from '@/components/anchor/topology/ReportedEffects';
import useConnectivity from '@/hooks/useConnectivity';
import useTopology from '@/hooks/useTopology';
import { useAuth } from '@/lib/AuthContext';
import { c2oix, localServer } from '@/lib/simulator';
import { CIRCUIT_KEY, deriveTopology } from '@/lib/topology';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const TILE = {
  up: 'border-lifecycle-active/40 bg-lifecycle-active/5',
  attention: 'border-gold/60 bg-gold/10',
  error: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/5',
};

const BUTTON = 'h-9 gap-1.5 border-line text-[12.5px]';

/**
 * A demonstration of the command's links: two servers and three workstations.
 * Any connection can be broken from here, and the command's own reporting is
 * watched as it changes.
 *
 * The circuit is the command's real link state, so breaking it puts every screen
 * into Offline mode. The three workstation links are reported on this diagram and
 * appended to the audit chain.
 *
 * Each node shows how many messages it holds. An administrator can force C2OIX to
 * send its next messages and watch them queue wherever a link is broken.
 */
export default function NetworkTopology() {
  const { user } = useAuth();
  const { external, circuit, report } = useConnectivity();
  const { rows, servers, messages, busy, ready, load, reportLink, restoreAll } = useTopology();
  const { toast } = useToast();
  const [working, setWorking] = useState('');
  const drivesSimulators = user?.role === 'admin';

  const topology = deriveTopology({ rows, servers, external, circuit, messages });
  const { circuitUp, reachable, links, traffic } = topology;
  const active = working || busy;

  /** A workstation that comes back is caught up with what the local server holds for it. */
  const catchUpWorkstations = async () => {
    if (drivesSimulators) await localServer('deliver');
  };

  const dropMessages = async (count, key) => {
    setWorking(key);
    try {
      // The simulator records the drop in the audit chain itself.
      const result = await c2oix('drop', { count });
      if (!result || result.error) throw new Error(result?.error || 'No answer');
      const plural = (n) => `${n} ${n === 1 ? 'message' : 'messages'}`;
      const notes = [
        result.circuit === 'up'
          ? `${result.handed} reached the ANCHOR server${result.held ? `; ${result.held} could not and wait at C2OIX` : ''}.`
          : 'The circuit is down, so they wait at C2OIX and have not been transmitted.',
        result.feed_stopped ? 'The automatic feed is stopped while you drive the queue by hand.' : '',
        result.audited === false ? 'The audit entry could not be written.' : '',
      ];
      toast({
        title: result.released ? `C2OIX dropped ${plural(result.released)}` : 'Nothing to drop',
        description: notes.filter(Boolean).join(' '),
      });
    } catch (error) {
      const reason = error?.data?.error || error?.response?.data?.error;
      toast({ title: 'C2OIX did not drop', description: reason || 'The simulator did not answer. Try again.' });
    } finally {
      setWorking('');
      await load();
    }
  };

  const setFeed = async (activeFeed) => {
    setWorking('feed');
    try {
      await c2oix('feed', { active: activeFeed, audit: true });
      toast({
        title: activeFeed ? 'Automatic feed started' : 'Automatic feed stopped',
        description: activeFeed ? 'C2OIX sends on its own schedule as well.' : 'Only the drop buttons move traffic now.',
      });
    } catch (error) {
      toast({ title: 'Could not change the feed', description: 'Try again.' });
    } finally {
      setWorking('');
      await load();
    }
  };

  const reloadTraffic = async () => {
    const feedWasActive = Boolean(servers.c2oix?.feed_active);
    setWorking('reload');
    try {
      await c2oix('seed', { force: true, audit: true });
      // Loading the repository starts the feed; leave it as the operator had it.
      if (!feedWasActive) await c2oix('feed', { active: false });
      toast({ title: 'Example traffic reloaded', description: 'Every message is back in the C2OIX queue.' });
    } catch (error) {
      toast({ title: 'Could not reload the traffic', description: 'Try again.' });
    } finally {
      setWorking('');
      await load();
    }
  };

  const toggleCircuit = async () => {
    const up = !circuitUp;
    setWorking(CIRCUIT_KEY);
    try {
      await report(
        up,
        up
          ? 'Circuit restored from the network topology demonstration.'
          : 'Circuit broken from the network topology demonstration.',
      );
      const result = drivesSimulators
        ? await localServer(up ? 'connect' : 'disconnect', {
            note: 'Reported from the network topology demonstration.',
          })
        : null;
      if (up && result?.ok === false) {
        toast({
          title: 'Circuit reported up, but C2OIX did not answer',
          description: 'Messages released while it was down still wait at C2OIX. Restore the circuit again.',
        });
        return;
      }
      if (up && result?.backlog?.error) {
        toast({
          title: 'Circuit up, backlog not yet taken',
          description: 'Messages released while it was down still wait at C2OIX. They go with the next drop or feed tick.',
        });
        return;
      }
      const caught = up ? result?.backlog?.ingested || 0 : 0;
      toast({
        title: up ? 'Circuit reported up' : 'Circuit reported down',
        description: up
          ? `Transmission resumed.${caught ? ` ${caught} waiting ${caught === 1 ? 'message' : 'messages'} reached the ANCHOR server.` : ''}`
          : 'Offline mode: work continues, transmission is held.',
      });
    } catch (error) {
      toast({ title: 'Could not report the circuit', description: 'The command server did not answer. Try again.' });
    } finally {
      setWorking('');
    }
  };

  const toggleLink = async (link) => {
    const up = link.state !== 'up';
    setWorking(link.key);
    try {
      await reportLink(
        link.key,
        up ? 'up' : 'down',
        up
          ? 'Connection restored from the network topology demonstration.'
          : 'Connection broken from the network topology demonstration.',
      );
      if (up) await catchUpWorkstations();
      toast({
        title: up ? `${link.label} restored` : `${link.label} broken`,
        description: up
          ? 'That workstation reaches the ANCHOR server again.'
          : 'That workstation now reports the ANCHOR server unreachable.',
      });
    } catch (error) {
      toast({ title: 'Could not report the link', description: 'The command server did not answer. Try again.' });
    } finally {
      setWorking('');
    }
  };

  const restoreEverything = async () => {
    setWorking('all');
    try {
      if (!circuitUp) {
        await report(true, 'Restored from the network topology demonstration.');
        if (drivesSimulators) {
          await localServer('connect', { note: 'Restored from the network topology demonstration.' });
        }
      }
      await restoreAll();
      await catchUpWorkstations();
      toast({
        title: 'All connections restored',
        description: 'The command reports both servers and all three workstations up.',
      });
    } catch (error) {
      toast({ title: 'Could not restore every connection', description: 'Try again.' });
    } finally {
      setWorking('');
    }
  };

  const tiles = [
    {
      label: 'Command posture',
      value: circuitUp ? 'Normal operations' : 'Offline mode',
      tone: circuitUp ? 'up' : 'attention',
    },
    {
      label: 'Connections up',
      value: `${(circuitUp ? 1 : 0) + reachable} of ${links.length + 1}`,
      tone: circuitUp && reachable === links.length ? 'up' : 'error',
    },
    {
      label: 'Workstations reachable',
      value: `${reachable} of ${links.length}`,
      tone: reachable === links.length ? 'up' : 'error',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
            Network topology
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-mutedink">
            A demonstration of the command's links: two servers and three workstations. Break any connection and watch
            how the command reports it. The circuit is the command's own link state, so breaking it reports Offline
            mode on every screen; the workstation links are reported here and in the audit trail.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={cn(BUTTON, 'text-lifecycle-cancelled')}
          onClick={restoreEverything}
          disabled={Boolean(active)}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Restore all connections
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={cn('rounded-md border px-3.5 py-3 shadow-sm', TILE[tile.tone])}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedink">{tile.label}</p>
            <p className="mt-1 font-heading text-[17px] font-semibold text-ink">{tile.value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Command links"
        hint={ready ? 'Click a connection to break or restore it' : 'Reading link state…'}
      >
        {ready ? (
          <TopologyDiagram topology={topology} busy={active} onToggleCircuit={toggleCircuit} onToggleLink={toggleLink} />
        ) : (
          <p className="py-6 text-center text-[12.5px] text-mutedink">Reading link state…</p>
        )}
      </SectionCard>

      <SectionCard title="C2OIX release" hint="Force C2OIX to send, then break links and watch the messages queue">
        <ReleaseControls
          traffic={traffic}
          circuitUp={circuitUp}
          feedActive={Boolean(servers.c2oix?.feed_active)}
          canDrive={drivesSimulators}
          busy={active}
          onDrop={dropMessages}
          onFeed={setFeed}
          onReload={reloadTraffic}
        />
      </SectionCard>

      <SectionCard title="What the command reports" hint="Live, as the links above change">
        <ReportedEffects topology={topology} />
      </SectionCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" className="h-9 text-[12.5px] text-mutedink" onClick={load} disabled={Boolean(active)}>
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} aria-hidden="true" />
          Refresh
        </Button>
        <p className="text-[11.5px] leading-relaxed text-mutedink">
          The two servers are the simulators: their feed, beats and received traffic come from the same rows the Server
          simulators screen drives. An administrator breaking the circuit here also stops the feed and defers what is
          due; for everyone else the circuit is reported and the simulators are left as the watch set them.
        </p>
      </div>
    </div>
  );
}