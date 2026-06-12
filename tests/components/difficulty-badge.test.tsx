import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

describe("DifficultyBadge", () => {
  it.each(["Easy", "Medium", "Hard"])("renders %s", (difficulty) => {
    render(<DifficultyBadge difficulty={difficulty} />);
    expect(screen.getByText(difficulty)).toBeInTheDocument();
  });

  it("applies the difficulty color class", () => {
    render(<DifficultyBadge difficulty="Hard" />);
    expect(screen.getByText("Hard").className).toContain("text-hard");
  });

  it("falls back to muted styling for unknown values", () => {
    render(<DifficultyBadge difficulty="Unknown" />);
    expect(screen.getByText("Unknown").className).toContain(
      "text-muted-foreground",
    );
  });
});
