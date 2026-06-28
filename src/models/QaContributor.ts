import mongoose, { Schema, type Model, type Types } from "mongoose";

export type QaContributorStatus = "pending" | "approved" | "rejected";

export interface QaContributorDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  email: string;
  motivation: string;
  focusAreas: string[];
  experience: string;
  github?: string;
  status: QaContributorStatus;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const qaContributorSchema = new Schema<QaContributorDoc>(
  {
    // One application/membership per user.
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    motivation: { type: String, required: true },
    focusAreas: { type: [String], default: [] },
    experience: { type: String, default: "" },
    github: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const QaContributor =
  (mongoose.models.QaContributor as Model<QaContributorDoc>) ||
  mongoose.model<QaContributorDoc>("QaContributor", qaContributorSchema);
