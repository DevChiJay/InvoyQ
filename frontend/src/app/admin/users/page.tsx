"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import type { AdminUser, AdminUserListParams } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Trash2,
  FileText,
  Crown,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DURATIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "none", label: "No end date" },
];

type ProDialogState = { kind: "grant" | "revoke"; users: AdminUser[] } | null;

/** Plan column: Free / Pro with its end date, and this month's usage. */
function PlanCell({ user }: { user: AdminUser }) {
  return (
    <div className="space-y-1">
      {user.pro_active ? (
        <Badge variant="info">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      ) : user.is_pro ? (
        <Badge variant="warning">Pro expired</Badge>
      ) : (
        <Badge variant="secondary">Free</Badge>
      )}
      {user.is_pro && (
        <p className="text-xs text-muted-foreground">
          {user.subscription_end_date
            ? `${user.pro_active ? "Until" : "Ended"} ${format(new Date(user.subscription_end_date), "d MMM yyyy")}`
            : "No end date"}
          {user.subscription_provider === "admin" && " · granted"}
        </p>
      )}
      <p className="text-xs text-muted-foreground tabular-nums">
        {user.usage_invoices} {user.usage_invoices === 1 ? "invoice" : "invoices"} · {user.usage_extractions}{" "}
        {user.usage_extractions === 1 ? "extraction" : "extractions"} this month
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [isProFilter, setIsProFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dropdown state

  // Edit dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Grant / remove Pro (one user from the row menu, or everyone selected)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [proDialog, setProDialog] = useState<ProDialogState>(null);
  const [duration, setDuration] = useState<string>("365");
  const [isSavingPro, setIsSavingPro] = useState(false);

  // Delete confirmation dialog
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search only after typing pauses, instead of on every keystroke.
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelected(new Set());

    try {
      const params: AdminUserListParams = {
        skip: (page - 1) * limit,
        limit,
        sort_by: "created_at",
        sort_order: -1,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (isActiveFilter !== "all")
        params.is_active = isActiveFilter === "true";
      if (isProFilter !== "all") params.is_pro = isProFilter === "true";
      if (sourceFilter !== "all") params.registration_source = sourceFilter;

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch users:", err);
      setError(error.response?.data?.detail || "Failed to fetch users");
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, isActiveFilter, isProFilter, sourceFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminAPI.updateUser(user.id, { is_active: !user.is_active });
      toast.success(
        `User ${user.is_active ? "deactivated" : "activated"} successfully`,
      );
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Failed to update user");
    }
  };

  const openProDialog = (kind: "grant" | "revoke", targets: AdminUser[]) => {
    setDuration("365");
    setProDialog({ kind, users: targets });
  };

  const handleProConfirm = async () => {
    if (!proDialog) return;
    const grant = proDialog.kind === "grant";
    const targets = proDialog.users;
    const days = grant && duration !== "none" ? Number(duration) : undefined;

    setIsSavingPro(true);
    try {
      if (targets.length === 1) {
        await adminAPI.updateUser(targets[0].id, { is_pro: grant, ...(days ? { pro_days: days } : {}) });
        toast.success(grant ? "Pro granted" : "Pro removed");
      } else {
        const { data } = await adminAPI.bulkSetPro({ user_ids: targets.map((u) => u.id), is_pro: grant, days });
        toast.success(`Pro ${grant ? "granted to" : "removed from"} ${data.updated} users`);
        if (data.not_found.length > 0) toast.warning(`Not found: ${data.not_found.join(", ")}`);
      }
      setProDialog(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Failed to update Pro status");
    } finally {
      setIsSavingPro(false);
    }
  };

  const allOnPageSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(users.map((u) => u.id)) : new Set());
  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const selectedUsers = users.filter((u) => selected.has(u.id));

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsEditing(true);
    try {
      await adminAPI.updateUser(editingUser.id, {
        full_name: editForm.full_name || undefined,
        email: editForm.email,
      });
      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Failed to update user");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    try {
      await adminAPI.deleteUser(deletingUser.id);
      toast.success("User deleted successfully");
      setDeletingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewInvoices = (user: AdminUser) => {
    router.push(`/admin/users/${user.id}/invoices`);
  };

  const totalPages = Math.ceil(total / limit);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered users ({total} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isProFilter} onValueChange={setIsProFilter}>
            <SelectTrigger className="w-36" aria-label="Filter by plan">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="true">Pro</SelectItem>
              <SelectItem value="false">Free</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-36" aria-label="Filter by source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {someSelected && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border bg-accent px-4 py-3">
          <p className="text-sm font-medium text-accent-foreground">{selected.size} selected</p>
          <Button size="sm" onClick={() => openProDialog("grant", selectedUsers)}>
            <Crown /> Grant Pro
          </Button>
          <Button size="sm" variant="outline" onClick={() => openProDialog("revoke", selectedUsers)}>
            Remove Pro
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found matching your filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all users on this page"
                      checked={allOnPageSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-state={selected.has(user.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${user.full_name || user.email}`}
                        checked={selected.has(user.id)}
                        onCheckedChange={(checked) => toggleOne(user.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {user.avatar_url ? (
                            <AvatarImage
                              src={user.avatar_url}
                              alt={user.full_name || user.email}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary text-white text-sm font-medium">
                            {getInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {user.full_name || "No name"}
                            </p>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {user.invoice_count}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                        className={
                          user.is_active
                            ? "bg-success/10 text-success-strong hover:bg-success/10"
                            : ""
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PlanCell user={user} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.registration_source || "web"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.created_at
                          ? format(new Date(user.created_at), "MMM d, yyyy")
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.full_name || user.email}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => handleEdit(user)}>
                            <Edit /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleToggleActive(user)}>
                            {user.is_active ? <UserX /> : <UserCheck />}
                            {user.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => openProDialog(user.pro_active ? "revoke" : "grant", [user])}
                          >
                            <Crown /> {user.pro_active ? "Remove Pro" : "Grant Pro…"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleViewInvoices(user)}>
                            <FileText /> View Invoices
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeletingUser(user)}>
                            <Trash2 /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Previous page"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Next page"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, full_name: e.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="Enter email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant / remove Pro */}
      <Dialog open={!!proDialog} onOpenChange={(open) => !open && !isSavingPro && setProDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {proDialog?.kind === "grant" ? "Grant Pro" : "Remove Pro"}
              {proDialog && proDialog.users.length > 1 ? ` for ${proDialog.users.length} users` : ""}
            </DialogTitle>
            <DialogDescription>
              {proDialog?.users.length === 1
                ? proDialog.users[0].full_name || proDialog.users[0].email
                : `${proDialog?.users.length ?? 0} selected users`}
              {proDialog?.kind === "grant"
                ? " will get unlimited invoices and AI extractions."
                : " will go back to the Free plan limits straight away."}
            </DialogDescription>
          </DialogHeader>

          {proDialog?.kind === "grant" && (
            <div className="space-y-2 py-2">
              <label htmlFor="pro-duration" className="text-sm font-medium">
                How long
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="pro-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {duration === "none"
                  ? "Pro stays active until you remove it."
                  : "Pro switches off on its own when the time is up."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProDialog(null)} disabled={isSavingPro}>
              Cancel
            </Button>
            <Button
              variant={proDialog?.kind === "revoke" ? "destructive" : "default"}
              onClick={handleProConfirm}
              disabled={isSavingPro}
            >
              {isSavingPro ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : proDialog?.kind === "grant" ? (
                "Grant Pro"
              ) : (
                "Remove Pro"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingUser?.full_name || deletingUser?.email}
              </span>
              ? This will deactivate their account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
