import { render, screen } from "@testing-library/react";
import { TestResults } from "@/features/workspace/test-results";

describe("TestResults", () => {
  it("shows the empty state before any run", () => {
    render(
      <TestResults
        running={false}
        status={null}
        results={[]}
        passedCount={0}
        totalCount={0}
      />,
    );
    expect(
      screen.getByText(/run your code to see test results/i),
    ).toBeInTheDocument();
  });

  it("shows a running indicator", () => {
    render(
      <TestResults
        running
        status={null}
        results={[]}
        passedCount={0}
        totalCount={0}
      />,
    );
    expect(screen.getByText(/running your code/i)).toBeInTheDocument();
  });

  it("renders verdict and per-test details", () => {
    render(
      <TestResults
        running={false}
        status="Wrong Answer"
        results={[
          {
            input: "[1,2]\n3",
            expected: "[0,1]",
            actual: "[1,0]",
            passed: false,
            stderr: "",
          },
        ]}
        passedCount={0}
        totalCount={1}
      />,
    );
    expect(screen.getByText("Wrong Answer")).toBeInTheDocument();
    expect(screen.getByText("0/1 tests passed")).toBeInTheDocument();
    expect(screen.getByText("[1,0]")).toBeInTheDocument();
  });
});
