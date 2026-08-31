import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthDiscRing } from "@/components/auth-disc-ring";
import { BrandMark } from "@/components/brand-mark";
import { getPageUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getPageUser();
  if (user) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-story signup-story" aria-labelledby="signup-welcome-heading">
        <AuthDiscRing />
        <Link className="brand" href="/" aria-label="KeenVPN home">
          <BrandMark />
          <span>KeenVPN</span>
        </Link>
        <div className="story-copy">
          <p className="eyebrow">A safer way online</p>
          <h1 id="signup-welcome-heading">Make the internet yours again.</h1>
          <p>Create your control center account, then choose the server location that works best for you.</p>
        </div>
        <div className="network-card" aria-label="Account benefits">
          <div>Secure by default</div>
          <strong>No card required</strong>
          <span>New accounts begin without a subscription.</span>
        </div>
      </section>
      <section className="auth-panel" aria-labelledby="signup-heading">
        <div className="auth-card">
          <div className="auth-heading compact">
            <span className="auth-icon" aria-hidden="true">+</span>
            <p className="eyebrow">Create an account</p>
            <h2 id="signup-heading">Set up your control center</h2>
            <p>Your new account will be ready to explore server locations.</p>
          </div>
          <AuthForm mode="signup" />
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
