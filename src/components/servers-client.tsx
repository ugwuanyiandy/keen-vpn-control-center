"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Gauge,
  Globe2,
  LoaderCircle,
  MapPin,
  Pin,
  Plus,
  Search,
  Trash2,
  Wifi,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { AdminServerDialog } from "@/components/admin-server-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServerDto } from "@/lib/serializers";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { invalidatePageCache } from "@/lib/pagination-cache";

type ServerData = {
  items: ServerDto[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function ServersClient({
  initialData,
  initialPinnedServer,
  isAdmin = false,
}: {
  initialData: ServerData;
  initialPinnedServer: ServerDto | null;
  isAdmin?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(isAdmin ? "createdAt:desc" : "latency:asc");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pinnedServer, setPinnedServer] = useState(initialPinnedServer);
  const [pendingPin, setPendingPin] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ServerDto | null>(null);
  const [editing, setEditing] = useState<ServerDto | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<ServerDto | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState("");
  const [sortKey, order] = sort.split(":");
  const endpoint = isAdmin ? "/api/admin/servers" : "/api/servers";
  const params = useMemo(
    () => ({ q: query, page, pageSize: 12, sort: sortKey, order, ...(isAdmin ? { status } : {}) }),
    [isAdmin, order, page, query, sortKey, status],
  );
  const { data = initialData, loading, error: loadError, refresh } = usePaginatedResource<ServerDto>({
    endpoint,
    params,
    initialData,
    debounceMs: 300,
  });

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changePage(nextPage: number) {
    const boundedPage = Math.min(data.pagination.totalPages, Math.max(1, nextPage));
    if (boundedPage === page) return;

    setPage(boundedPage);
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  async function persistPin(nextServer: ServerDto | null, actionServerId: string) {
    const previous = pinnedServer;
    setPinnedServer(nextServer);
    setPendingPin(actionServerId);
    setMessage(nextServer ? `${nextServer.city} pinned.` : "Pinned location removed.");

    try {
      const response = await fetch("/api/me/pinned-server", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: nextServer?.id ?? null }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to save your pinned location.");
      if (nextServer) toast.success(`${nextServer.city} is now your preferred location.`);
      else toast.info("Pinned location removed.");
    } catch (error) {
      setPinnedServer(previous);
      setMessage(`${(error as Error).message} Your previous preference was restored.`);
      toast.error(`${(error as Error).message} Your previous preference was restored.`);
    } finally {
      setPendingPin(null);
    }
  }

  function requestPin(server: ServerDto) {
    if (pinnedServer?.id === server.id) {
      void persistPin(null, server.id);
      return;
    }
    if (pinnedServer) {
      setConfirmTarget(server);
      return;
    }
    void persistPin(server, server.id);
  }

  async function saveServer(server: ServerDto) {
    const wasEditing = Boolean(editing);
    setEditing(undefined);
    setMessage(`${server.city} was ${wasEditing ? "updated" : "added"}.`);
    toast.success(`${server.city} was ${wasEditing ? "updated" : "added"}.`);
    invalidatePageCache("/api/admin/servers");
    invalidatePageCache("/api/servers");
    await refresh();
  }

  async function deleteServer() {
    if (!deleting) return;
    setDeletePending(true);
    setDeleteError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/servers/${deleting.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to delete server.");
      const deletedCity = deleting.city;
      setDeleting(null);
      setMessage(`${deletedCity} was permanently deleted.`);
      toast.success(`${deletedCity} was permanently deleted.`);
      invalidatePageCache("/api/admin/servers");
      invalidatePageCache("/api/servers");
      if (data.items.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        await refresh();
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setDeleteError(errorMessage);
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header server-header">
        <div>
          <p className="section-kicker">{isAdmin ? "Network inventory" : "Global network"}</p>
          <h1>{isAdmin ? "Server management" : "Server locations"}</h1>
          <p>{isAdmin ? "Create, update, deactivate, or remove VPN server locations." : "Choose an available location and pin your preferred route."}</p>
        </div>
        {isAdmin ? (
          <Button className="primary-button" onClick={() => setEditing(null)}><Plus size={17} aria-hidden="true" />Add server</Button>
        ) : (
          <div className="network-pill">{data.pagination.total} locations online</div>
        )}
      </header>

      <section className="toolbar" aria-label="Server filters">
        <Label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Search by country or city</span><Input className="server-search-input" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search country or city" /></Label>
        <div className="server-filter-group">
          {isAdmin && (
            <div className="sort-field"><Label htmlFor="server-status-filter">Status</Label><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger id="server-status-filter" className="server-select-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All locations</SelectItem><SelectItem value="active">Active only</SelectItem><SelectItem value="inactive">Inactive only</SelectItem></SelectContent></Select></div>
          )}
          <div className="sort-field"><Label htmlFor="server-sort">Sort by</Label><Select value={sort} onValueChange={(value) => { setSort(value); setPage(1); }}><SelectTrigger id="server-sort" className="server-select-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="latency:asc">Lowest latency</SelectItem><SelectItem value="country:asc">Country A–Z</SelectItem><SelectItem value="city:asc">City A–Z</SelectItem><SelectItem value="createdAt:desc">Newest location</SelectItem></SelectContent></Select></div>
        </div>
      </section>

      <div className="results-meta">
        <p><strong>{data.pagination.total}</strong> {isAdmin ? "server records" : "available locations"}</p>
        <p className={clsx("loading-label", loading && "loading-label-active")} aria-live="polite">{loading ? "Updating results…" : loadError || message}</p>
      </div>

      {data.items.length ? (
        <section className={clsx("server-grid", loading && "results-loading")} aria-label={isAdmin ? "VPN server inventory" : "Available VPN servers"} aria-busy={loading}>
          {data.items.map((server) => {
            const isPinned = pinnedServer?.id === server.id;
            const latencyTone = server.latencyMs <= 50 ? "Excellent" : server.latencyMs <= 100 ? "Good" : "Fair";
            return (
              <article className={clsx("server-card", isPinned && "server-card-pinned", isAdmin && !server.active && "server-card-inactive")} key={server.id}>
                <div className="server-card-top">
                  <span className="location-monogram"><Globe2 size={20} aria-hidden="true" /></span>
                  <Badge variant="secondary" className={clsx("status-badge", server.active ? "status-success" : "status-neutral")}><Wifi size={14} aria-hidden="true" />{server.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="server-name"><h2>{server.city}</h2><p>{server.country}</p></div>
                <div className="server-host"><span>Hostname</span><code>{server.hostname}</code></div>
                <div className="server-latency"><div><Gauge size={17} aria-hidden="true" /><span>Latency</span></div><strong>{server.latencyMs} ms <small>{latencyTone}</small></strong></div>
                {isAdmin ? (
                  <div className="server-admin-actions">
                    <Button variant="outline" className="secondary-button" onClick={() => setEditing(server)}><Edit3 size={15} aria-hidden="true" />Edit</Button>
                    <Button variant="destructive" className="danger-button" onClick={() => { setDeleteError(""); setDeleting(server); }}><Trash2 size={15} aria-hidden="true" />Delete</Button>
                  </div>
                ) : (
                  <Button variant={isPinned ? "default" : "outline"} className={clsx("pin-button", isPinned && "pin-button-active")} onClick={() => requestPin(server)} disabled={pendingPin === server.id} aria-pressed={isPinned}>
                    {isPinned ? <Check size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}{pendingPin === server.id ? "Saving…" : isPinned ? "Pinned location" : "Pin this location"}
                  </Button>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <div className="empty-results"><MapPin size={28} aria-hidden="true" /><h2>No locations found</h2><p>Try another country, city, or status.</p><Button variant="link" onClick={() => { changeQuery(""); setStatus("all"); }}>Clear filters</Button></div>
      )}

      <nav className="pagination" aria-label="Server result pages">
        <Button variant="outline" onClick={() => changePage(page - 1)} disabled={page <= 1}><ChevronLeft size={17} aria-hidden="true" />Previous</Button>
        <span>Page <strong>{data.pagination.page}</strong> of {data.pagination.totalPages}</span>
        <Button variant="outline" onClick={() => changePage(page + 1)} disabled={page >= data.pagination.totalPages}>Next<ChevronRight size={17} aria-hidden="true" /></Button>
      </nav>

      {confirmTarget && pinnedServer && (
        <AlertDialog open onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}>
          <AlertDialogContent className="confirmation-dialog">
            <AlertDialogHeader><AlertDialogMedia className="confirmation-icon"><MapPin size={24} aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Disconnect from {pinnedServer.city}?</AlertDialogTitle><AlertDialogDescription>Switching locations will disconnect you from <strong>{pinnedServer.city}, {pinnedServer.country}</strong> and make <strong>{confirmTarget.city}, {confirmTarget.country}</strong> your preferred server.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel className="secondary-button">Cancel</AlertDialogCancel><AlertDialogAction className="primary-button" onClick={() => void persistPin(confirmTarget, confirmTarget.id)}>Disconnect and switch</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {deleting && (
        <AlertDialog open onOpenChange={(open) => { if (!open && !deletePending) setDeleting(null); }}>
          <AlertDialogContent className="confirmation-dialog">
            <AlertDialogHeader><AlertDialogMedia className="confirmation-icon danger-confirmation"><Trash2 size={24} aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Delete {deleting.city}?</AlertDialogTitle><AlertDialogDescription><strong>{deleting.hostname}</strong> will be permanently removed. This cannot be undone, and any customer preference pinned to this server will be cleared.</AlertDialogDescription></AlertDialogHeader>
            {deleteError && <p className="form-error confirmation-error" role="alert">{deleteError}</p>}
            <AlertDialogFooter><AlertDialogCancel className="secondary-button" disabled={deletePending}>Cancel</AlertDialogCancel><Button variant="destructive" className="danger-button" onClick={deleteServer} disabled={deletePending}>{deletePending && <LoaderCircle className="spin" size={16} />}{deletePending ? "Deleting…" : "Delete permanently"}</Button></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {editing !== undefined && <AdminServerDialog server={editing} onClose={() => setEditing(undefined)} onSaved={saveServer} />}
    </div>
  );
}
