import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface SubscriptionDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: "go" | "plus";
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "created" | "paid" | "failed" | "cancelled";
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["go", "plus"], required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ["created", "paid", "failed", "cancelled"], default: "created" },
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true },
);

export const Subscription: Model<SubscriptionDoc> =
  (mongoose.models.Subscription as Model<SubscriptionDoc>) ||
  mongoose.model<SubscriptionDoc>("Subscription", subscriptionSchema);
