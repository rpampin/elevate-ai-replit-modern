import * as React from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  id: number;
  name: string;
}

interface CreatableSelectProps {
  options: Option[];
  value?: number;
  placeholder?: string;
  onSelect: (value: number) => void;
  onCreate: (name: string) => Promise<Option>;
  className?: string;
}

export function CreatableSelect({
  options,
  value,
  placeholder = "Select option...",
  onSelect,
  onCreate,
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const selectedOption = options.find(option => option.id === value);

  const handleCreate = async () => {
    if (!search.trim()) return;
    
    setCreating(true);
    try {
      const newOption = await onCreate(search.trim());
      onSelect(newOption.id);
      setSearch("");
      setOpen(false);
    } catch (error) {
      console.error('Failed to create option:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filteredOptions.find(
    option => option.name.toLowerCase() === search.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedOption ? selectedOption.name : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search or type to create..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search && !exactMatch ? (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {creating ? "Creating..." : `Create "${search}"`}
                  </Button>
                </div>
              ) : (
                "No options found."
              )}
            </CommandEmpty>
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => {
                      onSelect(option.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search && !exactMatch && filteredOptions.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} disabled={creating}>
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? "Creating..." : `Create "${search}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}