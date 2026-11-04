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
        Traffic bound for this command waits at C2OIX until the circuit can carry it; what the command releases is
        delivered the moment it is transmitted, so nothing waits outbound there. A pipe greys out while its link is down:
        a workstation cut off from the ANCHOR server receives nothing from it, so it counts no processed traffic until
        the link is restored.
      </p>
    </div>
  );
}