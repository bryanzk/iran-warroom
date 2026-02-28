import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SocialMediaPanel } from "@/components/SocialMediaPanel";

describe("Social media panel", () => {
  it("keeps a direct source link for traceability", () => {
    render(
      <SocialMediaPanel
        language="en"
        items={[
          {
            id: "SM1",
            platform: "X",
            handle: "@example",
            title: "Test social update",
            url: "https://x.com/example/status/123",
            published_at: "2026-02-28T12:00:00Z",
            verification_status: "verified"
          }
        ]}
      />
    );

    const link = screen.getByRole("link", { name: /Open original post/i });
    expect(link).toHaveAttribute("href", "https://x.com/example/status/123");
  });

  it("falls back to source_url when url is not available", () => {
    render(
      <SocialMediaPanel
        language="zh"
        items={[
          {
            id: "SM2",
            platform: "X",
            handle: "@legacy",
            title: "历史来源",
            url: "",
            source_url: "https://x.com/legacy/status/456",
            published_at: "2026-02-28T12:30:00Z",
            verification_status: "verified"
          }
        ]}
      />
    );

    const link = screen.getByRole("link", { name: /打开原帖/i });
    expect(link).toHaveAttribute("href", "https://x.com/legacy/status/456");
  });
});
