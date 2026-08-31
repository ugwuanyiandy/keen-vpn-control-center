import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation";

describe("customer registration validation", () => {
  it("never accepts a client-supplied administrator role", () => {
    const result = signupSchema.parse({
      fullName: "Ada Lovelace",
      email: "NEW@EXAMPLE.COM",
      password: "StrongPass123",
      passwordConfirmation: "StrongPass123",
      role: "ADMIN",
    });

    expect(result.email).toBe("new@example.com");
    expect(result).not.toHaveProperty("role");
  });

  it("rejects a password confirmation mismatch", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "new@example.com",
      password: "StrongPass123",
      passwordConfirmation: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes a valid full name", () => {
    const result = signupSchema.parse({
      fullName: "  Chidi   Okeke  ",
      email: "chidi@example.com",
      password: "StrongPass123",
      passwordConfirmation: "StrongPass123",
    });

    expect(result.fullName).toBe("Chidi Okeke");
  });

  it.each(["Prince", "A Okeke", "Chidi O", "Chidi Okeke2"])("rejects invalid full name %s", (fullName) => {
    const result = signupSchema.safeParse({
      fullName,
      email: "new@example.com",
      password: "StrongPass123",
      passwordConfirmation: "StrongPass123",
    });

    expect(result.success).toBe(false);
  });
});
