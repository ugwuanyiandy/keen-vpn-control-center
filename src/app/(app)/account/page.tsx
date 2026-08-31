import Link from "next/link";
import { ArrowRight, CalendarDays, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCard } from "@/components/subscription-card";
import { getPageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeSubscription } from "@/lib/serializers";

export default async function AccountPage() {
  const authUser = await getPageUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
    include: { subscription: true, pinnedServer: true },
  });
  const subscription = serializeSubscription(user.subscription);
  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Customer";

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="section-kicker">Account</p>
          <h1>Your account details</h1>
          <p>Review your profile, access level, subscription, and saved location.</p>
        </div>
        <Link className="primary-button" href="/servers"><MapPin size={17} aria-hidden="true" />Manage pinned location</Link>
      </header>

      <section className="panel account-profile-panel" aria-labelledby="profile-heading">
        <div className="account-profile-summary">
          <span className="account-profile-avatar" aria-hidden="true">{user.fullName.slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="section-kicker">KeenVPN profile</p>
            <h2 id="profile-heading">{user.fullName}</h2>
            <span className="status-badge status-info"><ShieldCheck size={12} aria-hidden="true" />{roleLabel}</span>
          </div>
        </div>
        <dl className="account-details account-details-page">
          <div><dt><UserRound size={14} aria-hidden="true" />Full name</dt><dd>{user.fullName}</dd></div>
          <div><dt><Mail size={14} aria-hidden="true" />Email address</dt><dd>{user.email}</dd></div>
          <div><dt><UserRound size={14} aria-hidden="true" />Account role</dt><dd>{roleLabel}</dd></div>
          <div><dt><CalendarDays size={14} aria-hidden="true" />Member since</dt><dd>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(user.createdAt)}</dd></div>
        </dl>
      </section>

      <div className="account-page-grid">
        <SubscriptionCard subscription={subscription} canManage={user.role === "CUSTOMER"} />
        <section className="panel pinned-panel" aria-labelledby="account-location-heading">
          <div className="panel-heading"><div><p className="section-kicker">Preference</p><h2 id="account-location-heading">Pinned location</h2></div><MapPin size={20} aria-hidden="true" /></div>
          {user.pinnedServer ? (
            <div className="pinned-location">
              <span className="location-monogram">{user.pinnedServer.country.slice(0, 2).toUpperCase()}</span>
              <div><strong>{user.pinnedServer.city}</strong><span>{user.pinnedServer.country} · {user.pinnedServer.hostname}</span></div>
              <span className={`status-badge ${user.pinnedServer.active ? "status-success" : "status-danger"}`}>{user.pinnedServer.active ? "Available" : "Unavailable"}</span>
            </div>
          ) : (
            <div className="empty-state"><MapPin size={25} aria-hidden="true" /><strong>No location pinned</strong><p>Choose a preferred server from the location directory.</p></div>
          )}
          <Link className="text-link" href="/servers">Open server locations <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  );
}
