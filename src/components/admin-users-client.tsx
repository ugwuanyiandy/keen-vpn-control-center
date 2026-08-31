"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, MapPin, Search, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import type { PaginatedData } from "@/lib/pagination-cache";
import type { ServerDto } from "@/lib/serializers";

export type PublicUserDto = {
  id: string;
  fullName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  joinedAt: string;
  pinnedServer: ServerDto | null;
  subscription: {
    plan: string | null;
    status: "ACTIVE" | "TRIAL" | "EXPIRED" | "NO_SUBSCRIPTION";
    currentPeriodEnd: string | null;
  };
};

export function AdminUsersClient({ initialData }: { initialData: PaginatedData<PublicUserDto> }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [sortKey, order] = sort.split(":");
  const params = useMemo(() => ({ q: query, status, role, page, pageSize: 12, sort: sortKey, order }), [query, status, role, page, sortKey, order]);
  const { data = initialData, loading, error } = usePaginatedResource<PublicUserDto>({
    endpoint: "/api/admin/users",
    params,
    initialData,
    debounceMs: 300,
  });

  function changePage(next: number) {
    const bounded = Math.min(data.pagination.totalPages, Math.max(1, next));
    if (bounded === page) return;
    setPage(bounded);
    window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div className="page-wrap admin-users-page">
      <header className="page-header">
        <div><p className="section-kicker">Customer operations</p><h1>User directory</h1><p>Review public account details and subscription history. User administration is read-only.</p></div>
        <div className="network-pill"><UsersRound size={15} aria-hidden="true" />{data.pagination.total} accounts</div>
      </header>

      <section className="toolbar users-toolbar" aria-label="User filters">
        <Label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Search by name or email</span><Input className="server-search-input" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name or email" /></Label>
        <div className="server-filter-group">
          <div className="sort-field"><Label htmlFor="user-status">Status</Label><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger id="user-status" className="server-select-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="trial">Trial</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="none">No subscription</SelectItem></SelectContent></Select></div>
          <div className="sort-field"><Label htmlFor="user-role">Role</Label><Select value={role} onValueChange={(value) => { setRole(value); setPage(1); }}><SelectTrigger id="user-role" className="server-select-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="customer">Customers</SelectItem><SelectItem value="admin">Admins</SelectItem></SelectContent></Select></div>
          <div className="sort-field"><Label htmlFor="user-sort">Sort</Label><Select value={sort} onValueChange={(value) => { setSort(value); setPage(1); }}><SelectTrigger id="user-sort" className="server-select-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="createdAt:desc">Newest</SelectItem><SelectItem value="fullName:asc">Name A–Z</SelectItem><SelectItem value="email:asc">Email A–Z</SelectItem></SelectContent></Select></div>
        </div>
      </section>

      <div className="results-meta"><p><strong>{data.pagination.total}</strong> matching accounts</p><p className={clsx("loading-label", loading && "loading-label-active")} aria-live="polite">{loading ? "Updating users…" : error}</p></div>

      {data.items.length ? (
        <section className={clsx("panel user-directory", loading && "results-loading")} aria-label="KeenVPN users" aria-busy={loading}>
          <div className="user-table-head"><span>User</span><span>Role</span><span>Subscription</span><span>Pinned location</span><span>Joined</span><span /></div>
          {data.items.map((user) => <UserRow key={user.id} user={user} />)}
        </section>
      ) : (
        <div className="empty-results"><UsersRound size={28} aria-hidden="true" /><h2>No users found</h2><p>Try a different name, email, role, or status.</p></div>
      )}

      <nav className="pagination" aria-label="User result pages">
        <Button variant="outline" onClick={() => changePage(page - 1)} disabled={page <= 1}><ChevronLeft size={17} aria-hidden="true" />Previous</Button>
        <span>Page <strong>{data.pagination.page}</strong> of {data.pagination.totalPages}</span>
        <Button variant="outline" onClick={() => changePage(page + 1)} disabled={page >= data.pagination.totalPages}>Next<ChevronRight size={17} aria-hidden="true" /></Button>
      </nav>
    </div>
  );
}

function UserRow({ user }: { user: PublicUserDto }) {
  const statusClass = user.subscription.status === "ACTIVE" ? "status-success" : user.subscription.status === "TRIAL" ? "status-info" : user.subscription.status === "EXPIRED" ? "status-danger" : "status-neutral";
  return (
    <article className="user-table-row">
      <div className="table-location"><span className="mini-monogram">{user.fullName.slice(0, 2).toUpperCase()}</span><span><strong>{user.fullName}</strong><small><Mail size={11} aria-hidden="true" />{user.email}</small></span></div>
      <Badge variant="secondary" className="status-badge status-neutral"><UserRound size={12} aria-hidden="true" />{user.role === "ADMIN" ? "Admin" : "Customer"}</Badge>
      <div className="user-subscription"><Badge variant="secondary" className={`status-badge ${statusClass}`}>{user.subscription.status.replace("NO_SUBSCRIPTION", "None")}</Badge><small>{user.subscription.plan ?? "No plan"}</small></div>
      <span className="user-pin"><MapPin size={13} aria-hidden="true" />{user.pinnedServer ? `${user.pinnedServer.city}, ${user.pinnedServer.country}` : "Not pinned"}</span>
      <time dateTime={user.joinedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.joinedAt))}</time>
      <Link className="secondary-button user-view-button" href={`/admin/users/${user.id}`}>View</Link>
    </article>
  );
}
