
import { useState, useEffect } from "react";
import { Check, Plus, Search, UserPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchRecipients, createRecipient } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RecipientSelectorProps {
  selectedRecipients: string[];
  onSelectRecipient: (recipientId: string) => void;
}

export function RecipientSelector({ selectedRecipients, onSelectRecipient }: RecipientSelectorProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New recipient form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  
  const { userId } = useAuth();

  // Load recipients on mount
  useEffect(() => {
    const loadRecipients = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error: any) {
        console.error("Failed to load recipients:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load recipients",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipients();
  }, []);

  // Handle adding a new recipient
  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to add recipients",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingRecipient(true);

    try {
      const newRecipient = await createRecipient(
        userId,
        newName,
        newEmail,
        newPhone || undefined
      );
      
      setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
      
      // Auto-select the newly created recipient
      onSelectRecipient(newRecipient.id);
      
      toast({
        title: "Recipient added",
        description: `${newName} has been added to your recipients`
      });
      
      // Reset form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add recipient",
        variant: "destructive"
      });
    } finally {
      setIsAddingRecipient(false);
    }
  };

  // Get selected recipients as objects
  const selectedRecipientObjects = recipients.filter(recipient => 
    selectedRecipients.includes(recipient.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Recipients</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setDialogOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-1" /> Add New
        </Button>
      </div>
      
      {/* Selected recipients display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedRecipientObjects.map(recipient => (
          <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1 py-1 px-3">
            {recipient.name}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onSelectRecipient(recipient.id)}
            />
          </Badge>
        ))}
        {selectedRecipients.length === 0 && (
          <p className="text-sm text-muted-foreground">No recipients selected</p>
        )}
      </div>

      {/* Recipient selector dropdown */}
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
                    setDialogOpen(true);
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
      
      {/* Add new recipient dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddRecipient}>
            <DialogHeader>
              <DialogTitle>Add New Recipient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="555-1234"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingRecipient}>
                {isAddingRecipient ? "Adding..." : "Add Recipient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
