import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { MediaGallery } from "@/components/MediaGallery";
import { getSeedData } from "@/lib/data";

describe("ui safety", () => {
  it("renders unverified badge", () => {
    render(<UnverifiedBadge status="unverified" />);
    expect(screen.getByText("【未验证】")).toBeInTheDocument();
  });

  it("blocks media interaction before warning confirmation", async () => {
    const user = userEvent.setup();
    const media = getSeedData().media;

    render(<MediaGallery items={media} />);

    expect(screen.getByText("内容警示")).toBeInTheDocument();
    expect(screen.queryByText("手动播放 / 打开原视频")).not.toBeInTheDocument();

    await user.click(screen.getByText("我已了解，继续查看"));
    expect(screen.getAllByText("手动播放 / 打开原视频").length).toBeGreaterThan(0);
  });
});
