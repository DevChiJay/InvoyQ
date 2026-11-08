"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Loader2, Pencil, Search, SearchX, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { Client } from "@/types/api";

interface ClientListProps {
  clients: Client[];
  isLoading?: boolean;
  onDelete?: (id: string, name: string) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onAddClient?: () => void;
}

export function ClientList({
  clients,
  isLoading,
  onDelete,
  searchTerm = "",
  onSearchChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onAddClient,
}: ClientListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Trigger next page load when the sentinel element scrolls into view
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  if (!isLoading && clients.length === 0 && !searchTerm) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add the people and businesses you invoice. Clients found in a chat can be added during extraction too."
          action={onAddClient && <Button onClick={onAddClient}>Add Client</Button>}
        />
      </Card>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search clients"
          placeholder="Search clients by name or email"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <Card className="gap-0 p-4" aria-busy="true">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No clients match"
            description={<>Nothing found for &ldquo;{searchTerm}&rdquo;.</>}
            action={
              <Button variant="outline" onClick={() => onSearchChange?.("")}>
                Clear search
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="hidden gap-0 py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-24 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.email || dash}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{client.phone || dash}</TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">{client.address || dash}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/dashboard/clients/${client.id}/edit`} aria-label={`Edit ${client.name}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${client.name}`}
                          onClick={() => onDelete?.(client.id, client.name)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <ul className="space-y-2 md:hidden">
            {clients.map((client) => (
              <li key={client.id}>
                <Card className="flex-row items-center gap-3 p-4">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <p className="font-medium">{client.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details"}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${client.name}`}
                    onClick={() => onDelete?.(client.id, client.name)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <div ref={sentinelRef} className="h-4" />

      {isLoadingMore && (
        <div className="flex justify-center py-4" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading more clients</span>
        </div>
      )}
    </div>
  );
}
