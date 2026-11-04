import TopologyLink from './TopologyLink';
import TopologyNode from './TopologyNode';

/**
 * Top to bottom: the external server, the circuit, the command server, then the
 * three workstations it serves. Any connection in the chain can be broken.
 */
export default function TopologyDiagram({ topology, busy, onToggleCircuit, onToggleLink, onShowQueue, onRelease }) {
  const { nodes, links, circuitLink } = topology;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[420px]">
        <TopologyNode
          node={nodes.c2oix}
          busy={busy}
          onRelease={onRelease}
          onShowQueue={() => onShowQueue('c2oix')}
        />
      </div>

      <TopologyLink link={circuitLink} busy={busy} onToggle={onToggleCircuit} />

      <div className="w-full max-w-[420px]">
        <TopologyNode node={nodes.anchor} busy={busy} onShowQueue={() => onShowQueue('anchor')} />
      </div>

      <div className="hidden w-full flex-col items-center sm:flex" aria-hidden="true">
        <span className="h-4 w-0.5 bg-line" />
        <span className="h-0.5 w-2/3 bg-line" />
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <div key={link.key} className="flex flex-col items-center">
            <TopologyLink link={link} busy={busy} onToggle={() => onToggleLink(link)} />
            <TopologyNode node={nodes[link.to]} busy={busy} />
          </div>
        ))}
      </div>

      <p className="mt-4 max-w-[560px] text-center text-[11px] leading-relaxed text-mutedink">
        Every node carries two pipes: inbound traffic coming into the command through it, and outbound traffic it sends
        away. Waiting is what that node holds right now; processed is the running total since the simulators were reset.
        Traffic moves one node at a time: C2OIX holds what the circuit has not carried, the ANCHOR server passes what it
        receives straight on to the workstations, and anything a node cannot pass on waits there — with no workstation
        reachable, a released message waits at the ANCHOR server until a link is restored, then goes on. A pipe greys out
        while the link that carries it is down.
      </p>
    </div>
  );
}