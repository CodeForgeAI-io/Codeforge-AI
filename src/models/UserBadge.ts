import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface UserBadgeDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  badge: Types.ObjectId;
  awardedAt: Date;
}

const userBadgeSchema = new Schema<UserBadgeDoc>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  badge: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
  awardedAt: { type: Date, default: Date.now },
});

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export const UserBadge: Model<UserBadgeDoc> =
  (mongoose.models.UserBadge as Model<UserBadgeDoc>) ||
  mongoose.model<UserBadgeDoc>("UserBadge", userBadgeSchema);
