import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpdateBanner } from "@/components/UpdateBanner";
import { FilterBar } from "@/components/FilterBar";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";

describe("bilingual rendering", () => {
  it("renders English labels in UpdateBanner", () => {
    render(
      <UpdateBanner
        title="Iran Airstrike Situation Overview"
        summary="Summary"
        updatedAtUtc="2026-02-28 14:32 UTC"
        updatedAtLocal="2026-02-28 09:32 EST"
        coverage="Inside Iran"
        language="en"
      />
    );

    expect(screen.getByText("Top Summary")).toBeInTheDocument();
    expect(screen.getByText(/Data Updated/)).toBeInTheDocument();
  });

  it("renders English controls in FilterBar", () => {
    render(
      <FilterBar
        filters={{
          region: "",
          category: "all",
          verificationStatus: "all",
          minConfidence: 0,
          keyword: ""
        }}
        onChange={vi.fn()}
        language="en"
        onLanguageChange={vi.fn()}
        darkMode={false}
        onDarkModeToggle={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("e.g. Tehran")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("Filter Console")).toBeInTheDocument();
  });

  it("renders English verification badge", () => {
    render(<UnverifiedBadge status="unverified" language="en" />);
    expect(screen.getByText("【Unverified】")).toBeInTheDocument();
  });
});
