import Link from "next/link";
import { ArrowRight, Gauge, Globe2, MapPin, RadioTower, ShieldCheck, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCard } from "@/components/subscription-card";
import { getPageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeSubscription } from "@/lib/serializers";

export default async function DashboardPage() {
  const authUser = await getPageUser();
  if (!authUser) redirect("/login");

  const [user, availableCount, fastestServer] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: { id: authUser.id },
      include: { subscription: true, pinnedServer: true },
    }),
    prisma.server.count({ where: { active: true } }),
    prisma.server.findFirst({ where: { active: true }, orderBy: { latencyMs: "asc" } }),
  ]);
  const subscription = serializeSubscription(user.subscription);
  const firstName = user.fullName.split(" ")[0];
  const today = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div><p className="section-kicker">{today}</p><h1>Welcome back, <span>{firstName}</span></h1><p>Here is what is happening across your KeenVPN account.</p></div>
        <Link className="primary-button" href="/servers"><Globe2 size={17} aria-hidden="true" />Browse locations</Link>
      </header>

      <section className="metric-grid" aria-label="VPN overview">
        <article className="metric-card"><span className="metric-icon metric-blue"><RadioTower size={20} /></span><div><span>Available locations</span><strong>{availableCount}</strong><small>Ready to connect</small></div></article>
        <article className="metric-card"><span className="metric-icon metric-green"><Gauge size={20} /></span><div><span>Fastest latency</span><strong>{fastestServer?.latencyMs ?? "—"}<em>{fastestServer ? " ms" : ""}</em></strong><small>{fastestServer ? `${fastestServer.city}, ${fastestServer.country}` : "No active servers"}</small></div></article>
        <article className="metric-card"><span className="metric-icon metric-purple"><ShieldCheck size={20} /></span><div><span>Account protection</span><strong className="metric-word">{subscription.status === "ACTIVE" || subscription.status === "TRIAL" ? "Protected" : "Limited"}</strong><small>{subscription.status === "ACTIVE" ? "Subscription active" : "Plan action may be needed"}</small></div></article>
      </section>

      <div className="dashboard-grid">
        <SubscriptionCard subscription={subscription} canManage={user.role === "CUSTOMER"} />

        <section className="panel pinned-panel" aria-labelledby="pinned-title">
          <div className="panel-heading"><div><p className="section-kicker">Quick connect</p><h2 id="pinned-title">Pinned location</h2></div><MapPin size={20} aria-hidden="true" /></div>
          {user.pinnedServer ? (
            <>
              <div className="pinned-location">
                <span className="location-monogram">{user.pinnedServer.country.slice(0, 2).toUpperCase()}</span>
                <div><strong>{user.pinnedServer.city}</strong><span>{user.pinnedServer.country}</span></div>
                <span className={`status-badge ${user.pinnedServer.active ? "status-success" : "status-danger"}`}>{user.pinnedServer.active ? "Available" : "Unavailable"}</span>
              </div>
              <div className="latency-row"><span>Estimated latency</span><strong>{user.pinnedServer.latencyMs} ms</strong></div>
              {!user.pinnedServer.active && <p className="inline-warning"><TriangleAlert size={16} />This location is offline. Pin another available server.</p>}
            </>
          ) : (
            <div className="empty-state"><MapPin size={25} /><strong>No location pinned</strong><p>Choose one server for faster access next time.</p></div>
          )}
          <Link className="text-link" href="/servers">Choose a location <ArrowRight size={15} /></Link>
        </section>
      </div>
    </div>
  );
}
