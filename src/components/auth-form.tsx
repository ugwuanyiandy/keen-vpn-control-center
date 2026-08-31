"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";

type AuthMode = "login" | "signup";
type ApiError = { error?: { message?: string; fieldErrors?: Record<string, string[]> } };

const AUTH_TOAST_ID = "auth-form";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const body = {
      ...(mode === "signup" ? { fullName: formData.get("fullName") } : {}),
      email: formData.get("email"),
      password: formData.get("password"),
      ...(mode === "signup" ? { passwordConfirmation: formData.get("passwordConfirmation") } : {}),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) {
        const errorMessage = payload.error?.message ?? "Unable to continue. Please try again.";
        setFieldErrors(payload.error?.fieldErrors ?? {});
        toast.error(errorMessage, { id: AUTH_TOAST_ID });
        return;
      }
      toast.success(mode === "signup" ? "Your KeenVPN account is ready." : "Welcome back to KeenVPN.", { id: AUTH_TOAST_ID });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("We could not reach the service. Check your connection and try again.", { id: AUTH_TOAST_ID });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {mode === "signup" && (
        <div className="auth-field">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" type="text" placeholder="First and last name" autoComplete="name" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "full-name-error" : undefined} />
          {fieldErrors.fullName && <p className="field-error" id="full-name-error">{fieldErrors.fullName[0]}</p>}
        </div>
      )}

      <div className="auth-field">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
        {fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email[0]}</p>}
      </div>

      <div className="auth-field">
        <div className="label-row">
          <Label htmlFor="password">Password</Label>
          <span>{mode === "signup" ? "10+ characters" : "Secure session"}</span>
        </div>
        <PasswordInput id="password" name="password" placeholder={mode === "signup" ? "Create a password" : "Enter your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} />
        {fieldErrors.password && <p className="field-error" id="password-error">{fieldErrors.password[0]}</p>}
      </div>

      {mode === "signup" && (
        <div className="auth-field">
          <Label htmlFor="passwordConfirmation">Confirm password</Label>
          <PasswordInput id="passwordConfirmation" name="passwordConfirmation" placeholder="Repeat your password" autoComplete="new-password" aria-invalid={Boolean(fieldErrors.passwordConfirmation)} aria-describedby={fieldErrors.passwordConfirmation ? "confirmation-error" : undefined} />
          {fieldErrors.passwordConfirmation && <p className="field-error" id="confirmation-error">{fieldErrors.passwordConfirmation[0]}</p>}
        </div>
      )}

      <Button className="auth-submit-button" type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
        {pending ? "Please wait" : mode === "signup" ? "Create account" : "Sign in"}
        {!pending && <span aria-hidden="true">→</span>}
      </Button>
    </form>
  );
}
