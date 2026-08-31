"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ServerDto } from "@/lib/serializers";

type ServerFormState = Pick<ServerDto, "country" | "city" | "hostname" | "active" | "latencyMs">;

const emptyForm: ServerFormState = {
  country: "",
  city: "",
  hostname: "",
  active: true,
  latencyMs: 50,
};

export function AdminServerDialog({
  server,
  onClose,
  onSaved,
}: {
  server: ServerDto | null;
  onClose: () => void;
  onSaved: (server: ServerDto) => Promise<void>;
}) {
  const [form, setForm] = useState<ServerFormState>(
    server
      ? {
          country: server.country,
          city: server.city,
          hostname: server.hostname,
          active: server.active,
          latencyMs: server.latencyMs,
        }
      : emptyForm,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setErrors({});

    try {
      const response = await fetch(
        server ? `/api/admin/servers/${server.id}` : "/api/admin/servers",
        {
          method: server ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = (await response.json()) as {
        data?: { server: ServerDto };
        error?: { message?: string; fieldErrors?: Record<string, string[]> };
      };
      if (!response.ok || !payload.data) {
        setErrors(payload.error?.fieldErrors ?? {});
        throw new Error(payload.error?.message ?? "Unable to save server.");
      }
      await onSaved(payload.data.server);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="admin-server-dialog" showCloseButton={!pending}>
        <DialogHeader className="keen-dialog-header">
          <div><p className="section-kicker">{server ? "Edit location" : "New location"}</p><h2 id="server-dialog-title">{server ? `${server.city}, ${server.country}` : "Add server location"}</h2></div>
          <DialogTitle className="sr-only">{server ? `Edit ${server.city}, ${server.country}` : "Add server location"}</DialogTitle>
          <DialogDescription className="sr-only">Enter the server location details and choose whether it is active for customers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="server-form" noValidate>
          <div className="form-grid">
            <FormField label="Country" name="country" value={form.country} error={errors.country?.[0]} onChange={(value) => setForm({ ...form, country: value })} />
            <FormField label="City" name="city" value={form.city} error={errors.city?.[0]} onChange={(value) => setForm({ ...form, city: value })} />
          </div>
          <FormField label="Hostname / identifier" name="hostname" value={form.hostname} error={errors.hostname?.[0]} placeholder="lon-02.keenvpn.net" onChange={(value) => setForm({ ...form, hostname: value })} />
          <FormField label="Latency (ms)" name="latencyMs" type="number" value={String(form.latencyMs)} error={errors.latencyMs?.[0]} onChange={(value) => setForm({ ...form, latencyMs: Number(value) })} />
          <div className="switch-field">
            <Label htmlFor="server-active"><span><strong>Location active</strong><small>Active locations are visible to customers</small></span></Label>
            <Switch id="server-active" checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} aria-label="Location active" />
          </div>
          <p className="form-error" role="alert">{message}</p>
          <DialogFooter className="server-form-footer">
            <Button type="button" variant="outline" className="secondary-button" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button type="submit" className="primary-button" disabled={pending}>{pending && <LoaderCircle className="spin" size={17} />}{pending ? "Saving…" : server ? "Save changes" : "Add server"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="form-field">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}
