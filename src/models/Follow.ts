import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface FollowDoc {
  _id: Types.ObjectId;
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<FollowDoc>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

export const Follow: Model<FollowDoc> =
  (mongoose.models.Follow as Model<FollowDoc>) ||
  mongoose.model<FollowDoc>("Follow", followSchema);
