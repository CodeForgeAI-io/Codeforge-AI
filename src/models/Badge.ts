import mongoose, { Schema, type Model, type Types } from "mongoose";

export type BadgeCriteriaType =
  | "solved_total"
  | "solved_easy"
  | "solved_medium"
  | "solved_hard"
  | "streak"
  | "frontend_completed"
  | "contest_participation"
  | "level";

export interface BadgeDoc {
  _id: Types.ObjectId;
  key: string;
  name: string;
  description: string;
  /** lucide icon name rendered in the UI */
  icon: string;
  tier: "bronze" | "silver" | "gold";
  criteria: { type: BadgeCriteriaType; threshold: number };
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new Schema<BadgeDoc>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "award" },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      default: "bronze",
    },
    criteria: {
      type: {
        type: String,
        enum: [
          "solved_total",
          "solved_easy",
          "solved_medium",
          "solved_hard",
          "streak",
          "frontend_completed",
          "contest_participation",
          "level",
        ],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

export const Badge: Model<BadgeDoc> =
  (mongoose.models.Badge as Model<BadgeDoc>) ||
  mongoose.model<BadgeDoc>("Badge", badgeSchema);
