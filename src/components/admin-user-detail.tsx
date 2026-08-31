"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SubscriptionCard } from "@/components/subscription-card";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import type { PaginatedData } from "@/lib/pagination-cache";
import type { PublicUserDto } from "@/components/admin-users-client";

type HistoryDto = {
  id: string;
  plan: string;
  status: "ACTIVE" | "TRIAL" | "EXPIRED";
  previousPlan: string | null;
  previousStatus: "ACTIVE" | "TRIAL" | "EXPIRED" | null;
  periodStart: string;
  periodEnd: string;
  source: "SELF_SERVICE" | "SEED" | "MIGRATION";
  createdAt: string;
};

export function AdminUserDetail({ user, initialHistory }: { user: PublicUserDto; initialHistory: PaginatedData<HistoryDto> }) {
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, pageSize: 12 }), [page]);
  const { data = initialHistory, loading, error } = usePaginatedResource<HistoryDto>({ endpoint: `/api/admin/users/${user.id}/subscription-history`, params, initialData: initialHistory });

  function changePage(next: number) {
    const bounded = Math.min(data.pagination.totalPages, Math.max(1, next));
    if (bounded === page) return;
    setPage(bounded);
    window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div className="page-wrap admin-user-detail-page">
      <header className="page-header"><div><p className="section-kicker">User directory</p><h1>{user.fullName}</h1><p>Public account information and append-only subscription history.</p></div><Link className="secondary-button" href="/admin/users">Back to users</Link></header>
      <section className="panel account-profile-panel">
        <div className="account-profile-summary"><span className="account-profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><div><p className="section-kicker">KeenVPN profile</p><h2>{user.fullName}</h2><span className="status-badge status-info"><ShieldCheck size={12} aria-hidden="true" />{user.role === "ADMIN" ? "Administrator" : "Customer"}</span></div></div>
        <dl className="account-details account-details-page">
          <div><dt><UserRound size={14} aria-hidden="true" />Full name</dt><dd>{user.fullName}</dd></div>
          <div><dt><Mail size={14} aria-hidden="true" />Email</dt><dd>{user.email}</dd></div>
          <div><dt><MapPin size={14} aria-hidden="true" />Pinned location</dt><dd>{user.pinnedServer ? `${user.pinnedServer.city}, ${user.pinnedServer.country}` : "None"}</dd></div>
          <div><dt><CalendarDays size={14} aria-hidden="true" />Member since</dt><dd>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(user.joinedAt))}</dd></div>
        </dl>
      </section>
      <div className="admin-user-detail-grid">
        <SubscriptionCard subscription={user.subscription} canManage={false} />
        <section className="panel history-panel" aria-labelledby="history-title">
          <div className="panel-heading"><div><p className="section-kicker">Membership record</p><h2 id="history-title">Subscription history</h2></div><Clock3 size={20} aria-hidden="true" /></div>
          <p className="history-status" aria-live="polite">{loading ? "Updating history…" : error}</p>
          <div className="history-list">
            {data.items.map((item) => (
              <article className="history-item" key={item.id}>
                <div><strong>{item.plan}</strong><span>{item.status.replace("_", " ")}</span></div>
                <p>{item.previousPlan ? `Changed from ${item.previousPlan}` : "Initial subscription"}</p>
                <time dateTime={item.createdAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.createdAt))}</time>
              </article>
            ))}
            {!data.items.length && <div className="empty-state"><Clock3 size={24} aria-hidden="true" /><strong>No subscription history</strong><p>This account has not activated a plan.</p></div>}
          </div>
          {data.pagination.totalPages > 1 && <nav className="pagination compact-pagination" aria-label="Subscription history pages"><Button variant="outline" onClick={() => changePage(page - 1)} disabled={page <= 1}><ChevronLeft size={17} />Previous</Button><span>Page <strong>{data.pagination.page}</strong> of {data.pagination.totalPages}</span><Button variant="outline" onClick={() => changePage(page + 1)} disabled={page >= data.pagination.totalPages}>Next<ChevronRight size={17} /></Button></nav>}
        </section>
      </div>
    </div>
  );
}
