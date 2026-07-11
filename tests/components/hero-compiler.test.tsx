import { render, screen } from "@testing-library/react";
import { HeroCompiler } from "@/features/marketing/hero-compiler";

describe("HeroCompiler accessibility", () => {
  beforeEach(() => render(<HeroCompiler />));

  it("gives every interactive control an accessible name", () => {
    expect(screen.getByRole("button", { name: "Run code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset code" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "JavaScript playground editor" }),
    ).toBeInTheDocument();
  });

  it("exposes the output console as a polite live region", () => {
    const output = screen.getByRole("status", { name: "Program output" });
    expect(output).toHaveAttribute("aria-live", "polite");
  });
});
