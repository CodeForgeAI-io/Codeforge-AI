import mongoose, { Schema, type Model } from "mongoose";

/** Maps an internal "{plan}_{cycle}" key to a Razorpay plan id (created once). */
export interface RazorpayPlanDoc {
  _id: string; // e.g. "go_monthly"
  planId: string; // Razorpay plan_xxx
  plan: string;
  cycle: string;
  amount: number; // paise
  updatedAt: Date;
}

const razorpayPlanSchema = new Schema<RazorpayPlanDoc>(
  {
    _id: { type: String, required: true },
    planId: { type: String, required: true },
    plan: { type: String, required: true },
    cycle: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true },
);

export const RazorpayPlan =
  (mongoose.models.RazorpayPlan as Model<RazorpayPlanDoc>) ||
  mongoose.model<RazorpayPlanDoc>("RazorpayPlan", razorpayPlanSchema);
