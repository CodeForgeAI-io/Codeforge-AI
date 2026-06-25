import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface CouponDoc {
  _id: Types.ObjectId;
  code: string; // stored uppercase
  description?: string;
  type: "percent" | "flat";
  value: number; // percent (0–100) or flat rupees
  minAmount: number; // minimum order (rupees) to qualify
  maxRedemptions: number; // -1 = unlimited
  usedCount: number;
  oncePerUser: boolean;
  plans: ("go" | "plus")[]; // empty = all paid plans
  expiresAt?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<CouponDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, default: 0 },
    maxRedemptions: { type: Number, default: -1 },
    usedCount: { type: Number, default: 0 },
    oncePerUser: { type: Boolean, default: true },
    plans: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon =
  (mongoose.models.Coupon as Model<CouponDoc>) ||
  mongoose.model<CouponDoc>("Coupon", couponSchema);
