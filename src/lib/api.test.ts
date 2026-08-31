import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { AppError, assertSameOrigin } from "@/lib/api";

const originalAppOrigin = process.env.APP_ORIGIN;

afterEach(() => {
  if (originalAppOrigin === undefined) {
    delete process.env.APP_ORIGIN;
  } else {
    process.env.APP_ORIGIN = originalAppOrigin;
  }
});

function mutationRequest(origin: string, fetchSite = "same-origin") {
  return new NextRequest(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      origin,
      "sec-fetch-site": fetchSite,
    },
  });
}

describe("same-origin mutation protection", () => {
  it("accepts the 127.0.0.1 alias when localhost is configured", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";

    expect(() =>
      assertSameOrigin(mutationRequest("http://127.0.0.1:3000")),
    ).not.toThrow();
  });

  it("still rejects different ports and cross-site fetches", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";

    expect(() =>
      assertSameOrigin(mutationRequest("http://127.0.0.1:3001")),
    ).toThrow(AppError);
    expect(() =>
      assertSameOrigin(mutationRequest("http://127.0.0.1:3000", "cross-site")),
    ).toThrow(AppError);
  });
});
