import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

/**
 * A dropdown you can type into: the list filters as you type, so a long roster is
 * workable — pick a person by rank, name, position or email.
 *
 * `options` are { value, label, keywords?, disabled? }. An entry that cannot be
 * chosen is shown greyed rather than hidden, so it still tells you why.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Type to filter…',
  emptyText = 'Nothing matches that.',
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const list = options || [];
  const selected = list.find((option) => option.value === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-8 w-full justify-between gap-2 px-2.5 text-left text-[12.5px] font-normal', className)}
        >
          <span className={cn('truncate', !selected && 'text-mutedink')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9 text-[12.5px]" />
          <CommandList>
            <CommandEmpty className="px-3 py-4 text-center text-[12px] text-mutedink">{emptyText}</CommandEmpty>
            {list.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                keywords={[option.label, option.keywords].filter(Boolean)}
                disabled={option.disabled}
                onSelect={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className="text-[12.5px]"
              >
                <Check
                  className={cn('mr-2 h-3.5 w-3.5 shrink-0', option.value === value ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}