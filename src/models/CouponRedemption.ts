import mongoose, { Schema, type Model, type Types } from "mongoose";

/** One row per (coupon, user) redemption — enforces once-per-user and analytics. */
export interface CouponRedemptionDoc {
  _id: Types.ObjectId;
  coupon: Types.ObjectId;
  code: string;
  user: Types.ObjectId;
  discount: number; // rupees discounted
  createdAt: Date;
}

const couponRedemptionSchema = new Schema<CouponRedemptionDoc>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true, index: true },
    code: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    discount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

couponRedemptionSchema.index({ coupon: 1, user: 1 }, { unique: true });

export const CouponRedemption =
  (mongoose.models.CouponRedemption as Model<CouponRedemptionDoc>) ||
  mongoose.model<CouponRedemptionDoc>("CouponRedemption", couponRedemptionSchema);
