import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { SubmissionStatus } from "@/lib/constants";

export interface SubmissionTestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  hidden: boolean;
  stderr?: string;
  timeMs?: number;
}

export interface SubmissionDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  kind: "dsa" | "frontend";
  question?: Types.ObjectId;
  challenge?: Types.ObjectId;
  contest?: Types.ObjectId;
  language?: string;
  code?: string;
  /** frontend submissions (array because Map keys can't contain ".") */
  files?: { path: string; code: string }[];
  status: SubmissionStatus;
  testResults: SubmissionTestResult[];
  passedCount: number;
  totalCount: number;
  runtimeMs?: number;
  memoryKb?: number;
  /** AI review for frontend submissions */
  aiReview?: { score: number; feedback: string };
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<SubmissionDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: { type: String, enum: ["dsa", "frontend"], default: "dsa" },
    question: { type: Schema.Types.ObjectId, ref: "Question", index: true },
    challenge: {
      type: Schema.Types.ObjectId,
      ref: "FrontendChallenge",
      index: true,
    },
    contest: { type: Schema.Types.ObjectId, ref: "Contest", index: true },
    language: String,
    code: String,
    files: [
      {
        path: { type: String, required: true },
        code: { type: String, default: "" },
      },
    ],
    status: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Internal Error",
      ],
      required: true,
      index: true,
    },
    testResults: [
      {
        input: String,
        expected: String,
        actual: String,
        passed: Boolean,
        hidden: Boolean,
        stderr: String,
        timeMs: Number,
      },
    ],
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    runtimeMs: Number,
    memoryKb: Number,
    aiReview: {
      score: Number,
      feedback: String,
    },
  },
  { timestamps: true },
);

submissionSchema.index({ user: 1, question: 1, status: 1 });
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ contest: 1, user: 1 });

export const Submission: Model<SubmissionDoc> =
  (mongoose.models.Submission as Model<SubmissionDoc>) ||
  mongoose.model<SubmissionDoc>("Submission", submissionSchema);
