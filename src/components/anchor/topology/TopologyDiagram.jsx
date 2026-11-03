import TopologyLink from './TopologyLink';
import TopologyNode from './TopologyNode';

/**
 * Top to bottom: the external server, the circuit, the command server, then the
 * three workstations it serves. Any connection in the chain can be broken.
 */
export default function TopologyDiagram({ topology, busy, onToggleCircuit, onToggleLink, onShowQueue }) {
  const { nodes, links, circuitLink } = topology;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[420px]">
        <TopologyNode node={nodes.c2oix} onShowQueue={() => onShowQueue('c2oix')} />
      </div>

      <TopologyLink link={circuitLink} busy={busy} onToggle={onToggleCircuit} />

      <div className="w-full max-w-[420px]">
        <TopologyNode node={nodes.anchor} onShowQueue={() => onShowQueue('anchor')} />
      </div>

      <div className="hidden w-full flex-col items-center sm:flex" aria-hidden="true">
        <span className="h-4 w-0.5 bg-line" />
        <span className="h-0.5 w-2/3 bg-line" />
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <div key={link.key} className="flex flex-col items-center">
            <TopologyLink link={link} busy={busy} onToggle={() => onToggleLink(link)} />
            <TopologyNode node={nodes[link.to]} />
          </div>
        ))}
      </div>
    </div>
  );
}