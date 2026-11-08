"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useClient, useClients, useClientSearch } from "@/lib/hooks/use-clients";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface ClientComboboxProps {
  id?: string;
  value: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** Dropdown of the user's clients with a search box inside it. */
export function ClientCombobox({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const { data: defaultClients } = useClients(50, 0);
  const { data: searchedClients, isFetching } = useClientSearch(debouncedSearch);
  const clients = debouncedSearch ? searchedClients : defaultClients;

  // The chosen client may not be on the first page or in the search results, so look it up directly.
  const knownClient =
    clients?.find((c) => c.id === value) ??
    defaultClients?.find((c) => c.id === value);
  const { data: fetchedClient } = useClient(knownClient ? "" : value);
  const selectedName = (knownClient ?? fetchedClient)?.name;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedName && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="truncate">{selectedName ?? "Select a client"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {/* Filtering is done by the API, so cmdk's own filter is turned off. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search clients..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isFetching && debouncedSearch ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : (
              <CommandEmpty>No clients found.</CommandEmpty>
            )}
            <CommandGroup>
              {clients?.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      client.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{client.name}</span>
                  {client.email && (
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
