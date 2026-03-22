import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { IncidentDashboard } from "@/components/IncidentDashboard";
import { RealtimeTicker } from "@/components/RealtimeTicker";
import { SourceDrawer } from "@/components/SourceDrawer";
import { MediaGallery } from "@/components/MediaGallery";
import { getSeedData } from "@/lib/data";
import type { Event, MediaItem } from "@/lib/types";

const SAMPLE_EVENT: Event = {
  id: "evt-1",
  timestamp: "2026-03-03T13:20:00Z",
  location: {
    lat: 35.6892,
    lng: 51.389,
    country: "Iran",
    admin_level_1: "Tehran Province",
    admin_level_2: "Tehran"
  },
  category: "communication_disruption",
  description: "Reports indicate reduced internet access speed; duration and coverage are still being updated.",
  source_url: "https://example.com/source",
  source_time: "2026-03-03T13:35:30Z",
  confidence: 0.78,
  verification_status: "verified"
};

const SAMPLE_MEDIA: MediaItem = {
  id: "media-1",
  title: "Tehran skyline smoke-plume footage",
  type: "video",
  thumbnail_url: "https://example.com/thumb.jpg",
  content_url: "https://example.com/video.mp4",
  source_url: "https://example.com/source",
  source_time: "2026-03-03T13:35:30Z",
  verification_status: "verified",
  content_warning: "Contains post-explosion smoke-plume and emergency scenes"
};

describe("A-plan ui improvements", () => {
  it("surfaces the dashboard shell coverage and sync metadata", () => {
    const dashboardData = JSON.parse(JSON.stringify(getSeedData())) as ReturnType<typeof getSeedData>;
    dashboardData.meta.updated_at = "2026-01-01T00:00:00Z";
    dashboardData.meta.last_successful_snapshot = "2026-01-01T00:00:00Z";

    const { unmount } = render(<IncidentDashboard data={dashboardData} />);

    expect(screen.getByText(/Situation Brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Last successful snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Freshness health/i)).toBeInTheDocument();
    expect(screen.getAllByText(/beyond the 72h freshness window/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Trusted sources aligned/i)).toBeInTheDocument();
    expect(screen.getByText(/Count after filters/i)).toBeInTheDocument();
    expect(screen.getByText(/Sector-level view/i)).toBeInTheDocument();

    unmount();
  });

  it("provides pause control for realtime ticker", () => {
    render(<RealtimeTicker events={[SAMPLE_EVENT]} language="en" />);

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("renders content warning as an accessible dialog", () => {
    render(<MediaGallery items={[SAMPLE_MEDIA]} language="en" />);

    expect(screen.getByRole("dialog", { name: /content warning/i })).toBeInTheDocument();
  });

  it("closes source drawer with Escape key", () => {
    const onClose = vi.fn();

    render(
      <SourceDrawer
        open
        title="Airport"
        onClose={onClose}
        sources={[
          {
            source_url: "https://example.com/source",
            source_time: "2026-03-03T13:35:30Z",
            title: "Limited flights resume",
            verification_status: "verified"
          }
        ]}
        language="en"
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
