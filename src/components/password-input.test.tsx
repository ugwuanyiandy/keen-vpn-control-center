import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@/components/password-input";

describe("password visibility control", () => {
  it("reveals and hides the password without changing its value", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="test-password">Password</label>
        <PasswordInput id="test-password" name="password" />
      </>,
    );

    const input = screen.getByLabelText("Password");
    await user.type(input, "SecretPass123");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("SecretPass123");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
