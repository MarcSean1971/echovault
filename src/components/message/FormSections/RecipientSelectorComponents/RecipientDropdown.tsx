
import { Check, Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Recipient } from "@/types/message";

interface RecipientDropdownProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  recipients: Recipient[];
  selectedRecipients: string[];
  isLoading: boolean;
  onSelectRecipient: (recipientId: string) => void;
  onAddNew: () => void;
}

export function RecipientDropdown({ 
  open, 
  setOpen, 
  recipients, 
  selectedRecipients, 
  isLoading, 
  onSelectRecipient, 
  onAddNew 
}: RecipientDropdownProps) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span>Select recipients...</span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search recipients..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No recipients found'}
            </CommandEmpty>
            <CommandGroup>
              {recipients.map(recipient => (
                <CommandItem
                  key={recipient.id}
                  value={`${recipient.name}-${recipient.email}`}
                  onSelect={() => {
                    onSelectRecipient(recipient.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedRecipients.includes(recipient.id) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span>{recipient.name}</span>
                    <span className="text-xs text-muted-foreground">{recipient.email}</span>
                  </div>
                </CommandItem>
              ))}
              <CommandItem 
                className="border-t mt-1 pt-1 text-primary"
                onSelect={() => {
                  onAddNew();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new recipient
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
