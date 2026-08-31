import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthDiscRing } from "@/components/auth-disc-ring";
import { BrandMark } from "@/components/brand-mark";
import { getPageUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getPageUser();
  if (user) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-labelledby="welcome-heading">
        <AuthDiscRing />
        <Link className="brand" href="/" aria-label="KeenVPN home">
          <BrandMark />
          <span>KeenVPN</span>
        </Link>
        <div className="story-copy">
          <p className="eyebrow">VPN Control Center</p>
          <h1 id="welcome-heading">Your privacy network, within reach.</h1>
          <p>Manage your subscription, find the fastest available server, and keep your preferred location one click away.</p>
        </div>
        <div className="network-card" aria-label="Network status preview">
          <div>Network online</div>
          <strong>40 locations</strong>
          <span>Average latency 48 ms</span>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="signin-heading">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-icon" aria-hidden="true">↗</span>
            <p className="eyebrow">Welcome back</p>
            <h2 id="signin-heading">Sign in to your account</h2>
            <p>Enter your details to open the control center.</p>
          </div>
          <AuthForm mode="login" />
          <div className="demo-stack" aria-label="Demo account credentials">
            <div className="demo-note"><span>Active · DemoPass123!</span><code>active@keenvpn.demo</code></div>
            <div className="demo-note"><span>Trial · DemoPass123!</span><code>trial@keenvpn.demo</code></div>
            <div className="demo-note"><span>Expired · DemoPass123!</span><code>expired@keenvpn.demo</code></div>
            <div className="demo-note"><span>No subscription · DemoPass123!</span><code>none@keenvpn.demo</code></div>
            <div className="demo-note"><span>Admin · AdminPass123!</span><code>admin@keenvpn.demo</code></div>
          </div>
          <p className="auth-switch">New to KeenVPN? <Link href="/signup">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
