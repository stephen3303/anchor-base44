import { Component } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordFault } from '@/lib/diagnostics';
import FaultStatement from './diagnostics/FaultStatement';

/**
 * Last line of defence. A screen that stops drawing would otherwise leave a blank
 * page and nothing to send shore side, so the fault is captured and rendered as
 * its statement instead.
 *
 * Used twice: inside the shell around the page (so the header and navigation
 * survive, and the operator can leave the broken screen), and once at the top
 * level in case the shell itself is what stopped.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, fault: null };
  }

  // Mark the boundary as failed during the render phase — never re-render the
  // children that just threw — then capture the statement in the commit phase.
  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    let fault = null;
    try {
      fault = recordFault(error, {
        source: 'screen',
        doing: `The screen stopped drawing ${typeof window === 'undefined' ? '' : window.location.pathname}`,
        detail: info?.componentStack ? `Component stack:${info.componentStack}` : '',
      });
    } catch (captureError) {
      fault = null;
    }
    this.setState({ fault });
  }

  render() {
    const { failed, fault } = this.state;
    if (!failed) return this.props.children;

    return (
      <div className="mx-auto w-full max-w-[900px] space-y-4 anchor-fade-in">
        <div className="rounded-md border border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-lifecycle-cancelled" aria-hidden="true" />
            <h1 className="font-heading text-[19px] font-semibold text-ink">
              System fault — this screen stopped
            </h1>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-mutedink">
            The portal caught the fault rather than failing silently, and has written the statement below. Nothing you
            were working on was recorded from the moment it stopped, and the rest of the portal is unaffected.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Reload the screen
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-line text-[12.5px]"
              onClick={() => this.setState({ failed: false, fault: null })}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try drawing it again
            </Button>
          </div>
        </div>

        {fault ? (
          <>
            <FaultStatement fault={fault} />
            <p className="text-[11.5px] text-mutedink">
              Every fault is also kept under Connectivity and transmission → Fault statements, so it can still be sent
              after a reload.
            </p>
          </>
        ) : (
          <p className="rounded-md border border-line bg-page px-4 py-3 text-[12.5px] text-mutedink">
            The statement could not be written on this workstation. Reload and, if the fault repeats, note the screen
            and the time and pass it to the supporting activity.
          </p>
        )}
      </div>
    );
  }
}