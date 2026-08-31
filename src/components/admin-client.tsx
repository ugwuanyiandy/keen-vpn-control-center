import Link from "next/link";
import { Activity, ArrowRight, CircleGauge, Database, Globe2, ServerIcon, UsersRound } from "lucide-react";

type ServerSnapshot = { city?: string; country?: string; hostname?: string };
type AuditItem = {
  id: string;
  action: string;
  actorEmail: string;
  server: { city: string; country: string; hostname: string } | null;
  beforeState: unknown;
  createdAt: string;
};
type Overview = {
  counts: { total: number; active: number; inactive: number; users: number };
  database: "healthy";
  recentActivity: AuditItem[];
};

export function AdminClient({ overview }: { overview: Overview }) {
  return (
    <div className="page-wrap admin-page">
      <header className="page-header">
        <div><p className="section-kicker">Internal operations</p><h1>Network operations</h1><p>Monitor server availability, database health, and recent administrative changes.</p></div>
        <Link className="primary-button" href="/servers"><ServerIcon size={17} aria-hidden="true" />Manage servers</Link>
      </header>

      <section className="metric-grid admin-metrics" aria-label="Operational summary">
        <article className="metric-card"><span className="metric-icon metric-blue"><ServerIcon size={20} aria-hidden="true" /></span><div><span>Total locations</span><strong>{overview.counts.total}</strong><small>Managed endpoints</small></div></article>
        <article className="metric-card"><span className="metric-icon metric-green"><Globe2 size={20} aria-hidden="true" /></span><div><span>Active</span><strong>{overview.counts.active}</strong><small>Customer-visible</small></div></article>
        <article className="metric-card"><span className="metric-icon metric-amber"><CircleGauge size={20} aria-hidden="true" /></span><div><span>Inactive</span><strong>{overview.counts.inactive}</strong><small>Hidden from customers</small></div></article>
        <Link className="metric-card metric-card-link" href="/admin/users"><span className="metric-icon metric-blue"><UsersRound size={20} aria-hidden="true" /></span><div><span>Users</span><strong>{overview.counts.users}</strong><small>Open directory</small></div></Link>
        <article className="metric-card"><span className="metric-icon metric-purple"><Database size={20} aria-hidden="true" /></span><div><span>Database</span><strong className="metric-word">Healthy</strong><small>PostgreSQL reachable</small></div></article>
      </section>

      <section className="panel audit-panel admin-audit-overview" aria-labelledby="audit-title">
        <div className="panel-heading"><div><p className="section-kicker">Audit log</p><h2 id="audit-title">Recent server changes</h2></div><Activity size={20} aria-hidden="true" /></div>
        <div className="audit-list audit-list-wide">
          {overview.recentActivity.map((item) => {
            const target = item.server ?? auditSnapshot(item.beforeState);
            return (
              <article className="audit-item" key={item.id}>
                <span className="audit-dot" />
                <div><p><strong>{item.action.toLowerCase()}</strong> {target ? `${target.city}, ${target.country}` : "a server location"}</p>{target?.hostname && <span>{target.hostname}</span>}<span>{item.actorEmail}</span><time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time></div>
              </article>
            );
          })}
          {!overview.recentActivity.length && <div className="empty-state audit-empty"><Activity size={23} aria-hidden="true" /><strong>No changes yet</strong><p>Server updates will appear here.</p></div>}
        </div>
        <Link className="text-link" href="/servers">Open server management <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}

function auditSnapshot(value: unknown): ServerSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as ServerSnapshot;
  return snapshot.city && snapshot.country ? snapshot : null;
}

function relativeTime(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
