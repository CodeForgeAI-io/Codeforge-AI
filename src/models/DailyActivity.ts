import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface DailyActivityDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  /** YYYY-MM-DD in UTC */
  date: string;
  submissions: number;
  accepted: number;
  xpEarned: number;
}

const dailyActivitySchema = new Schema<DailyActivityDoc>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  date: { type: String, required: true },
  submissions: { type: Number, default: 0 },
  accepted: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
});

dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export const DailyActivity: Model<DailyActivityDoc> =
  (mongoose.models.DailyActivity as Model<DailyActivityDoc>) ||
  mongoose.model<DailyActivityDoc>("DailyActivity", dailyActivitySchema);
