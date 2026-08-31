"use client";

import { type ComponentProps, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  const inputId = props.id;

  return (
    <div className="password-input-wrap">
      <Input {...props} type={visible ? "text" : "password"} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="password-visibility-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={inputId}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
