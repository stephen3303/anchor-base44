import { useState } from 'react';
import { CloudOff } from 'lucide-react';
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
import useEmcon from '@/hooks/useEmcon';

/**
 * The status indicator in the header is the control: it shows connectivity and
 * changes the mode, behind a confirmation because it changes what every screen
 * can do.
 */
export default function EmconToggle() {
  const [emcon, setEmcon] = useEmcon();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title={emcon ? 'Return to normal operations' : 'Enter EMCON / offline mode'}
        className={cn(
          'flex items-center gap-2 rounded-sm border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors',
          emcon
            ? 'border-gold/60 bg-gold/15 text-gold hover:bg-gold/25'
            : 'border-white/15 text-navy-100/80 hover:border-white/30 hover:text-white',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-2 w-2 rounded-full',
            emcon ? 'bg-gold' : 'bg-[#2FBF71] shadow-[0_0_0_3px_rgba(47,191,113,0.18)]',
          )}
        />
        <span className="hidden sm:inline">{emcon ? 'EMCON / Offline' : 'Unclassified · Online'}</span>
      </button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <CloudOff className="h-4 w-4" aria-hidden="true" />
              {emcon ? 'Return to normal operations?' : 'Enter EMCON / offline mode?'}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {emcon
                ? 'Queued acknowledgements can be synchronised and network-only actions become available again.'
                : 'Network-only actions are disabled with a reason and acknowledgements are queued on this workstation until you return to normal operations.'}
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
                setEmcon(!emcon);
                setConfirming(false);
              }}
            >
              {emcon ? 'Return to normal operations' : 'Enter EMCON'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}