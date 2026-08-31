"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BadgeDollarSign, Globe2, LayoutDashboard, LogOut, Menu, UserRound, UsersRound, X } from "lucide-react";
import { ReactNode, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

type ShellUser = { fullName: string; email: string; role: "CUSTOMER" | "ADMIN" };

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/servers", label: "Server locations", icon: Globe2 },
    ...(user.role === "CUSTOMER" ? [{ href: "/plans", label: "Plans", icon: BadgeDollarSign }] : []),
    ...(user.role === "ADMIN"
      ? [
          { href: "/admin", label: "Operations", icon: Activity },
          { href: "/admin/users", label: "Users", icon: UsersRound },
        ]
      : []),
  ];

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      toast.success("You have been signed out.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="app-frame">
      <header className="mobile-header">
        <Brand />
        <Button variant="ghost" size="icon" className="icon-button" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-label="Toggle navigation">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </header>
      {mobileOpen && <Button variant="ghost" className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={clsx("sidebar", mobileOpen && "sidebar-open")}>
        <Brand />
        <nav className="side-nav" aria-label="Main navigation">
          <span className="nav-label">Control center</span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx("nav-link", pathname === href && "nav-link-active")} onClick={() => setMobileOpen(false)}>
              <Icon size={18} aria-hidden="true" />{label}
            </Link>
          ))}
          <span className="nav-label nav-label-spaced">Account</span>
          <Link href="/account" className={clsx("nav-link", pathname === "/account" && "nav-link-active")} onClick={() => setMobileOpen(false)}><UserRound size={18} aria-hidden="true" />Account details</Link>
        </nav>
        <div className="sidebar-footer">
          <div className="account-chip">
            <span className="account-avatar">{user.fullName.slice(0, 1).toUpperCase()}</span>
            <span><strong>{user.fullName}</strong><small>{user.email}</small></span>
          </div>
          <Button variant="ghost" className="logout-button" onClick={logout}><LogOut size={17} aria-hidden="true" />Sign out</Button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}

function Brand() {
  return (
    <Link className="app-brand" href="/dashboard" aria-label="KeenVPN dashboard">
      <BrandMark variant="app" />
      <span>KeenVPN<small>Control Center</small></span>
    </Link>
  );
}
