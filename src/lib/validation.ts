import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

const fullNameSchema = z
  .string()
  .trim()
  .max(120, "Full name must be 120 characters or less.")
  .transform((value) => value.replace(/\s+/g, " "))
  .refine(
    (value) => /^\p{L}{2,}(?: \p{L}{2,})+$/u.test(value),
    "Enter at least two name words using two or more letters each.",
  );

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    fullName: fullNameSchema,
    email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match.",
  });

export const pinnedServerSchema = z.object({ serverId: z.string().cuid().nullable() });

const hostnamePattern = /^(?=.{3,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+(?!-)$/i;

export const serverCreateSchema = z.object({
  country: z.string().trim().min(2, "Country is required.").max(80),
  city: z.string().trim().min(2, "City is required.").max(80),
  hostname: z.string().trim().toLowerCase().regex(hostnamePattern, "Enter a valid hostname."),
  active: z.boolean(),
  latencyMs: z.coerce.number().int().min(1, "Latency must be at least 1 ms.").max(2000, "Latency must be 2,000 ms or less."),
});

export const serverUpdateSchema = serverCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Provide at least one field to update.",
);

export const serverQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["latency", "country", "city", "createdAt"]).default("latency"),
  order: z.enum(["asc", "desc"]).default("asc"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const planActivationSchema = z.object({
  planId: z.enum(["keen-essential", "keen-plus", "keen-max"], {
    message: "Choose a valid KeenVPN plan.",
  }),
});

export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["all", "active", "trial", "expired", "none"]).default("all"),
  role: z.enum(["all", "customer", "admin"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["fullName", "email", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const subscriptionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}
