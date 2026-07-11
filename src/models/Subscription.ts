import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface SubscriptionDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: "go" | "plus";
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  /** "order" = one-time payment, "subscription" = recurring auto-pay. */
  kind: "order" | "subscription";
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  couponCode?: string;
  discount?: number;
  status: "created" | "paid" | "failed" | "cancelled";
  /** Set on card-on-file trials: when the free trial ends and Razorpay makes
   *  the first real charge (subscription `start_at`). Absent for non-trials. */
  trialEndsAt?: Date;
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
    kind: { type: String, enum: ["order", "subscription"], default: "order" },
    razorpayOrderId: { type: String },
    razorpaySubscriptionId: { type: String, index: true },
    // Unique-but-sparse so each captured payment maps to exactly one invoice
    // and webhook re-deliveries cannot create duplicates.
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    status: { type: String, enum: ["created", "paid", "failed", "cancelled"], default: "created" },
    trialEndsAt: { type: Date },
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true },
);

export const Subscription: Model<SubscriptionDoc> =
  (mongoose.models.Subscription as Model<SubscriptionDoc>) ||
  mongoose.model<SubscriptionDoc>("Subscription", subscriptionSchema);
