import mongoose, { Schema, type Model, type Types } from "mongoose";

/** Monthly counter of AI-generated problems per user (separate from AI credits). */
export interface GenUsageDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  period: string; // "YYYY-MM"
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const genUsageSchema = new Schema<GenUsageDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

genUsageSchema.index({ user: 1, period: 1 }, { unique: true });

export const GenUsage =
  (mongoose.models.GenUsage as Model<GenUsageDoc>) ||
  mongoose.model<GenUsageDoc>("GenUsage", genUsageSchema);
