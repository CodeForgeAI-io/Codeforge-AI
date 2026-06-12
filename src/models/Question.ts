import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { Difficulty } from "@/lib/constants";

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface QuestionTestCase {
  input: string;
  expected: string;
  hidden: boolean;
}

export interface QuestionDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  companies: string[];
  description: string;
  examples: QuestionExample[];
  constraints: string[];
  /** language id -> starter code */
  starterCode: Map<string, string>;
  testCases: QuestionTestCase[];
  solution?: string;
  editorial?: string;
  hints: string[];
  isPublished: boolean;
  source: "manual" | "json-import" | "ai-generated";
  createdBy?: Types.ObjectId;
  stats: { submissions: number; accepted: number };
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<QuestionDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    companies: { type: [String], default: [], index: true },
    description: { type: String, required: true },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: String,
      },
    ],
    constraints: { type: [String], default: [] },
    starterCode: { type: Map, of: String, default: {} },
    testCases: [
      {
        input: { type: String, required: true },
        expected: { type: String, required: true },
        hidden: { type: Boolean, default: false },
      },
    ],
    solution: String,
    editorial: String,
    hints: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
    source: {
      type: String,
      enum: ["manual", "json-import", "ai-generated"],
      default: "manual",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    stats: {
      submissions: { type: Number, default: 0 },
      accepted: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

questionSchema.index({ title: "text", tags: "text", category: "text" });

export const Question: Model<QuestionDoc> =
  (mongoose.models.Question as Model<QuestionDoc>) ||
  mongoose.model<QuestionDoc>("Question", questionSchema);
