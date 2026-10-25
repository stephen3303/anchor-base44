import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Comma-separated addressee list. Holds its own text so a trailing comma or space
 * is not stripped mid-typing, and re-syncs only when the parsed list really differs.
 */
export default function CommaListInput({ value, onChange, disabled, placeholder }) {
  const [text, setText] = useState(() => (value || []).join(', '));

  useEffect(() => {
    const parsed = text.split(',').map((s) => s.trim()).filter(Boolean).join(', ');
    const incoming = (value || []).join(', ');
    if (incoming !== parsed) setText(incoming);
  }, [value]);

  const handle = (next) => {
    setText(next);
    onChange(next.split(',').map((s) => s.trim()).filter(Boolean));
  };

  return (
    <Input
      value={text}
      onChange={(e) => handle(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="anchor-mono text-[12.5px]"
    />
  );
}