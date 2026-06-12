import { questionInputSchema, questionImportSchema } from "@/schemas/question";

const validQuestion = {
  title: "Two Sum",
  difficulty: "Easy",
  category: "Arrays",
  tags: ["Array", "HashMap"],
  description:
    "Given an array and a target, return indices of two numbers adding to target.",
  examples: [{ input: "[2,7,11,15]\n9", output: "[0,1]" }],
  constraints: ["2 <= nums.length <= 10000"],
  starterCode: { javascript: "// code" },
  testCases: [{ input: "[2,7,11,15]\n9", expected: "[0,1]", hidden: false }],
  hints: ["Use a hash map"],
};

describe("questionInputSchema", () => {
  it("accepts a valid question", () => {
    const result = questionInputSchema.safeParse(validQuestion);
    expect(result.success).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const result = questionInputSchema.parse(validQuestion);
    expect(result.companies).toEqual([]);
    expect(result.isPublished).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const result = questionInputSchema.safeParse({
      ...validQuestion,
      difficulty: "Impossible",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported starter code languages", () => {
    const result = questionInputSchema.safeParse({
      ...validQuestion,
      starterCode: { brainfuck: "+++" },
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one test case", () => {
    const result = questionInputSchema.safeParse({
      ...validQuestion,
      testCases: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("questionImportSchema", () => {
  it("accepts a single question object", () => {
    expect(questionImportSchema.safeParse(validQuestion).success).toBe(true);
  });

  it("accepts an array of questions", () => {
    expect(
      questionImportSchema.safeParse([validQuestion, validQuestion]).success,
    ).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(questionImportSchema.safeParse([]).success).toBe(false);
  });
});
