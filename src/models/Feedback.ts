import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface FeedbackDoc {
  _id: Types.ObjectId;
  type: "feature" | "bug" | "issue";
  title: string;
  description: string;
  email?: string;
  user?: Types.ObjectId | null;
  status: "new" | "read" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDoc>(
  {
    type: { type: String, enum: ["feature", "bug", "issue"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    email: { type: String, default: "" },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new", index: true },
  },
  { timestamps: true },
);

export const Feedback =
  (mongoose.models.Feedback as Model<FeedbackDoc>) ||
  mongoose.model<FeedbackDoc>("Feedback", feedbackSchema);
