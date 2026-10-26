import { useEffect, useState } from 'react';
import { CloudOff, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** The mode control, and an honest statement of what EMCON does and does not do. */
export default function EmconControl({ emcon, onChange, queueLength }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]',
            emcon ? 'border-gold/60 bg-gold/15 text-navy-800' : 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
          )}
        >
          {emcon ? <CloudOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
          {emcon ? 'EMCON / offline' : 'Normal operations'}
        </span>

        <span className="inline-flex items-center gap-2 text-[12px] text-mutedink">
          {online ? <Wifi className="h-3.5 w-3.5 text-lifecycle-active" /> : <WifiOff className="h-3.5 w-3.5 text-lifecycle-cancelled" />}
          {online ? 'Workstation reports a network connection' : 'Workstation reports no network connection'}
        </span>

        <Button
          size="sm"
          className="ml-auto h-9 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={() => setConfirming(true)}
        >
          {emcon ? 'Return to normal operations' : 'Enter EMCON / offline'}
        </Button>
      </div>

      <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-mutedink">
        <li>• Traffic already received stays readable on this workstation.</li>
        <li>
          • Acknowledgements are queued here and replayed on reconnect, acknowledgements first.{' '}
          {queueLength > 0 ? `${queueLength} item${queueLength === 1 ? '' : 's'} waiting.` : 'Nothing is waiting.'}
        </li>
        <li>• Network-only actions are disabled with a reason rather than removed: releasing a draft and searching the live feed both need the network.</li>
        <li>• This is graceful degradation, not an offline document cache.</li>
      </ul>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {emcon ? 'Return to normal operations?' : 'Enter EMCON / offline mode?'}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {emcon
                ? 'Connectivity is restored: queued acknowledgements can be synchronised and network-only actions become available again.'
                : 'Network-only actions are disabled and acknowledgements are queued on this workstation until you return to normal operations.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-9 border-line text-[12.5px]" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 bg-navy-800 text-[12.5px]"
              onClick={() => {
                onChange(!emcon);
                setConfirming(false);
              }}
            >
              {emcon ? 'Return to normal operations' : 'Enter EMCON'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}