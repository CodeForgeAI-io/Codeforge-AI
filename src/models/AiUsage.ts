import mongoose, { Schema, type Model, type Types } from "mongoose";

/** Monthly AI-credit usage counter, one doc per user per period (YYYY-MM). */
export interface AiUsageDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  /** Billing period, "YYYY-MM" (UTC). */
  period: string;
  /** AI calls consumed this period. */
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiUsageSchema = new Schema<AiUsageDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    period: { type: String, required: true },
    used: { type: Number, default: 0 },
  },
  { timestamps: true },
);

aiUsageSchema.index({ user: 1, period: 1 }, { unique: true });

export const AiUsage: Model<AiUsageDoc> =
  (mongoose.models.AiUsage as Model<AiUsageDoc>) ||
  mongoose.model<AiUsageDoc>("AiUsage", aiUsageSchema);
