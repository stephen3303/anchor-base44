import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** A kick-back must carry a reason — the drafter has to know what to correct. */
export default function ReturnDialog({ open, onOpenChange, onConfirm, busy }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const confirm = () => {
    if (!comment.trim()) {
      setError('A comment is required so the drafter knows what to correct.');
      return;
    }
    onConfirm(comment.trim());
    setComment('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Return for correction</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            The draft goes back to the drafter. The comment and your name are written to the route log.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setError('');
          }}
          rows={4}
          placeholder="What must be corrected before this can be released?"
          className="text-[13px]"
        />
        {error && <p className="text-[11.5px] font-semibold text-lifecycle-cancelled">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={confirm} disabled={busy}>
            Return to drafter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}