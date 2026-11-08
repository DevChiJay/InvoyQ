'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProductStore } from '@/stores/product-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { SortableHead } from '@/components/shared/sortable-head';

export function ProductList() {
  const {
    products,
    total,
    hasMore,
    isLoading,
    error,
    filters,
    fetchProducts,
    deleteProduct,
    setFilters,
    clearError,
  } = useProductStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput, skip: 0 });
        fetchProducts({ search: searchInput, skip: 0 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters, fetchProducts]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value, skip: 0 });
    fetchProducts({ [key]: value, skip: 0 });
  };

  const handleSort = (field: string) => {
    const newOrder = filters.sort_by === field && filters.sort_order === -1 ? 1 : -1;
    setFilters({ sort_by: field as any, sort_order: newOrder });
    fetchProducts({ sort_by: field as any, sort_order: newOrder });
  };

  const handleLoadMore = () => {
    const newSkip = (filters.skip || 0) + (filters.limit || 20);
    fetchProducts({ skip: newSkip });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success('Product deactivated successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to deactivate product');
    }
  };

  const sortDirection = (field: string) =>
    filters.sort_by === field ? (filters.sort_order === -1 ? 'desc' : 'asc') : null;
  const hasActiveFilter = Boolean(filters.search) || filters.is_active !== undefined;
  const initialLoading = isLoading && products.length === 0;

  const statusBadge = (active: boolean) => (
    <Badge variant={active ? 'success' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory"
        actions={
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search products"
            placeholder="Search by name, SKU, or description"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.is_active === undefined ? 'all' : filters.is_active ? 'active' : 'inactive'}
          onValueChange={(value) =>
            handleFilterChange('is_active', value === 'all' ? undefined : value === 'active')
          }
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {initialLoading ? (
        <Card className="gap-0 p-4" aria-busy="true">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          {hasActiveFilter ? (
            <EmptyState
              icon={SearchX}
              title="No products match"
              description="Try a different search or status."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    handleFilterChange('is_active', undefined);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Add the things you sell to pick them straight into invoices and track stock."
              action={
                <Button asChild>
                  <Link href="/dashboard/products/new">Add your first product</Link>
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <Card className="hidden gap-0 py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="SKU" direction={sortDirection('sku')} onSort={() => handleSort('sku')} />
                  <SortableHead label="Name" direction={sortDirection('name')} onSort={() => handleSort('name')} />
                  <SortableHead label="Price" align="right" direction={sortDirection('unit_price')} onSort={() => handleSort('unit_price')} />
                  <SortableHead label="In stock" align="right" direction={sortDirection('quantity_available')} onSort={() => handleSort('quantity_available')} />
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={product.unit_price} currency={product.currency} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{product.quantity_available}</TableCell>
                    <TableCell>{statusBadge(product.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/dashboard/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Deactivate ${product.name}`}
                          onClick={() => setDeleteId(product.id)}
                          disabled={!product.is_active}
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
            {products.map((product) => (
              <li key={product.id}>
                <Card className="flex-row items-center gap-3 p-4">
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{product.name}</p>
                      <Money amount={product.unit_price} currency={product.currency} className="font-semibold" />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span className="tabular-nums">
                        {product.sku} · {product.quantity_available} in stock
                      </span>
                      {statusBadge(product.is_active)}
                    </div>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {products.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {products.length} of {total} products
        </p>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Deactivate Product"
        description="This will mark the product as inactive. You can reactivate it later from the product details page."
        confirmText="Deactivate"
      />
    </div>
  );
}
