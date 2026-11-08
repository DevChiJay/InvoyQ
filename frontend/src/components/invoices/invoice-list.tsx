"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FileText, Loader2, Pencil, Search, SearchX, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { SortableHead } from "@/components/shared/sortable-head";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, invoiceClientName } from "@/lib/format";
import type { Invoice, InvoiceListParams } from "@/types/api";

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onDelete?: (id: string, number: string) => void;
  filters?: InvoiceListParams;
  onFilterChange?: (filters: Partial<InvoiceListParams>) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function InvoiceList({
  invoices,
  isLoading,
  onDelete,
  filters,
  onFilterChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: InvoiceListProps) {
  const [searchInput, setSearchInput] = useState(filters?.search || "");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  // Debounced search — propagates to parent (server-side)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters?.search && onFilterChange) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters?.search, onFilterChange]);

  const handleSort = (field: InvoiceListParams["sort_by"]) => {
    if (!onFilterChange || !field) return;
    const newOrder =
      filters?.sort_by === field && filters?.sort_order === -1 ? 1 : -1;
    onFilterChange({ sort_by: field, sort_order: newOrder });
  };

  const handleStatusFilter = (status: string) => {
    if (!onFilterChange) return;
    onFilterChange({
      status: status === "all" ? undefined : (status as Invoice["status"]),
    });
  };

  const activeStatus = filters?.status ?? "all";

  const hasActiveFilter = Boolean(filters?.search || filters?.status);
  const sortDirection = (field: InvoiceListParams["sort_by"]) =>
    filters?.sort_by === field ? (filters?.sort_order === -1 ? "desc" : "asc") : null;

  if (!isLoading && invoices.length === 0 && !hasActiveFilter) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Paste a chat with a client and InvoyQ will draft the invoice, or create one from scratch."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/dashboard/extract">
                  <Sparkles className="h-4 w-4" />
                  Extract from chat
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/invoices/new">Create manually</Link>
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search invoices"
            placeholder="Search by invoice number or client name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={activeStatus}
          onValueChange={(value) => value && handleStatusFilter(value)}
          aria-label="Filter by status"
          className="flex w-full flex-wrap lg:w-auto"
        >
          {STATUS_FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} className="flex-1 px-3 lg:flex-none">
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading ? (
        <Card className="gap-0 p-4" aria-busy="true">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No invoices match"
            description="Try a different search or status."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  onFilterChange?.({ search: "", status: undefined });
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden gap-0 py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Invoice" direction={sortDirection("number")} onSort={() => handleSort("number")} />
                  <TableHead>Client</TableHead>
                  <SortableHead label="Issued" direction={sortDirection("issued_date")} onSort={() => handleSort("issued_date")} />
                  <SortableHead label="Due" direction={sortDirection("due_date")} onSort={() => handleSort("due_date")} />
                  <SortableHead label="Status" direction={sortDirection("status")} onSort={() => handleSort("status")} />
                  <SortableHead label="Amount" align="right" direction={sortDirection("total")} onSort={() => handleSort("total")} />
                  <TableHead className="w-24 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">{invoiceClientName(invoice)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(invoice.issued_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={invoice.total} currency={invoice.currency} className="font-medium" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/dashboard/invoices/${invoice.id}/edit`} aria-label={`Edit ${invoice.number}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${invoice.number}`}
                          onClick={() => onDelete?.(invoice.id, invoice.number ?? "")}
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

          {/* Mobile list */}
          <ul className="space-y-2 md:hidden">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card className="flex-row items-center gap-3 p-4">
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{invoice.number}</p>
                      <Money amount={invoice.total} currency={invoice.currency} className="font-semibold" />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{invoiceClientName(invoice)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={invoice.status} />
                      <span className="text-xs text-muted-foreground">Due {formatDate(invoice.due_date)}</span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${invoice.number}`}
                    onClick={() => onDelete?.(invoice.id, invoice.number ?? "")}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isLoadingMore && (
        <div className="flex justify-center py-4" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading more invoices</span>
        </div>
      )}
    </div>
  );
}
