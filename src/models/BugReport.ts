import mongoose, { Schema, type Model, type Types } from "mongoose";

export type BugSeverity = "low" | "medium" | "high" | "critical";
export type BugStatus = "new" | "triaged" | "in_progress" | "fixed" | "wontfix" | "duplicate";

export const BUG_AREAS = [
  "Problems / Editor",
  "Compiler",
  "AI Tools",
  "Contests",
  "Auth / Account",
  "Billing",
  "UI / Layout",
  "Performance",
  "Other",
] as const;

export interface BugReportDoc {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
  reporterName: string;
  title: string;
  area: string;
  severity: BugSeverity;
  steps: string;
  expected: string;
  actual: string;
  environment: string;
  url?: string;
  screenshotUrl?: string;
  status: BugStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bugReportSchema = new Schema<BugReportDoc>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reporterName: { type: String, default: "" },
    title: { type: String, required: true },
    area: { type: String, default: "Other" },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    steps: { type: String, required: true },
    expected: { type: String, default: "" },
    actual: { type: String, default: "" },
    environment: { type: String, default: "" },
    url: { type: String, default: "" },
    screenshotUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "triaged", "in_progress", "fixed", "wontfix", "duplicate"],
      default: "new",
      index: true,
    },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export const BugReport =
  (mongoose.models.BugReport as Model<BugReportDoc>) ||
  mongoose.model<BugReportDoc>("BugReport", bugReportSchema);
